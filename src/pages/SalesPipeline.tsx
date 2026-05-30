import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Pipette, Plus, Sparkles, ArrowRight, DollarSign, Users } from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAI } from '@/lib/ai'

interface Deal {
  id: string
  company: string
  value: number
  contact: string
  probability: number
  nextAction: string
  date: string
  stage: Stage
}

type Stage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'

const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: 'lead', label: 'Lead', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  { id: 'qualified', label: 'Qualified', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  { id: 'proposal', label: 'Proposal', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  { id: 'closed-won', label: 'Closed Won', color: 'bg-green-500/10 text-green-600 border-green-200' },
  { id: 'closed-lost', label: 'Closed Lost', color: 'bg-red-500/10 text-red-600 border-red-200' },
]

const initialDeals: Deal[] = [
  { id: '1', company: 'Acme Corp', value: 48000, contact: 'Sarah Chen', probability: 20, nextAction: 'Schedule discovery call', date: '2024-03-15', stage: 'lead' },
  { id: '2', company: 'TechFlow Inc', value: 125000, contact: 'Marcus Rivera', probability: 40, nextAction: 'Send case study', date: '2024-03-12', stage: 'qualified' },
  { id: '3', company: 'DataVault Systems', value: 85000, contact: 'Emily Watson', probability: 60, nextAction: 'Finalize proposal deck', date: '2024-03-10', stage: 'proposal' },
  { id: '4', company: 'CloudNine Solutions', value: 200000, contact: 'James Park', probability: 75, nextAction: 'Negotiate payment terms', date: '2024-03-08', stage: 'negotiation' },
  { id: '5', company: 'Quantum Analytics', value: 67000, contact: 'Lisa Thompson', probability: 90, nextAction: 'Process signed contract', date: '2024-02-28', stage: 'closed-won' },
  { id: '6', company: 'NovaTech Labs', value: 35000, contact: 'Alex Kim', probability: 25, nextAction: 'Follow up next quarter', date: '2024-03-01', stage: 'lead' },
  { id: '7', company: 'Meridian Health', value: 150000, contact: 'David Okafor', probability: 0, nextAction: 'Lost to competitor', date: '2024-02-20', stage: 'closed-lost' },
  { id: '8', company: 'Synapse Digital', value: 92000, contact: 'Rachel Green', probability: 55, nextAction: 'Demo follow-up meeting', date: '2024-03-14', stage: 'proposal' },
]

export function SalesPipeline() {
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [showForm, setShowForm] = useState(false)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [newDeal, setNewDeal] = useState({ company: '', value: '', contact: '', nextAction: '', probability: '' })

  const moveDeal = (dealId: string, direction: 'forward' | 'backward') => {
    setDeals(prev => prev.map(deal => {
      if (deal.id !== dealId) return deal
      const currentIdx = STAGES.findIndex(s => s.id === deal.stage)
      const nextIdx = direction === 'forward' ? currentIdx + 1 : currentIdx - 1
      if (nextIdx < 0 || nextIdx >= STAGES.length) return deal
      toast.success(`Moved ${deal.company} to ${STAGES[nextIdx].label}`)
      return { ...deal, stage: STAGES[nextIdx].id }
    }))
  }

  const addDeal = () => {
    if (!newDeal.company || !newDeal.value || !newDeal.contact) {
      toast.error('Please fill in company, value, and contact')
      return
    }
    const deal: Deal = {
      id: Date.now().toString(),
      company: newDeal.company,
      value: parseFloat(newDeal.value),
      contact: newDeal.contact,
      probability: parseInt(newDeal.probability) || 20,
      nextAction: newDeal.nextAction || 'Schedule intro call',
      date: new Date().toISOString().split('T')[0],
      stage: 'lead',
    }
    setDeals(prev => [...prev, deal])
    setNewDeal({ company: '', value: '', contact: '', nextAction: '', probability: '' })
    setShowForm(false)
    toast.success(`Added ${deal.company} to pipeline`)
  }

  const suggestNextAction = async (deal: Deal) => {
    setAiLoading(deal.id)
    const prompt = `You are a sales advisor. Given this deal:
- Company: ${deal.company}
- Value: $${deal.value.toLocaleString()}
- Contact: ${deal.contact}
- Current Stage: ${deal.stage}
- Probability: ${deal.probability}%
- Current Next Action: ${deal.nextAction}

Suggest a specific, actionable next step to move this deal forward. Be concise (1-2 sentences max).`

    const result = await askAI(prompt)
    setAiLoading(null)
    if (result.success) {
      setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, nextAction: result.content.trim() } : d))
      toast.success('AI suggestion applied')
    } else {
      toast.error(result.error || 'AI request failed')
    }
  }

  const totalPipeline = deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage)).reduce((sum, d) => sum + d.value, 0)
  const wonValue = deals.filter(d => d.stage === 'closed-won').reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Pipette className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sales Pipeline</h1>
              <p className="text-muted-foreground">Track deals through your sales funnel from lead to close</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Add Deal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active Pipeline</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">${totalPipeline.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Won Revenue</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">${wonValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active Deals</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage)).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Deal Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Deal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input placeholder="Acme Corp" value={newDeal.company} onChange={e => setNewDeal(p => ({ ...p, company: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Deal Value ($)</Label>
                <Input type="number" placeholder="50000" value={newDeal.value} onChange={e => setNewDeal(p => ({ ...p, value: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input placeholder="John Doe" value={newDeal.contact} onChange={e => setNewDeal(p => ({ ...p, contact: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Probability (%)</Label>
                <Input type="number" placeholder="20" value={newDeal.probability} onChange={e => setNewDeal(p => ({ ...p, probability: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Next Action</Label>
                <Input placeholder="Schedule discovery call" value={newDeal.nextAction} onChange={e => setNewDeal(p => ({ ...p, nextAction: e.target.value }))} />
              </div>
              <div className="flex items-end">
                <Button onClick={addDeal} className="w-full">Add to Pipeline</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.id)
          const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0)
          return (
            <div key={stage.id} className="space-y-3">
              <div className={`p-3 rounded-lg border ${stage.color}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{stage.label}</span>
                  <Badge variant="secondary" className="text-xs">{stageDeals.length}</Badge>
                </div>
                <p className="text-xs mt-1 opacity-75">${stageValue.toLocaleString()}</p>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {stageDeals.map(deal => (
                  <Card key={deal.id} className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground truncate">{deal.company}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">${deal.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{deal.contact}</p>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${deal.probability}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">{deal.nextAction}</p>
                    <p className="text-xs text-muted-foreground">{deal.date}</p>
                    <div className="flex gap-1 flex-wrap">
                      {stage.id !== 'lead' && stage.id !== 'closed-lost' && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-1" onClick={() => moveDeal(deal.id, 'backward')}>
                          ← Back
                        </Button>
                      )}
                      {stage.id !== 'closed-won' && stage.id !== 'closed-lost' && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-1" onClick={() => moveDeal(deal.id, 'forward')}>
                          Next →
                        </Button>
                      )}
                    </div>
                    {isAIConfigured() && stage.id !== 'closed-won' && stage.id !== 'closed-lost' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-xs"
                        disabled={aiLoading === deal.id}
                        onClick={() => suggestNextAction(deal)}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {aiLoading === deal.id ? 'Thinking...' : 'AI Suggest'}
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
