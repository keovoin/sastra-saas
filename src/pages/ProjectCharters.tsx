import React, { useState } from 'react'
import { useBusinessOS } from '@/context/BusinessContext'
import type { Charter } from '@/context/BusinessContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus, FileText, X, Users, Calendar, Edit2, Trash2, Eye,
  Target, Shield, Milestone, DollarSign, Link2, CheckSquare, Sparkles, Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAIJson } from '@/lib/ai'

interface FullCharter {
  id: string
  name: string
  purpose: string
  objectives: string[]
  scope_in: string[]
  scope_out: string[]
  projectManager: string
  pmAuthority: string
  sponsor: string
  stakeholders: string[]
  milestones: { title: string; date: string }[]
  budget: string
  risks: string[]
  assumptions: string[]
  dependencies: string[]
  signOff: { name: string; role: string; signed: boolean }[]
  teamMembers: string[]
  startDate: string
  attachments: string[]
  createdAt: string
}


export function ProjectCharters() {
  const { charters, addCharter, deleteCharter, isAdmin } = useBusinessOS()
  const [localCharters, setLocalCharters] = useState<FullCharter[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [viewCharter, setViewCharter] = useState<FullCharter | null>(null)
  const [editCharter, setEditCharter] = useState<FullCharter | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const emptyCharter = (): Omit<FullCharter, 'id' | 'createdAt'> => ({
    name: '', purpose: '', objectives: [], scope_in: [], scope_out: [],
    projectManager: '', pmAuthority: 'Full', sponsor: '', stakeholders: [],
    milestones: [], budget: '', risks: [], assumptions: [], dependencies: [],
    signOff: [], teamMembers: [], startDate: '', attachments: [],
  })

  const [form, setForm] = useState(emptyCharter())
  const [tempInput, setTempInput] = useState({ objective: '', scopeIn: '', scopeOut: '', stakeholder: '', risk: '', assumption: '', dependency: '', member: '', milestone: '', milestoneDate: '', signName: '', signRole: '' })

  const addToList = (field: keyof typeof form, value: string) => {
    if (!value.trim()) return
    setForm(p => ({ ...p, [field]: [...(p[field] as string[]), value.trim()] }))
  }
  const removeFromList = (field: keyof typeof form, index: number) => {
    setForm(p => ({ ...p, [field]: (p[field] as string[]).filter((_, i) => i !== index) }))
  }

  const createCharter = () => {
    if (!form.name.trim()) { toast.error('Project name is required'); return }
    const charter: FullCharter = { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setLocalCharters(prev => [charter, ...prev])
    setForm(emptyCharter())
    setShowCreate(false)
    toast.success(`Charter "${charter.name}" created`)
  }

  const saveEdit = () => {
    if (!editCharter) return
    setLocalCharters(prev => prev.map(c => c.id === editCharter.id ? editCharter : c))
    setEditCharter(null)
    toast.success('Charter updated')
  }

  const deleteLocal = (id: string) => {
    setLocalCharters(prev => prev.filter(c => c.id !== id))
    setViewCharter(null)
    toast.success('Charter deleted')
  }

  const aiGenerateCharter = async () => {
    if (!form.name) { toast.error('Enter a project name first'); return }
    setAiLoading(true)
    const result = await askAIJson<{ purpose: string; objectives: string[]; risks: string[]; assumptions: string[]; milestones: { title: string; date: string }[] }>(
      `Generate a project charter for "${form.name}". Return JSON with: {"purpose": "1-2 sentence purpose", "objectives": ["obj1", "obj2", "obj3"], "risks": ["risk1", "risk2", "risk3"], "assumptions": ["a1", "a2"], "milestones": [{"title": "Phase 1", "date": "2025-03-01"}, {"title": "Phase 2", "date": "2025-06-01"}]}`
    )
    setAiLoading(false)
    if (result.success && result.data) {
      setForm(p => ({ ...p, purpose: result.data!.purpose, objectives: result.data!.objectives, risks: result.data!.risks, assumptions: result.data!.assumptions, milestones: result.data!.milestones }))
      toast.success('AI generated charter content')
    } else toast.error(result.error || 'AI generation failed')
  }

  const allCharters = localCharters


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10"><FileText className="h-6 w-6 text-blue-600" /></div>
          <div><h1 className="text-2xl font-bold">Project Charters</h1><p className="text-muted-foreground text-sm">Define project scope, objectives, and governance</p></div>
        </div>
        {isAdmin && <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />New Charter</Button>}
      </div>

      {allCharters.length === 0 && (
        <div className="text-center py-12 animate-fade-in-up">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No charters yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create a full project charter with all sections</p>
          {isAdmin && <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />Create First Charter</Button>}
        </div>
      )}

      {/* Charter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allCharters.map(charter => (
          <Card key={charter.id} className="card-glow hover-lift cursor-pointer" onClick={() => setViewCharter(charter)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{charter.name}</CardTitle>
                <Badge variant="secondary" className="text-xs">{charter.startDate || 'No date'}</Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{charter.purpose || 'No purpose defined'}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Target className="h-3 w-3" />{charter.objectives.length} objectives</span>
                <span className="flex items-center gap-1"><Milestone className="h-3 w-3" />{charter.milestones.length} milestones</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{charter.teamMembers.length} members</span>
              </div>
              {charter.sponsor && <p className="text-xs"><span className="text-muted-foreground">Sponsor:</span> {charter.sponsor}</p>}
            </CardContent>
          </Card>
        ))}
      </div>


      {/* View Charter as Document */}
      <Dialog open={!!viewCharter} onOpenChange={() => setViewCharter(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {viewCharter && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">{viewCharter.name}</DialogTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditCharter(viewCharter); setViewCharter(null) }}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteLocal(viewCharter.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-6 text-sm">
                {/* Document Rendering */}
                <section><h3 className="font-semibold text-base border-b pb-1 mb-2">1. Purpose</h3><p className="text-muted-foreground">{viewCharter.purpose || 'Not defined'}</p></section>
                <section><h3 className="font-semibold text-base border-b pb-1 mb-2">2. Objectives</h3>
                  {viewCharter.objectives.length > 0 ? <ul className="list-disc pl-5 space-y-1 text-muted-foreground">{viewCharter.objectives.map((o, i) => <li key={i}>{o}</li>)}</ul> : <p className="text-muted-foreground italic">None defined</p>}
                </section>
                <section><h3 className="font-semibold text-base border-b pb-1 mb-2">3. Scope</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="font-medium text-xs uppercase text-muted-foreground mb-1">In Scope</p>{viewCharter.scope_in.map((s, i) => <Badge key={i} variant="secondary" className="mr-1 mb-1 text-xs">{s}</Badge>)}</div>
                    <div><p className="font-medium text-xs uppercase text-muted-foreground mb-1">Out of Scope</p>{viewCharter.scope_out.map((s, i) => <Badge key={i} variant="outline" className="mr-1 mb-1 text-xs border-red-200 text-red-600">{s}</Badge>)}</div>
                  </div>
                </section>
                <section><h3 className="font-semibold text-base border-b pb-1 mb-2">4. Project Manager & Authority</h3>
                  <p><span className="text-muted-foreground">PM:</span> {viewCharter.projectManager || '—'}</p>
                  <p><span className="text-muted-foreground">Authority Level:</span> {viewCharter.pmAuthority || '—'}</p>
                </section>
                <section><h3 className="font-semibold text-base border-b pb-1 mb-2">5. Sponsor</h3><p>{viewCharter.sponsor || '—'}</p></section>
                <section><h3 className="font-semibold text-base border-b pb-1 mb-2">6. Stakeholders</h3>
                  <div className="flex flex-wrap gap-1">{viewCharter.stakeholders.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}</div>
                </section>
                <section><h3 className="font-semibold text-base border-b pb-1 mb-2">7. Milestones</h3>
                  {viewCharter.milestones.length > 0 ? (
                    <div className="space-y-1">{viewCharter.milestones.map((m, i) => <div key={i} className="flex justify-between p-2 rounded bg-muted/50"><span>{m.title}</span><span className="text-muted-foreground">{m.date}</span></div>)}</div>
                  ) : <p className="text-muted-foreground italic">None defined</p>}
                </section>
                <section><h3 className="font-semibold text-base border-b pb-1 mb-2">8. Budget</h3><p>{viewCharter.budget || 'Not specified'}</p></section>
                <section><h3 className="font-semibold text-base border-b pb-1 mb-2">9. Risks & Assumptions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="font-medium text-xs uppercase text-muted-foreground mb-1">Risks</p><ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">{viewCharter.risks.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
                    <div><p className="font-medium text-xs uppercase text-muted-foreground mb-1">Assumptions</p><ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">{viewCharter.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
                  </div>
                </section>
                <section><h3 className="font-semibold text-base border-b pb-1 mb-2">10. Dependencies</h3>
                  <div className="flex flex-wrap gap-1">{viewCharter.dependencies.map((d, i) => <Badge key={i} variant="outline" className="text-xs">{d}</Badge>)}</div>
                </section>
                <section><h3 className="font-semibold text-base border-b pb-1 mb-2">11. Team Members</h3>
                  <div className="flex flex-wrap gap-2">{viewCharter.teamMembers.map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50">
                      <div className="h-5 w-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-[8px] text-white font-medium">{m.slice(0, 2).toUpperCase()}</div>
                      <span className="text-xs">{m}</span>
                    </div>
                  ))}</div>
                </section>
                <section><h3 className="font-semibold text-base border-b pb-1 mb-2">12. Sign-Off</h3>
                  {viewCharter.signOff.length > 0 ? (
                    <div className="space-y-1">{viewCharter.signOff.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span>{s.name} ({s.role})</span>
                        <Badge variant={s.signed ? 'default' : 'secondary'}>{s.signed ? '✓ Signed' : 'Pending'}</Badge>
                      </div>
                    ))}</div>
                  ) : <p className="text-muted-foreground italic">No signatories</p>}
                </section>
                {viewCharter.attachments.length > 0 && (
                  <section><h3 className="font-semibold text-base border-b pb-1 mb-2">13. Attachments</h3>
                    <div className="space-y-1">{viewCharter.attachments.map((a, i) => <p key={i} className="text-xs text-blue-600">{a}</p>)}</div>
                  </section>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>


      {/* Create Charter Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              New Project Charter
              {isAIConfigured() && (
                <Button variant="outline" size="sm" onClick={aiGenerateCharter} disabled={aiLoading || !form.name}>
                  <Sparkles className="h-3 w-3 mr-1" />{aiLoading ? 'Generating...' : 'AI Fill'}
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2"><Label>Project Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Platform Migration to K8s" /></div>
              <div className="space-y-2"><Label>Sponsor</Label><Input value={form.sponsor} onChange={e => setForm(p => ({ ...p, sponsor: e.target.value }))} placeholder="CTO - Jane Doe" /></div>
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Project Manager</Label><Input value={form.projectManager} onChange={e => setForm(p => ({ ...p, projectManager: e.target.value }))} /></div>
              <div className="space-y-2"><Label>PM Authority</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.pmAuthority} onChange={e => setForm(p => ({ ...p, pmAuthority: e.target.value }))}>
                  <option value="Full">Full</option><option value="Limited">Limited</option><option value="Advisory">Advisory</option>
                </select>
              </div>
            </div>

            {/* Purpose */}
            <div className="space-y-2"><Label>Purpose Statement</Label>
              <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} placeholder="Why does this project exist?" />
            </div>

            {/* Budget */}
            <div className="space-y-2"><Label>Budget</Label><Input value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="$150,000" /></div>

            {/* Objectives */}
            <div className="space-y-2"><Label>Objectives</Label>
              <div className="flex gap-2"><Input value={tempInput.objective} onChange={e => setTempInput(p => ({ ...p, objective: e.target.value }))} placeholder="Add objective..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('objectives', tempInput.objective); setTempInput(p => ({ ...p, objective: '' })) } }} /><Button variant="outline" size="sm" onClick={() => { addToList('objectives', tempInput.objective); setTempInput(p => ({ ...p, objective: '' })) }}>Add</Button></div>
              <div className="flex flex-wrap gap-1">{form.objectives.map((o, i) => <Badge key={i} variant="secondary" className="gap-1">{o}<button onClick={() => removeFromList('objectives', i)}><X className="h-3 w-3" /></button></Badge>)}</div>
            </div>

            {/* Scope */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>In Scope</Label>
                <div className="flex gap-1"><Input value={tempInput.scopeIn} onChange={e => setTempInput(p => ({ ...p, scopeIn: e.target.value }))} placeholder="Add..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('scope_in', tempInput.scopeIn); setTempInput(p => ({ ...p, scopeIn: '' })) } }} /><Button variant="outline" size="sm" onClick={() => { addToList('scope_in', tempInput.scopeIn); setTempInput(p => ({ ...p, scopeIn: '' })) }}>+</Button></div>
                <div className="flex flex-wrap gap-1">{form.scope_in.map((s, i) => <Badge key={i} variant="secondary" className="text-xs gap-1">{s}<button onClick={() => removeFromList('scope_in', i)}><X className="h-2 w-2" /></button></Badge>)}</div>
              </div>
              <div className="space-y-2"><Label>Out of Scope</Label>
                <div className="flex gap-1"><Input value={tempInput.scopeOut} onChange={e => setTempInput(p => ({ ...p, scopeOut: e.target.value }))} placeholder="Add..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('scope_out', tempInput.scopeOut); setTempInput(p => ({ ...p, scopeOut: '' })) } }} /><Button variant="outline" size="sm" onClick={() => { addToList('scope_out', tempInput.scopeOut); setTempInput(p => ({ ...p, scopeOut: '' })) }}>+</Button></div>
                <div className="flex flex-wrap gap-1">{form.scope_out.map((s, i) => <Badge key={i} variant="outline" className="text-xs gap-1 border-red-200 text-red-600">{s}<button onClick={() => removeFromList('scope_out', i)}><X className="h-2 w-2" /></button></Badge>)}</div>
              </div>
            </div>


            {/* Milestones */}
            <div className="space-y-2"><Label>Milestones</Label>
              <div className="flex gap-2"><Input className="flex-1" value={tempInput.milestone} onChange={e => setTempInput(p => ({ ...p, milestone: e.target.value }))} placeholder="Milestone title" /><Input type="date" className="w-40" value={tempInput.milestoneDate} onChange={e => setTempInput(p => ({ ...p, milestoneDate: e.target.value }))} /><Button variant="outline" size="sm" onClick={() => { if (tempInput.milestone.trim()) { setForm(p => ({ ...p, milestones: [...p.milestones, { title: tempInput.milestone.trim(), date: tempInput.milestoneDate }] })); setTempInput(p => ({ ...p, milestone: '', milestoneDate: '' })) } }}>+</Button></div>
              <div className="space-y-1">{form.milestones.map((m, i) => <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50"><span>{m.title}</span><span className="flex items-center gap-1 text-muted-foreground">{m.date}<button onClick={() => setForm(p => ({ ...p, milestones: p.milestones.filter((_, j) => j !== i) }))}><X className="h-3 w-3" /></button></span></div>)}</div>
            </div>

            {/* Risks & Assumptions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Risks</Label>
                <div className="flex gap-1"><Input value={tempInput.risk} onChange={e => setTempInput(p => ({ ...p, risk: e.target.value }))} placeholder="Add risk..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('risks', tempInput.risk); setTempInput(p => ({ ...p, risk: '' })) } }} /><Button variant="outline" size="sm" onClick={() => { addToList('risks', tempInput.risk); setTempInput(p => ({ ...p, risk: '' })) }}>+</Button></div>
                <div className="space-y-0.5">{form.risks.map((r, i) => <div key={i} className="flex items-center justify-between text-xs p-1 rounded bg-red-50 dark:bg-red-900/10"><span>{r}</span><button onClick={() => removeFromList('risks', i)}><X className="h-3 w-3 text-red-500" /></button></div>)}</div>
              </div>
              <div className="space-y-2"><Label>Assumptions</Label>
                <div className="flex gap-1"><Input value={tempInput.assumption} onChange={e => setTempInput(p => ({ ...p, assumption: e.target.value }))} placeholder="Add..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('assumptions', tempInput.assumption); setTempInput(p => ({ ...p, assumption: '' })) } }} /><Button variant="outline" size="sm" onClick={() => { addToList('assumptions', tempInput.assumption); setTempInput(p => ({ ...p, assumption: '' })) }}>+</Button></div>
                <div className="space-y-0.5">{form.assumptions.map((a, i) => <div key={i} className="flex items-center justify-between text-xs p-1 rounded bg-muted/50"><span>{a}</span><button onClick={() => removeFromList('assumptions', i)}><X className="h-3 w-3" /></button></div>)}</div>
              </div>
            </div>

            {/* Dependencies & Team & Stakeholders */}
            <div className="space-y-2"><Label>Dependencies</Label>
              <div className="flex gap-2"><Input value={tempInput.dependency} onChange={e => setTempInput(p => ({ ...p, dependency: e.target.value }))} placeholder="Add dependency..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('dependencies', tempInput.dependency); setTempInput(p => ({ ...p, dependency: '' })) } }} /><Button variant="outline" size="sm" onClick={() => { addToList('dependencies', tempInput.dependency); setTempInput(p => ({ ...p, dependency: '' })) }}>Add</Button></div>
              <div className="flex flex-wrap gap-1">{form.dependencies.map((d, i) => <Badge key={i} variant="outline" className="text-xs gap-1">{d}<button onClick={() => removeFromList('dependencies', i)}><X className="h-2 w-2" /></button></Badge>)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Stakeholders</Label>
                <div className="flex gap-1"><Input value={tempInput.stakeholder} onChange={e => setTempInput(p => ({ ...p, stakeholder: e.target.value }))} placeholder="Name" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('stakeholders', tempInput.stakeholder); setTempInput(p => ({ ...p, stakeholder: '' })) } }} /><Button variant="outline" size="sm" onClick={() => { addToList('stakeholders', tempInput.stakeholder); setTempInput(p => ({ ...p, stakeholder: '' })) }}>+</Button></div>
                <div className="flex flex-wrap gap-1">{form.stakeholders.map((s, i) => <Badge key={i} variant="secondary" className="text-xs gap-1">{s}<button onClick={() => removeFromList('stakeholders', i)}><X className="h-2 w-2" /></button></Badge>)}</div>
              </div>
              <div className="space-y-2"><Label>Team Members</Label>
                <div className="flex gap-1"><Input value={tempInput.member} onChange={e => setTempInput(p => ({ ...p, member: e.target.value }))} placeholder="Name/email" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList('teamMembers', tempInput.member); setTempInput(p => ({ ...p, member: '' })) } }} /><Button variant="outline" size="sm" onClick={() => { addToList('teamMembers', tempInput.member); setTempInput(p => ({ ...p, member: '' })) }}>+</Button></div>
                <div className="flex flex-wrap gap-1">{form.teamMembers.map((m, i) => <Badge key={i} variant="secondary" className="text-xs gap-1">{m}<button onClick={() => removeFromList('teamMembers', i)}><X className="h-2 w-2" /></button></Badge>)}</div>
              </div>
            </div>

            {/* Sign-Off */}
            <div className="space-y-2"><Label>Sign-Off Approvers</Label>
              <div className="flex gap-2"><Input className="flex-1" value={tempInput.signName} onChange={e => setTempInput(p => ({ ...p, signName: e.target.value }))} placeholder="Name" /><Input className="w-32" value={tempInput.signRole} onChange={e => setTempInput(p => ({ ...p, signRole: e.target.value }))} placeholder="Role" /><Button variant="outline" size="sm" onClick={() => { if (tempInput.signName.trim()) { setForm(p => ({ ...p, signOff: [...p.signOff, { name: tempInput.signName.trim(), role: tempInput.signRole.trim(), signed: false }] })); setTempInput(p => ({ ...p, signName: '', signRole: '' })) } }}>+</Button></div>
              <div className="space-y-1">{form.signOff.map((s, i) => <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50"><span>{s.name} — {s.role}</span><button onClick={() => setForm(p => ({ ...p, signOff: p.signOff.filter((_, j) => j !== i) }))}><X className="h-3 w-3" /></button></div>)}</div>
            </div>

            {/* Attachments placeholder */}
            <div className="space-y-2"><Label>Attachments</Label>
              <div className="flex items-center gap-2 p-4 border border-dashed rounded-lg text-center">
                <Upload className="h-5 w-5 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">File upload via Supabase Storage — configure in Settings</p>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={createCharter}>Create Charter</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Charter Dialog */}
      <Dialog open={!!editCharter} onOpenChange={() => setEditCharter(null)}>
        <DialogContent className="max-w-lg">
          {editCharter && (
            <>
              <DialogHeader><DialogTitle>Edit Charter</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Name</Label><Input value={editCharter.name} onChange={e => setEditCharter({ ...editCharter, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Purpose</Label><textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editCharter.purpose} onChange={e => setEditCharter({ ...editCharter, purpose: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Sponsor</Label><Input value={editCharter.sponsor} onChange={e => setEditCharter({ ...editCharter, sponsor: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Budget</Label><Input value={editCharter.budget} onChange={e => setEditCharter({ ...editCharter, budget: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Project Manager</Label><Input value={editCharter.projectManager} onChange={e => setEditCharter({ ...editCharter, projectManager: e.target.value })} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setEditCharter(null)}>Cancel</Button><Button onClick={saveEdit}>Save Changes</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
