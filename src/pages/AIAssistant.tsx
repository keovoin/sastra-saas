import React, { useState } from 'react'
import { useBusinessOS } from '@/context/BusinessContext'
import { getStoredApiKey, getStoredModel, getStoredBaseUrl, getStoredProvider } from '@/pages/Settings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles, Loader2, Plus, TrendingUp, TrendingDown, Lightbulb,
  AlertTriangle, Building2, Globe, Cpu, ShoppingCart, Key, Settings,
} from 'lucide-react'
import { toast } from 'sonner'

// Predefined AI-generated suggestions based on industry
const industrySuggestions: Record<string, { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] }> = {
  'SaaS / Technology': {
    strengths: [
      'Recurring revenue model with predictable cash flow',
      'Scalable infrastructure with low marginal cost per user',
      'Strong developer ecosystem and API-first architecture',
      'Data-driven decision making with built-in analytics',
    ],
    weaknesses: [
      'High customer acquisition cost in competitive market',
      'Dependency on third-party cloud providers (vendor lock-in)',
      'Technical debt from rapid iteration cycles',
      'Long sales cycles for enterprise tier customers',
    ],
    opportunities: [
      'AI/ML integration for product differentiation',
      'International expansion into underserved markets',
      'Partnership ecosystems and marketplace integrations',
      'Vertical-specific solutions for niche industries',
    ],
    threats: [
      'Well-funded competitors with larger marketing budgets',
      'Rapid technology shifts making current stack obsolete',
      'Increasing data privacy regulations (GDPR, CCPA, AI Act)',
      'Economic downturn reducing discretionary SaaS spend',
    ],
  },
  'E-Commerce / Retail': {
    strengths: [
      'Direct-to-consumer relationships and first-party data',
      'Established supply chain and fulfillment network',
      'Strong brand recognition in target demographic',
      'Omnichannel presence (online + physical locations)',
    ],
    weaknesses: [
      'Thin margins in commodity product categories',
      'High return rates impacting profitability',
      'Seasonal demand fluctuations requiring flexible staffing',
      'Legacy inventory management systems',
    ],
    opportunities: [
      'Social commerce and influencer-driven acquisition',
      'Subscription box models for recurring revenue',
      'AI-powered personalization increasing AOV',
      'Sustainable/eco-friendly product line expansion',
    ],
    threats: [
      'Amazon and big-box retailer market dominance',
      'Supply chain disruptions from geopolitical events',
      'Rising shipping costs and delivery expectations',
      'Consumer spending reduction during inflation',
    ],
  },
  'Healthcare / Biotech': {
    strengths: [
      'Proprietary research and patent portfolio',
      'Regulatory approvals creating barriers to entry',
      'Strong clinical trial pipeline with promising results',
      'Strategic hospital and provider partnerships',
    ],
    weaknesses: [
      'Long product development timelines (7-10 years)',
      'High R&D costs with uncertain outcomes',
      'Complex regulatory compliance requirements',
      'Limited commercialization experience for novel therapies',
    ],
    opportunities: [
      'Telehealth and remote monitoring expansion',
      'Personalized medicine driven by genomics data',
      'Aging population increasing demand for treatments',
      'AI-assisted diagnostics and drug discovery',
    ],
    threats: [
      'Patent cliff exposing products to generic competition',
      'Regulatory changes affecting pricing and reimbursement',
      'Clinical trial failures consuming R&D budget',
      'Public backlash on pharmaceutical pricing',
    ],
  },
  'Financial Services': {
    strengths: [
      'Large customer base with deep relationship data',
      'Regulatory licenses creating moat against new entrants',
      'Established trust and brand in risk-averse market',
      'Diversified revenue streams across products',
    ],
    weaknesses: [
      'Legacy core banking systems limiting agility',
      'Heavy compliance overhead increasing operational costs',
      'Slow digital transformation vs fintech competitors',
      'Branch network costs in shift to digital-first banking',
    ],
    opportunities: [
      'Embedded finance and Banking-as-a-Service (BaaS)',
      'Blockchain and DeFi integration for new products',
      'Underserved markets (unbanked/underbanked populations)',
      'AI-driven fraud detection and risk scoring',
    ],
    threats: [
      'Fintech disruption in payments and lending',
      'Cybersecurity threats and data breach liability',
      'Interest rate volatility impacting margins',
      'Regulatory tightening on crypto and digital assets',
    ],
  },
  'Manufacturing / Industrial': {
    strengths: [
      'Proprietary manufacturing processes and IP',
      'Established distribution and dealer networks',
      'Economies of scale reducing unit costs',
      'Long-term contracts providing revenue visibility',
    ],
    weaknesses: [
      'Capital-intensive operations with high fixed costs',
      'Skilled labor shortage in specialized roles',
      'Environmental compliance costs increasing annually',
      'Slow adoption of Industry 4.0 technologies',
    ],
    opportunities: [
      'Smart factory automation and IoT integration',
      'Reshoring trends bringing production back domestically',
      'Sustainable materials and circular economy models',
      'Additive manufacturing (3D printing) for custom parts',
    ],
    threats: [
      'Raw material price volatility and supply shortages',
      'Trade tariffs and geopolitical supply chain risks',
      'Cheaper imports from low-cost manufacturing regions',
      'Stricter environmental regulations and carbon taxes',
    ],
  },
}

