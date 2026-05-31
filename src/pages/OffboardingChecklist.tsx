import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { UserMinus, Plus, Sparkles, Trash2, CheckCircle2, Circle, X } from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAIJson } from '@/lib/ai'
import { useData } from '@/context/DataContext'

interface ChecklistStep { id: string; title: string; completed: boolean; dueDate: string }
interface Checklist { id: string; employeeName: string; department: string; lastDay: string; steps: ChecklistStep[]; createdAt: string }

const DEFAULT_TEMPLATE = [
  'Return company equipment (laptop, badge, keys)',
  'Revoke system access & accounts',
  'Transfer ownership of documents/repos',
  'Knowledge transfer sessions with replacement',
  'Exit interview scheduled',
  'Final payroll and benefits processing',
  'Remove from communication channels',
  'Collect company property inventory',
  'Update team documentation',
  'Send farewell announcement (if applicable)',
]


export function OffboardingChecklist() {
  const { offboardingChecklists: dbChecklists, addOffboarding, updateOffboarding, deleteOffboarding } = useData()
  const checklists = dbChecklists.map(c => ({
    id: c.id, employeeName: c.employee_name, department: c.department,
    lastDay: c.last_day || '', steps: c.steps as ChecklistStep[], createdAt: c.created_at,
  }))
  const [showCreate, setShowCreate] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [form, setForm] = useState({ employeeName: '', department: '', lastDay: '' })
  const [steps, setSteps] = useState<string[]>(DEFAULT_TEMPLATE)
  const [newStep, setNewStep] = useState('')

  const create = () => {
    if (!form.employeeName.trim()) { toast.error('Name required'); return }
    const stepsData = steps.map((title, i) => ({ id: crypto.randomUUID(), title, completed: false, dueDate: new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0] }))
    addOffboarding({
      employee_name: form.employeeName,
      department: form.department,
      last_day: form.lastDay || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      steps: stepsData,
    })
    setShowCreate(false)
    setForm({ employeeName: '', department: '', lastDay: '' })
    setSteps(DEFAULT_TEMPLATE)
  }

  const toggle = (clId: string, sId: string) => {
    const cl = checklists.find(c => c.id === clId)
    if (!cl) return
    const updatedSteps = cl.steps.map(s => s.id === sId ? { ...s, completed: !s.completed } : s)
    updateOffboarding(clId, { steps: updatedSteps })
  }

  const aiGen = async () => {
    if (!form.department) { toast.error('Enter department first'); return }
    setAiLoading(true)
    const r = await askAIJson<{ steps: string[] }>(`Generate 10 offboarding checklist steps for "${form.department}" department. Include access revocation, equipment return, knowledge transfer, and exit items. Return JSON: {"steps": [...]}`)
    setAiLoading(false)
    if (r.success && r.data?.steps) { setSteps(r.data.steps); toast.success('AI generated steps') }
    else toast.error(r.error || 'Failed')
  }

  const progress = (cl: Checklist) => Math.round((cl.steps.filter(s => s.completed).length / cl.steps.length) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10"><UserMinus className="h-6 w-6 text-red-600" /></div>
          <div><h1 className="text-2xl font-bold">Offboarding Checklists</h1><p className="text-muted-foreground text-sm">Manage employee departures smoothly</p></div>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />New Checklist</Button>
      </div>

      {checklists.length === 0 && (
        <div className="text-center py-12 animate-fade-in-up">
          <UserMinus className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No offboarding checklists</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create one when an employee departs</p>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />Create Checklist</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {checklists.map(cl => (
          <Card key={cl.id} className="card-glow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div><CardTitle className="text-base">{cl.employeeName}</CardTitle><p className="text-sm text-muted-foreground">{cl.department} • Last day: {cl.lastDay}</p></div>
                <div className="flex items-center gap-2">
                  <Badge variant={progress(cl) === 100 ? 'default' : 'secondary'}>{progress(cl)}%</Badge>
                  <Button variant="ghost" size="sm" onClick={() => { deleteOffboarding(cl.id) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2"><div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${progress(cl)}%` }} /></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {cl.steps.map(step => (
                  <div key={step.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => toggle(cl.id, step.id)}>
                    {step.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={`text-sm flex-1 ${step.completed ? 'line-through text-muted-foreground' : ''}`}>{step.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Offboarding Checklist</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Employee Name *</Label><Input value={form.employeeName} onChange={e => setForm(p => ({ ...p, employeeName: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Last Working Day</Label><Input type="date" value={form.lastDay} onChange={e => setForm(p => ({ ...p, lastDay: e.target.value }))} /></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label>Steps</Label>
                {isAIConfigured() && <Button variant="outline" size="sm" onClick={aiGen} disabled={aiLoading}><Sparkles className="h-3 w-3 mr-1" />{aiLoading ? 'Generating...' : 'AI Generate'}</Button>}
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm"><span className="flex-1 p-1.5 rounded bg-muted/50">{s}</span><Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSteps(p => p.filter((_, j) => j !== i))}><X className="h-3 w-3" /></Button></div>
                ))}
              </div>
              <div className="flex gap-2"><Input placeholder="Add step..." value={newStep} onChange={e => setNewStep(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newStep.trim()) { setSteps(p => [...p, newStep.trim()]); setNewStep('') } }} /><Button variant="outline" size="sm" onClick={() => { if (newStep.trim()) { setSteps(p => [...p, newStep.trim()]); setNewStep('') } }}>Add</Button></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={create}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
