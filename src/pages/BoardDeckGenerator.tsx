import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Presentation, Sparkles, FileText, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAI } from '@/lib/ai'


interface DeckSection {
  id: string
  title: string
  description: string
  content: string
  generating: boolean
}

const MOCK_CONTEXT = {
  companyName: 'Sastra Technologies',
  mrr: 142000,
  mrrGrowth: 12,
  runway: 18,
  teamSize: 24,
  activeCustomers: 340,
  churnRate: 4.2,
  nps: 62,
  pipeline: 850000,
  topRisk: 'Engineering hiring delays impacting Q2 roadmap',
  strategicGoal: 'Reach $200K MRR by Q3 2024',
}

const initialSections: DeckSection[] = [
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    description: 'High-level overview of company status, wins, and challenges',
    content: '',
    generating: false,
  },
  {
    id: 'key-metrics',
    title: 'Key Metrics',
    description: 'MRR, growth rate, customers, churn, and NPS',
    content: '',
    generating: false,
  },
  {
    id: 'risk-overview',
    title: 'Risk Overview',
    description: 'Top risks, mitigations, and risk score changes',
    content: '',
    generating: false,
  },
  {
    id: 'strategic-progress',
    title: 'Strategic Progress',
    description: 'OKR progress, roadmap status, and competitive positioning',
    content: '',
    generating: false,
  },
  {
    id: 'financial-health',
    title: 'Financial Health',
    description: 'Runway, burn rate, revenue forecast, and unit economics',
    content: '',
    generating: false,
  },
  {
    id: 'team-updates',
    title: 'Team Updates',
    description: 'Hiring, team pulse, organizational changes',
    content: '',
    generating: false,
  },
]


const SECTION_PROMPTS: Record<string, string> = {
  'executive-summary': `Write a concise executive summary for a board meeting deck for ${MOCK_CONTEXT.companyName}.
Key facts: MRR $${MOCK_CONTEXT.mrr.toLocaleString()} (+${MOCK_CONTEXT.mrrGrowth}% MoM), ${MOCK_CONTEXT.activeCustomers} customers, ${MOCK_CONTEXT.teamSize} team members, ${MOCK_CONTEXT.runway} months runway.
Strategic goal: ${MOCK_CONTEXT.strategicGoal}
Write 3-4 paragraphs covering: status overview, key wins this month, top challenges, and outlook. Be professional but concise.`,

  'key-metrics': `Create a metrics summary for a board deck. Format as a structured report.
Current metrics for ${MOCK_CONTEXT.companyName}:
- MRR: $${MOCK_CONTEXT.mrr.toLocaleString()} (+${MOCK_CONTEXT.mrrGrowth}% MoM)
- Active Customers: ${MOCK_CONTEXT.activeCustomers}
- Monthly Churn: ${MOCK_CONTEXT.churnRate}%
- NPS Score: ${MOCK_CONTEXT.nps}
- Pipeline Value: $${MOCK_CONTEXT.pipeline.toLocaleString()}
- Team Size: ${MOCK_CONTEXT.teamSize}
Present these with context (whether trending up/down, vs targets). Format clearly for board consumption.`,

  'risk-overview': `Write a risk overview section for a board meeting deck.
Company: ${MOCK_CONTEXT.companyName}
Top identified risk: ${MOCK_CONTEXT.topRisk}
Additional context: ${MOCK_CONTEXT.runway} months runway, ${MOCK_CONTEXT.churnRate}% churn, growing team of ${MOCK_CONTEXT.teamSize}.
List 3-4 key risks with severity, likelihood, mitigation status, and owner. Format professionally.`,

  'strategic-progress': `Write a strategic progress update for a board deck.
Company: ${MOCK_CONTEXT.companyName}
Strategic Goal: ${MOCK_CONTEXT.strategicGoal}
Current MRR: $${MOCK_CONTEXT.mrr.toLocaleString()} (need $200K)
Pipeline: $${MOCK_CONTEXT.pipeline.toLocaleString()}
Cover: progress against OKRs, roadmap milestones hit/missed, competitive wins, strategic decisions made. Be specific and measurable.`,

  'financial-health': `Write a financial health section for a board deck.
Company: ${MOCK_CONTEXT.companyName}
- MRR: $${MOCK_CONTEXT.mrr.toLocaleString()}
- MRR Growth: ${MOCK_CONTEXT.mrrGrowth}% MoM
- Runway: ${MOCK_CONTEXT.runway} months
- Churn: ${MOCK_CONTEXT.churnRate}%
- Customers: ${MOCK_CONTEXT.activeCustomers}
Cover: revenue trajectory, burn rate commentary, unit economics health, and fundraising considerations. Professional board-level language.`,

  'team-updates': `Write a team updates section for a board deck.
Company: ${MOCK_CONTEXT.companyName}
Team size: ${MOCK_CONTEXT.teamSize}
Context: Engineering hiring is a top risk. Team pulse scores trending positive (4.2/5 average).
Cover: recent hires, open roles, team sentiment, any org changes, culture initiatives. Keep it brief but informative for board members.`,
}