const industries = Object.keys(industrySuggestions)
const industryIcons: Record<string, React.ElementType> = {
  'SaaS / Technology': Cpu,
  'E-Commerce / Retail': ShoppingCart,
  'Healthcare / Biotech': Plus,
  'Financial Services': Building2,
  'Manufacturing / Industrial': Globe,
}

type SwotCategory = 'strengths' | 'weaknesses' | 'opportunities' | 'threats'

const categoryConfig: Record<SwotCategory, { label: string; icon: React.ElementType; color: string; bg: string; type: 'strength' | 'weakness' | 'opportunity' | 'threat' }> = {
  strengths: { label: 'Strengths', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/10', type: 'strength' },
  weaknesses: { label: 'Weaknesses', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-500/10', type: 'weakness' },
  opportunities: { label: 'Opportunities', icon: Lightbulb, color: 'text-blue-600', bg: 'bg-blue-500/10', type: 'opportunity' },
  threats: { label: 'Threats', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-500/10', type: 'threat' },
}

export function AIAssistant() {
  const { addSwotItem, isAdmin } = useBusinessOS()
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [companyContext, setCompanyContext] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<typeof industrySuggestions[string] | null>(null)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())

  const handleGenerate = async () => {
    if (!selectedIndustry) {
      toast.error('Please select an industry')
      return
    }

    setIsGenerating(true)
    setSuggestions(null)
    setAddedItems(new Set())

    const apiKey = getStoredApiKey()
    const model = getStoredModel()
    const baseUrl = getStoredBaseUrl()

    if (apiKey) {
      // ─── Real AI Generation via OpenAI-compatible API ──────────────────────
      try {
        const prompt = `You are a senior business strategy consultant. Perform a SWOT analysis for a company in the "${selectedIndustry}" industry.${companyContext ? ` Additional context: ${companyContext}` : ''}

Return EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "strengths": ["item1", "item2", "item3", "item4"],
  "weaknesses": ["item1", "item2", "item3", "item4"],
  "opportunities": ["item1", "item2", "item3", "item4"],
  "threats": ["item1", "item2", "item3", "item4"]
}

Each item should be a specific, actionable insight (1-2 sentences). Focus on current market conditions and trends.`

        const endpoint = baseUrl.replace(/\/$/, '') + '/chat/completions'
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            max_tokens: 1000,
          }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err?.error?.message || `API error: ${response.status}`)
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || ''

        // Parse JSON from response (handle potential markdown code blocks)
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(jsonStr)

        if (parsed.strengths && parsed.weaknesses && parsed.opportunities && parsed.threats) {
          setSuggestions(parsed)
          toast.success('AI analysis complete!', { description: `Generated using ${model}` })
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error: any) {
        console.error('OpenAI error:', error)
        toast.error('AI generation failed', { description: error.message || 'Falling back to built-in suggestions.' })
        // Fallback to built-in suggestions
        const result = industrySuggestions[selectedIndustry]
        setSuggestions(result)
      }
    } else {
      // ─── Built-in Suggestions (no API key) ─────────────────────────────────
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const result = industrySuggestions[selectedIndustry]
      setSuggestions(result)
      toast.success('Strategy suggestions generated!', { description: `Based on ${selectedIndustry} industry analysis. Add your OpenAI key in Settings for AI-powered suggestions.` })
    }

    setIsGenerating(false)
  }

  const handleAddToBoard = async (text: string, category: SwotCategory) => {
    if (!isAdmin) {
      toast.error('Only admins can add items')
      return
    }

    const config = categoryConfig[category]
    await addSwotItem({ type: config.type, content: text, priority: 'Medium' })
    setAddedItems((prev) => new Set([...prev, text]))
    toast.success('Added to Strategy Board')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" />
          AI Strategy Assistant
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate SWOT analysis suggestions tailored to your industry. Add the best ones directly to your Strategy Board.
        </p>
      </div>

      {/* API Key Status Banner */}
      {!getStoredApiKey() ? (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-medium">No API key configured.</span>{' '}
              Using built-in suggestions. Add your OpenAI key for AI-powered generation.
            </p>
          </div>
          <a href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' })) }}>
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-accent">
              <Settings className="h-3 w-3" /> Settings
            </Badge>
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-4 py-3">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            <span className="font-medium">AI-powered mode active.</span>{' '}
            Using <code className="text-xs bg-emerald-100 dark:bg-emerald-900 px-1 rounded">{getStoredModel()}</code> via {getStoredProvider()}.
          </p>
        </div>
      )}

      {/* Input Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Configure Analysis</CardTitle>
          <CardDescription>Select your industry to generate relevant strategic insights.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Industry</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {industries.map((industry) => {
                const Icon = industryIcons[industry] || Globe
                return (
                  <button
                    key={industry}
                    onClick={() => setSelectedIndustry(industry)}
                    className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all ${
                      selectedIndustry === industry
                        ? 'border-primary bg-primary/5 ring-1 ring-primary font-medium'
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {industry}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Company Context (Optional)</Label>
            <Input
              id="context"
              value={companyContext}
              onChange={(e) => setCompanyContext(e.target.value)}
              placeholder="e.g., Series B startup, 50 employees, expanding to EU market..."
            />
            <p className="text-xs text-muted-foreground">Add context for more tailored suggestions.</p>
          </div>

          <Button onClick={handleGenerate} disabled={!selectedIndustry || isGenerating} className="gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? 'Analyzing...' : 'Generate Suggestions'}
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isGenerating && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-muted animate-spin border-t-primary" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-amber-500" />
            </div>
            <p className="mt-4 text-sm font-medium">Analyzing {selectedIndustry} landscape...</p>
            <p className="text-xs text-muted-foreground mt-1">Generating strategic recommendations</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {suggestions && !isGenerating && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Generated Suggestions</h2>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> AI Generated
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(categoryConfig) as SwotCategory[]).map((category) => {
              const config = categoryConfig[category]
              const Icon = config.icon
              const items = suggestions[category]

              return (
                <Card key={category} className="border-l-4" style={{ borderLeftColor: `var(--${config.color.replace('text-', '').split('-')[0]}-600, #6b7280)` }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-md p-1.5 ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <CardTitle className="text-sm">{config.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {items.map((item) => {
                      const isAdded = addedItems.has(item)
                      return (
                        <div
                          key={item}
                          className={`flex items-start gap-2 rounded-md border p-2.5 transition-all ${
                            isAdded ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' : 'border-border hover:bg-accent/50'
                          }`}
                        >
                          <p className="flex-1 text-xs leading-relaxed">{item}</p>
                          {isAdmin && (
                            <Button
                              variant={isAdded ? 'ghost' : 'outline'}
                              size="sm"
                              onClick={() => handleAddToBoard(item, category)}
                              disabled={isAdded}
                              className="shrink-0 h-7 text-[10px] gap-1"
                            >
                              {isAdded ? '✓ Added' : <><Plus className="h-3 w-3" /> Add</>}
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
