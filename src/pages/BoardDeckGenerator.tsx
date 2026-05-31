import { useState } from 'react'
import { useBusinessOS } from '@/context/BusinessContext'
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


// Prompts are now built dynamically in buildPrompt()


export function BoardDeckGenerator() {
  const { risks, swotItems, charters, activeProject } = useBusinessOS()
  const [sections, setSections] = useState<DeckSection[]>(initialSections)
  const [generatingAll, setGeneratingAll] = useState(false)

  // Build context from real data + demo defaults
  const context = {
    companyName: activeProject?.title || 'Sastra Technologies',
    mrr: MOCK_CONTEXT.mrr,
    mrrGrowth: MOCK_CONTEXT.mrrGrowth,
    runway: MOCK_CONTEXT.runway,
    teamSize: MOCK_CONTEXT.teamSize,
    activeCustomers: MOCK_CONTEXT.activeCustomers,
    churnRate: MOCK_CONTEXT.churnRate,
    nps: MOCK_CONTEXT.nps,
    pipeline: MOCK_CONTEXT.pipeline,
    topRisk: risks.length > 0 ? risks[0].description : MOCK_CONTEXT.topRisk,
    strategicGoal: MOCK_CONTEXT.strategicGoal,
    totalRisks: risks.length,
    activeRisks: risks.filter(r => r.status === 'Active').length,
    highSeverityRisks: risks.filter(r => r.severity > 15).length,
    swotCount: swotItems.length,
    strengths: swotItems.filter(s => s.type === 'strength').map(s => s.content).join('; '),
    weaknesses: swotItems.filter(s => s.type === 'weakness').map(s => s.content).join('; '),
    charterCount: charters.length,
  }

  const buildPrompt = (sectionId: string): string => {
    const baseContext = `Company: ${context.companyName}\nMRR: $${context.mrr.toLocaleString()} (+${context.mrrGrowth}% MoM)\nCustomers: ${context.activeCustomers}\nTeam: ${context.teamSize}\nRunway: ${context.runway} months\nChurn: ${context.churnRate}%\nNPS: ${context.nps}\nPipeline: $${context.pipeline.toLocaleString()}\nStrategic Goal: ${context.strategicGoal}`
    const riskContext = context.totalRisks > 0 ? `\nRisks tracked: ${context.totalRisks} (${context.activeRisks} active, ${context.highSeverityRisks} high severity)\nTop risk: ${context.topRisk}` : `\nTop risk: ${context.topRisk}`
    const swotContext = context.swotCount > 0 ? `\nSWOT items: ${context.swotCount}\nStrengths: ${context.strengths || 'None recorded'}\nWeaknesses: ${context.weaknesses || 'None recorded'}` : ''

    switch (sectionId) {
      case 'executive-summary': return `Write a concise executive summary for a board meeting deck.\n${baseContext}${riskContext}\nWrite 3-4 paragraphs covering: status overview, key wins, top challenges, and outlook. Professional but concise.`
      case 'key-metrics': return `Create a metrics summary for a board deck. Format as a structured report.\n${baseContext}\nPresent with context (trending, vs targets). Format clearly for board consumption.`
      case 'risk-overview': return `Write a risk overview section for a board meeting deck.\n${baseContext}${riskContext}\nList 3-4 key risks with severity, likelihood, mitigation status, and owner. Format professionally.`
      case 'strategic-progress': return `Write a strategic progress update for a board deck.\n${baseContext}${swotContext}\nCover: progress against goals, roadmap milestones, competitive wins. Be specific and measurable.`
      case 'financial-health': return `Write a financial health section for a board deck.\n${baseContext}\nCover: revenue trajectory, burn rate, unit economics health, fundraising considerations. Board-level language.`
      case 'team-updates': return `Write a team updates section for a board deck.\n${baseContext}${riskContext}\nCover: recent hires, open roles, team sentiment, org changes. Brief but informative.`
      default: return ''
    }
  }

  const generateSection = async (sectionId: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, generating: true } : s))
    const prompt = buildPrompt(sectionId)
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

  const saveDeck = () => {
    const deck = { sections: sections.filter(s => s.content), savedAt: new Date().toISOString(), company: context.companyName }
    localStorage.setItem('sastra-board-deck', JSON.stringify(deck))
    toast.success('Board deck saved!')
  }

  const copyDeck = () => {
    const text = sections.filter(s => s.content).map(s => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n')
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard!')).catch(() => toast.error('Failed to copy'))
  }


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
          {completedCount > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={saveDeck}>Save</Button>
              <Button variant="outline" size="sm" onClick={copyDeck}>Copy</Button>
            </>
          )}
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
              <p className="text-lg font-bold text-foreground">${context.mrr.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Growth</p>
              <p className="text-lg font-bold text-green-600">+{context.mrrGrowth}% MoM</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Customers</p>
              <p className="text-lg font-bold text-foreground">{context.activeCustomers}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Runway</p>
              <p className="text-lg font-bold text-foreground">{context.runway} months</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Team Size</p>
              <p className="text-lg font-bold text-foreground">{context.teamSize}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Churn</p>
              <p className="text-lg font-bold text-foreground">{context.churnRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Risks Tracked</p>
              <p className="text-lg font-bold text-foreground">{context.totalRisks}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground">Pipeline</p>
              <p className="text-lg font-bold text-foreground">${(context.pipeline / 1000).toFixed(0)}K</p>
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
                <h2 className="text-2xl font-bold text-foreground">{context.companyName}</h2>
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
