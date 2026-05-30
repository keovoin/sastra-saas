import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Scale, Calendar, User, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'


interface Decision { id: string; title: string; date: string; decider: string; context: string; alternatives: string[]; outcome: string; status: 'Decided' | 'Pending' | 'Revisit' }

const defaultDecisions: Decision[] = [
  { id: '1', title: 'Adopt trunk-based development', date: '2025-01-12', decider: 'Priya Sharma', context: 'Feature branches causing long-lived merge conflicts. Sprint velocity dropping due to integration issues.', alternatives: ['Keep feature branches with shorter lifespan', 'Move to GitFlow model', 'Trunk-based with feature flags'], outcome: 'Trunk-based with feature flags. CI/CD enforces all PRs merge within 24h.', status: 'Decided' },
  { id: '2', title: 'Migrate from AWS to multi-cloud', date: '2025-01-08', decider: 'Jennifer Walsh', context: 'Vendor lock-in risk scored 16/25. AWS costs growing 15% QoQ. Need negotiation leverage.', alternatives: ['Stay AWS-only with reserved instances', 'Migrate critical services to GCP', 'Adopt Kubernetes for portability'], outcome: 'Kubernetes on EKS now, plan GCP DR site by Q3.', status: 'Decided' },
  { id: '3', title: 'AI pricing model for enterprise tier', date: '2025-01-20', decider: 'Marcus Johnson', context: 'AI features launching Q2. Need pricing strategy that covers API costs while remaining competitive.', alternatives: ['Per-seat flat fee including AI', 'Usage-based (per AI query)', 'Hybrid: base seat + AI credits'], outcome: '', status: 'Pending' },
]

const statusColors: Record<string, string> = { Decided: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', Revisit: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' }

export function DecisionLog() {
  const [decisions, setDecisions] = useState<Decision[]>(defaultDecisions)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState({ title: '', decider: '', context: '', alternatives: '', outcome: '' })

  const handleCreate = () => {
    if (!form.title.trim()) return
    const newDecision: Decision = { id: Date.now().toString(), title: form.title, date: new Date().toISOString().split('T')[0], decider: form.decider || 'Unassigned', context: form.context, alternatives: form.alternatives.split('\n').filter(Boolean), outcome: form.outcome, status: form.outcome ? 'Decided' : 'Pending' }
    setDecisions((prev) => [newDecision, ...prev])
    setForm({ title: '', decider: '', context: '', alternatives: '', outcome: '' })
    setIsCreating(false)
    toast.success('Decision recorded')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Scale className="h-6 w-6 text-sky-600" /> Decision Log</h1><p className="mt-1 text-sm text-muted-foreground">Record strategic decisions with full context and alternatives considered.</p></div><Button onClick={() => setIsCreating(true)} className="gap-2"><Plus className="h-4 w-4" /> Log Decision</Button></div>

      {isCreating && (
        <Card className="max-w-2xl"><CardContent className="p-6 space-y-4">
          <div className="space-y-2"><Label>Decision Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Adopt trunk-based development" /></div>
          <div className="space-y-2"><Label>Decision Maker</Label><Input value={form.decider} onChange={(e) => setForm({ ...form, decider: e.target.value })} placeholder="Who made this decision?" /></div>
          <div className="space-y-2"><Label>Context / Problem</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} placeholder="What problem or situation prompted this decision?" /></div>
          <div className="space-y-2"><Label>Alternatives Considered (one per line)</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.alternatives} onChange={(e) => setForm({ ...form, alternatives: e.target.value })} placeholder="Option A&#10;Option B&#10;Option C" /></div>
          <div className="space-y-2"><Label>Outcome / Final Decision</Label><Input value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} placeholder="What was decided? Leave blank if pending." /></div>
          <div className="flex gap-2"><Button onClick={handleCreate} disabled={!form.title.trim()}>Save Decision</Button><Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button></div>
        </CardContent></Card>
      )}

      <div className="space-y-4">{decisions.map((d) => (
        <Card key={d.id}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1"><Badge className={`text-[10px] ${statusColors[d.status]}`}>{d.status}</Badge><span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{d.date}</span><span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{d.decider}</span></div>
                <h3 className="text-base font-semibold mb-2">{d.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{d.context}</p>
                {d.alternatives.length > 0 && (<div className="mb-3"><p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Alternatives Considered</p><div className="space-y-1">{d.alternatives.map((a, i) => (<p key={i} className="text-sm flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />{a}</p>))}</div></div>)}
                {d.outcome && (<div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3"><p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400 mb-1">Outcome</p><p className="text-sm text-emerald-800 dark:text-emerald-300">{d.outcome}</p></div>)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}</div>
    </div>
  )
}
