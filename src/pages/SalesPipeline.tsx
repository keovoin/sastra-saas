import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pipette, Plus, Sparkles, DollarSign, Users, GripVertical, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAI } from '@/lib/ai'
import { useData } from '@/context/DataContext'
import type { PipelineDeal } from '@/context/DataContext'

interface Deal {
  id: string
  company: string
  value: number
  contact: string
  probability: number
  nextAction: string
  stage: Stage
  assignee: string
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

// Map DB deals to local shape
function mapDeal(d: PipelineDeal): Deal {
  return { id: d.id, company: d.company, value: d.value, contact: d.contact, probability: d.probability, nextAction: d.next_action, stage: d.stage as Stage, assignee: d.assignee }
}

export function SalesPipeline() {
  const { deals: dbDeals, addDeal: ctxAddDeal, updateDeal: ctxUpdateDeal, deleteDeal: ctxDeleteDeal } = useData()
  const deals = dbDeals.map(mapDeal)
  const [showForm, setShowForm] = useState(false)
  const [detailDeal, setDetailDeal] = useState<Deal | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [newDeal, setNewDeal] = useState({ company: '', value: '', contact: '', nextAction: '', probability: '', assignee: '' })

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', dealId)
    ;(e.currentTarget as HTMLElement).style.opacity = '0.5'
  }
  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1'
    setDraggedDealId(null)
    setDragOverStage(null)
  }
  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stageId)
  }
  const handleDrop = (e: React.DragEvent, stageId: Stage) => {
    e.preventDefault()
    const dealId = e.dataTransfer.getData('text/plain')
    if (dealId) {
      const deal = deals.find(d => d.id === dealId)
      if (deal && deal.stage !== stageId) {
        ctxUpdateDeal(dealId, { stage: stageId })
        const stage = STAGES.find(s => s.id === stageId)
        toast.success(`Moved ${deal.company} to ${stage?.label}`)
      }
    }
    setDragOverStage(null)
    setDraggedDealId(null)
  }

  const addDeal = () => {
    if (!newDeal.company || !newDeal.value || !newDeal.contact) {
      toast.error('Please fill in company, value, and contact')
      return
    }
    ctxAddDeal({
      company: newDeal.company,
      value: parseFloat(newDeal.value),
      contact: newDeal.contact,
      probability: parseInt(newDeal.probability) || 20,
      next_action: newDeal.nextAction || 'Schedule intro call',
      stage: 'lead',
      assignee: newDeal.assignee || '',
    })
    setNewDeal({ company: '', value: '', contact: '', nextAction: '', probability: '', assignee: '' })
    setShowForm(false)
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
      ctxUpdateDeal(deal.id, { next_action: result.content.trim() })
      setDetailDeal({ ...deal, nextAction: result.content.trim() })
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

      {/* Add Deal Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Deal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Company Name *</Label><Input placeholder="Acme Corp" value={newDeal.company} onChange={e => setNewDeal(p => ({ ...p, company: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Deal Value ($) *</Label><Input type="number" placeholder="50000" value={newDeal.value} onChange={e => setNewDeal(p => ({ ...p, value: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Contact Name *</Label><Input placeholder="John Doe" value={newDeal.contact} onChange={e => setNewDeal(p => ({ ...p, contact: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Probability (%)</Label><Input type="number" placeholder="20" value={newDeal.probability} onChange={e => setNewDeal(p => ({ ...p, probability: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Next Action</Label><Input placeholder="Schedule discovery call" value={newDeal.nextAction} onChange={e => setNewDeal(p => ({ ...p, nextAction: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Assign To</Label><Input placeholder="Team member" value={newDeal.assignee} onChange={e => setNewDeal(p => ({ ...p, assignee: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={addDeal}>Add to Pipeline</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Detail Dialog */}
      <Dialog open={!!detailDeal} onOpenChange={() => setDetailDeal(null)}>
        <DialogContent>
          {detailDeal && (
            <>
              <DialogHeader><DialogTitle>{detailDeal.company}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Value:</span> <span className="font-medium">${detailDeal.value.toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{detailDeal.contact}</span></div>
                  <div><span className="text-muted-foreground">Stage:</span> <Badge variant="secondary">{STAGES.find(s => s.id === detailDeal.stage)?.label}</Badge></div>
                  <div><span className="text-muted-foreground">Probability:</span> <span className="font-medium">{detailDeal.probability}%</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Next Action:</span> <span className="font-medium">{detailDeal.nextAction}</span></div>
                </div>
                {isAIConfigured() && (
                  <Button variant="outline" size="sm" onClick={() => suggestNextAction(detailDeal)} disabled={aiLoading === detailDeal.id}>
                    <Sparkles className="h-3 w-3 mr-1" />{aiLoading === detailDeal.id ? 'Thinking...' : 'AI Suggest Next Action'}
                  </Button>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" className="text-red-500" onClick={() => { ctxDeleteDeal(detailDeal.id); setDetailDeal(null) }}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
                <Button variant="outline" onClick={() => setDetailDeal(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Kanban Board with Drag & Drop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.id)
          const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0)
          const isDragOver = dragOverStage === stage.id
          return (
            <div key={stage.id} className="space-y-3"
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className={`p-3 rounded-lg border ${stage.color} transition-all ${isDragOver ? 'ring-2 ring-violet-400 scale-[1.02]' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{stage.label}</span>
                  <Badge variant="secondary" className="text-xs">{stageDeals.length}</Badge>
                </div>
                <p className="text-xs mt-1 opacity-75">${stageValue.toLocaleString()}</p>
              </div>
              <div className={`space-y-2 min-h-[200px] rounded-lg p-1 transition-all ${isDragOver ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''}`}>
                {stageDeals.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border border-dashed rounded-md">Drop deals here</div>
                )}
                {stageDeals.map(deal => (
                  <Card key={deal.id} className={`p-3 space-y-2 cursor-pointer hover-lift ${draggedDealId === deal.id ? 'opacity-50' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setDetailDeal(deal)}
                  >
                    <div className="flex items-center justify-between">
                      <GripVertical className="h-3 w-3 text-muted-foreground/50 cursor-grab" />
                      <span className="font-medium text-sm text-foreground truncate flex-1 ml-1">{deal.company}</span>
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
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {deals.length === 0 && (
        <div className="text-center py-12 animate-fade-in-up">
          <Pipette className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No deals yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Add your first deal to start tracking your pipeline</p>
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" />Add First Deal</Button>
        </div>
      )}
    </div>
  )
}