export function BoardDeckGenerator() {
  const [sections, setSections] = useState<DeckSection[]>(initialSections)
  const [generatingAll, setGeneratingAll] = useState(false)

  const generateSection = async (sectionId: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, generating: true } : s))

    const prompt = SECTION_PROMPTS[sectionId]
    if (!prompt) {
      toast.error('No prompt configured for this section')
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, generating: false } : s))
      return
    }

    const result = await askAI(prompt)

    if (result.success) {
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, content: result.content, generating: false } : s))
      toast.success(`Generated: ${sections.find(s => s.id === sectionId)?.title}`)
    } else {
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, generating: false } : s))
      toast.error(result.error || 'Generation failed')
    }
  }

  const generateFullDeck = async () => {
    if (!isAIConfigured()) {
      toast.error('Please configure AI in Settings first')
      return
    }
    setGeneratingAll(true)
    for (const section of sections) {
      await generateSection(section.id)
    }
    setGeneratingAll(false)
    toast.success('Full board deck generated!')
  }

  const completedCount = sections.filter(s => s.content).length
  const aiReady = isAIConfigured()


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <Presentation className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Board Deck Generator</h1>
            <p className="text-muted-foreground">AI-powered investor update deck built from your company data</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{completedCount}/{sections.length} sections</Badge>
          {aiReady && (
            <Button onClick={generateFullDeck} disabled={generatingAll}>
              <Sparkles className="h-4 w-4 mr-2" />
              {generatingAll ? 'Generating...' : 'Generate Full Deck'}
            </Button>
          )}
        </div>
      </div>

      {/* AI Notice */}
      {!aiReady && (
        <Card className="border-amber-200 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-amber-700">
              AI is not configured. Go to Settings to add your API key and enable AI-powered deck generation.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Context Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Context</CardTitle>
          <CardDescription>These metrics will be used to generate your board deck</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">MRR</p>
              <p className="text-lg font-bold text-foreground">${MOCK_CONTEXT.mrr.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Growth</p>
              <p className="text-lg font-bold text-green-600">+{MOCK_CONTEXT.mrrGrowth}% MoM</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Customers</p>
              <p className="text-lg font-bold text-foreground">{MOCK_CONTEXT.activeCustomers}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Runway</p>
              <p className="text-lg font-bold text-foreground">{MOCK_CONTEXT.runway} months</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Team Size</p>
              <p className="text-lg font-bold text-foreground">{MOCK_CONTEXT.teamSize}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Churn</p>
              <p className="text-lg font-bold text-foreground">{MOCK_CONTEXT.churnRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">NPS</p>
              <p className="text-lg font-bold text-foreground">{MOCK_CONTEXT.nps}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Pipeline</p>
              <p className="text-lg font-bold text-foreground">${(MOCK_CONTEXT.pipeline / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section, idx) => (
          <Card key={section.id} className={section.content ? 'border-green-200' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {idx + 1}
                  </div>
                  <div>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {section.content && <Badge className="bg-green-100 text-green-700 border-green-200">Generated</Badge>}
                  {aiReady && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateSection(section.id)}
                      disabled={section.generating || generatingAll}
                    >
                      {section.generating ? (
                        <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Generating...</>
                      ) : section.content ? (
                        <><RefreshCw className="h-3 w-3 mr-1" /> Regenerate</>
                      ) : (
                        <><Sparkles className="h-3 w-3 mr-1" /> Generate</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {section.content && (
              <CardContent>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                    {section.content}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Document Preview */}
      {completedCount > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Document Preview
              </CardTitle>
              <Badge variant="secondary">{completedCount} of {sections.length} sections complete</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 p-6 bg-white dark:bg-slate-900 rounded-lg border border-border">
              <div className="text-center border-b border-border pb-6">
                <h2 className="text-2xl font-bold text-foreground">{MOCK_CONTEXT.companyName}</h2>
                <p className="text-muted-foreground">Board Update — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
              {sections.filter(s => s.content).map(section => (
                <div key={section.id} className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground border-b border-border pb-1">{section.title}</h3>
                  <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{section.content}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
