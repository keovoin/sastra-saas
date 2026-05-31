import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ClipboardCheck, Plus, Sparkles, Trash2, CheckCircle2, Circle, User, Calendar, X } from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAIJson } from '@/lib/ai'
import { useData } from '@/context/DataContext'

interface ChecklistStep {
  id: string
  title: string
  completed: boolean
  dueDate: string
}

interface Checklist {
  id: string
  employeeName: string
  role: string
  startDate: string
  steps: ChecklistStep[]
  createdAt: string
}


const DEFAULT_TEMPLATE: string[] = [
  'IT equipment setup (laptop, monitors, peripherals)',
  'Create company email and accounts',
  'Access provisioning (Slack, GitHub, tools)',
  'HR paperwork and documentation',
  'Meet the team introductions',
  'Company handbook review',
  'Security & compliance training',
  'First week goals discussion with manager',
  'Assign onboarding buddy',
  '30-day check-in scheduled',
]

export function OnboardingChecklist() {
  const { onboardingChecklists: dbChecklists, addOnboarding, updateOnboarding, deleteOnboarding } = useData()
  const checklists = dbChecklists.map(c => ({
    id: c.id, employeeName: c.employee_name, role: c.role,
    startDate: c.start_date || '', steps: c.steps as ChecklistStep[], createdAt: c.created_at,
  }))
  const [showCreate, setShowCreate] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [newChecklist, setNewChecklist] = useState({ employeeName: '', role: '', startDate: '' })
  const [customSteps, setCustomSteps] = useState<string[]>(DEFAULT_TEMPLATE)
  const [newStep, setNewStep] = useState('')

  const createChecklist = () => {
    if (!newChecklist.employeeName.trim()) { toast.error('Employee name required'); return }
    const steps = customSteps.map((title, i) => ({
      id: crypto.randomUUID(), title, completed: false,
      dueDate: new Date(Date.now() + (i + 1) * 2 * 86400000).toISOString().split('T')[0],
    }))
    addOnboarding({
      employee_name: newChecklist.employeeName,
      role: newChecklist.role,
      start_date: newChecklist.startDate || new Date().toISOString().split('T')[0],
      steps,
    })
    setShowCreate(false)
    setNewChecklist({ employeeName: '', role: '', startDate: '' })
    setCustomSteps(DEFAULT_TEMPLATE)
  }

  const toggleStep = (checklistId: string, stepId: string) => {
    const cl = checklists.find(c => c.id === checklistId)
    if (!cl) return
    const updatedSteps = cl.steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s)
    updateOnboarding(checklistId, { steps: updatedSteps })
  }

  const deleteChecklist = (id: string) => {
    deleteOnboarding(id)
  }

  const aiGenerate = async () => {
    if (!newChecklist.role) { toast.error('Enter a role first'); return }
    setAiLoading(true)
    const result = await askAIJson<{ steps: string[] }>(
      `Generate a 10-step onboarding checklist for a new "${newChecklist.role}" employee. Include IT setup, access, training, team intros, and role-specific items. Return JSON: {"steps": ["step1", "step2", ...]}`
    )
    setAiLoading(false)
    if (result.success && result.data?.steps) {
      setCustomSteps(result.data.steps)
      toast.success('AI generated checklist steps')
    } else { toast.error(result.error || 'AI generation failed') }
  }

  const getProgress = (cl: Checklist) => {
    const done = cl.steps.filter(s => s.completed).length
    return Math.round((done / cl.steps.length) * 100)
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10"><ClipboardCheck className="h-6 w-6 text-emerald-600" /></div>
          <div>
            <h1 className="text-2xl font-bold">Onboarding Checklists</h1>
            <p className="text-muted-foreground text-sm">Template-based onboarding for new employees</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />New Checklist</Button>
      </div>

      {checklists.length === 0 && (
        <div className="text-center py-12 animate-fade-in-up">
          <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No onboarding checklists</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create a checklist when a new employee joins</p>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />Create First Checklist</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {checklists.map(cl => (
          <Card key={cl.id} className="card-glow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />{cl.employeeName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{cl.role} • Started {cl.startDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getProgress(cl) === 100 ? 'default' : 'secondary'}>{getProgress(cl)}%</Badge>
                  <Button variant="ghost" size="sm" onClick={() => deleteChecklist(cl.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${getProgress(cl)}%` }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {cl.steps.map(step => (
                  <div key={step.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => toggleStep(cl.id, step.id)}>
                    {step.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={`text-sm flex-1 ${step.completed ? 'line-through text-muted-foreground' : ''}`}>{step.title}</span>
                    <span className="text-xs text-muted-foreground">{step.dueDate}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Onboarding Checklist</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Employee Name *</Label><Input placeholder="Jane Smith" value={newChecklist.employeeName} onChange={e => setNewChecklist(p => ({ ...p, employeeName: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Role</Label><Input placeholder="Software Engineer" value={newChecklist.role} onChange={e => setNewChecklist(p => ({ ...p, role: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={newChecklist.startDate} onChange={e => setNewChecklist(p => ({ ...p, startDate: e.target.value }))} /></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Checklist Steps</Label>
                {isAIConfigured() && (
                  <Button variant="outline" size="sm" onClick={aiGenerate} disabled={aiLoading}>
                    <Sparkles className="h-3 w-3 mr-1" />{aiLoading ? 'Generating...' : 'AI Generate'}
                  </Button>
                )}
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {customSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 p-1.5 rounded bg-muted/50">{step}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setCustomSteps(prev => prev.filter((_, j) => j !== i))}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add custom step..." value={newStep} onChange={e => setNewStep(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newStep.trim()) { setCustomSteps(prev => [...prev, newStep.trim()]); setNewStep('') } }} />
                <Button variant="outline" size="sm" onClick={() => { if (newStep.trim()) { setCustomSteps(prev => [...prev, newStep.trim()]); setNewStep('') } }}>Add</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createChecklist}>Create Checklist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
