import React, { useState } from 'react'
import { useBusinessOS } from '@/context/BusinessContext'
import type { Charter } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, FileText, Check, X, Users, Calendar, Briefcase, Eye } from 'lucide-react'

const steps = [
  { id: 1, title: 'Basics', icon: Briefcase },
  { id: 2, title: 'Scope', icon: Eye },
  { id: 3, title: 'Team', icon: Users },
  { id: 4, title: 'Review', icon: Check },
]

export function ProjectCharters() {
  const { charters, addCharter, isAdmin } = useBusinessOS()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [projectName, setProjectName] = useState('')
  const [sponsor, setSponsor] = useState('')
  const [startDate, setStartDate] = useState('')
  const [inScopeInput, setInScopeInput] = useState('')
  const [inScope, setInScope] = useState<string[]>([])
  const [outScopeInput, setOutScopeInput] = useState('')
  const [outOfScope, setOutOfScope] = useState<string[]>([])
  const [memberInput, setMemberInput] = useState('')
  const [teamMembers, setTeamMembers] = useState<string[]>([])

  const resetWizard = () => { setCurrentStep(1); setProjectName(''); setSponsor(''); setStartDate(''); setInScopeInput(''); setInScope([]); setOutScopeInput(''); setOutOfScope([]); setMemberInput(''); setTeamMembers([]) }
  const openWizard = () => { if (!isAdmin) return; resetWizard(); setWizardOpen(true) }

  const handleAddTag = (value: string, setter: React.Dispatch<React.SetStateAction<string>>, list: string[], listSetter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (value.trim() && !list.includes(value.trim())) { listSetter([...list, value.trim()]); setter('') }
  }
  const handleRemoveTag = (value: string, list: string[], listSetter: React.Dispatch<React.SetStateAction<string[]>>) => { listSetter(list.filter((i) => i !== value)) }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, value: string, setter: React.Dispatch<React.SetStateAction<string>>, list: string[], listSetter: React.Dispatch<React.SetStateAction<string[]>>) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(value, setter, list, listSetter) } }

  const handleSubmit = async () => { if (!isAdmin) return; await addCharter({ name: projectName, sponsor, start_date: startDate || null, in_scope: inScope, out_of_scope: outOfScope, team_members: teamMembers }); setWizardOpen(false); resetWizard() }
  const canProceed = () => { switch (currentStep) { case 1: return projectName.trim() && sponsor.trim() && startDate; case 2: return inScope.length > 0; case 3: return teamMembers.length > 0; default: return true } }


  if (!wizardOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Charters</h1><p className="mt-1 text-sm text-slate-500">Define project scope, team, and objectives with a guided wizard.</p></div>
          {isAdmin && (<Button onClick={openWizard} className="gap-2"><Plus className="h-4 w-4" />New Charter</Button>)}
        </div>
        {!isAdmin && (<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"><p className="text-sm text-amber-800 font-medium">You are viewing as a <span className="font-bold">Viewer</span>. Charter creation is disabled.</p></div>)}
        {charters.length === 0 ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><div className="rounded-full bg-slate-100 p-4 mb-4"><FileText className="h-8 w-8 text-slate-400" /></div><h3 className="text-lg font-semibold text-slate-900">No charters yet</h3><p className="mt-1 text-sm text-slate-500">Create your first project charter to get started.</p>{isAdmin && (<Button onClick={openWizard} className="mt-4 gap-2"><Plus className="h-4 w-4" />Create First Charter</Button>)}</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {charters.map((charter) => (
              <Card key={charter.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between"><Badge variant="secondary" className="text-xs font-mono">{charter.id.slice(0, 8)}</Badge><div className="flex items-center gap-1 text-xs text-slate-400"><Calendar className="h-3 w-3" />{charter.start_date || 'TBD'}</div></div>
                  <CardTitle className="text-base mt-2">{charter.name}</CardTitle>
                  <CardDescription>Sponsor: {charter.sponsor}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div><p className="text-xs font-medium text-slate-500 mb-1">In Scope</p><div className="flex flex-wrap gap-1">{charter.in_scope.map((item) => (<Badge key={item} variant="outline" className="text-xs">{item}</Badge>))}</div></div>
                  <div><p className="text-xs font-medium text-slate-500 mb-1">Team</p><div className="flex -space-x-2">{charter.team_members.map((member) => (<div key={member} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-violet-400 to-indigo-600 text-[9px] font-medium text-white" title={member}>{member.split('@')[0].slice(0, 2).toUpperCase()}</div>))}</div></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }


  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">New Project Charter</h1><p className="mt-1 text-sm text-slate-500">Follow the steps to define your project.</p></div>
      <div className="flex items-center justify-center"><div className="flex items-center gap-2">
        {steps.map((step, index) => { const Icon = step.icon; const isActive = currentStep === step.id; const isCompleted = currentStep > step.id; return (<React.Fragment key={step.id}><div className="flex items-center gap-2"><div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</div><span className={`text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</span></div>{index < steps.length - 1 && (<div className={`h-px w-12 ${isCompleted ? 'bg-emerald-300' : 'bg-slate-200'}`} />)}</React.Fragment>) })}
      </div></div>
      <Card className="max-w-2xl mx-auto"><CardContent className="p-6">
        {currentStep === 1 && (<div className="space-y-4"><div className="space-y-2"><Label>Project Name</Label><Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g., Platform Migration to Kubernetes" /></div><div className="space-y-2"><Label>Executive Sponsor</Label><Input value={sponsor} onChange={(e) => setSponsor(e.target.value)} placeholder="e.g., CTO - Jennifer Walsh" /></div><div className="space-y-2"><Label>Planned Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div></div>)}
        {currentStep === 2 && (<div className="space-y-6"><div className="space-y-3"><Label>In-Scope Items</Label><div className="flex gap-2"><Input value={inScopeInput} onChange={(e) => setInScopeInput(e.target.value)} onKeyDown={(e) => handleKeyDown(e, inScopeInput, setInScopeInput, inScope, setInScope)} placeholder="Type and press Enter..." /><Button variant="outline" onClick={() => handleAddTag(inScopeInput, setInScopeInput, inScope, setInScope)} disabled={!inScopeInput.trim()}>Add</Button></div><div className="flex flex-wrap gap-2">{inScope.map((item) => (<Badge key={item} variant="secondary" className="gap-1 pr-1">{item}<button onClick={() => handleRemoveTag(item, inScope, setInScope)} className="ml-1 rounded-full p-0.5 hover:bg-slate-300"><X className="h-3 w-3" /></button></Badge>))}</div></div><div className="space-y-3"><Label>Out-of-Scope Items</Label><div className="flex gap-2"><Input value={outScopeInput} onChange={(e) => setOutScopeInput(e.target.value)} onKeyDown={(e) => handleKeyDown(e, outScopeInput, setOutScopeInput, outOfScope, setOutOfScope)} placeholder="Type and press Enter..." /><Button variant="outline" onClick={() => handleAddTag(outScopeInput, setOutScopeInput, outOfScope, setOutOfScope)} disabled={!outScopeInput.trim()}>Add</Button></div><div className="flex flex-wrap gap-2">{outOfScope.map((item) => (<Badge key={item} variant="outline" className="gap-1 pr-1 border-red-200 text-red-700">{item}<button onClick={() => handleRemoveTag(item, outOfScope, setOutOfScope)} className="ml-1 rounded-full p-0.5 hover:bg-red-100"><X className="h-3 w-3" /></button></Badge>))}</div></div></div>)}
        {currentStep === 3 && (<div className="space-y-4"><Label>Team Members</Label><div className="flex gap-2"><Input value={memberInput} onChange={(e) => setMemberInput(e.target.value)} onKeyDown={(e) => handleKeyDown(e, memberInput, setMemberInput, teamMembers, setTeamMembers)} placeholder="email@company.com" type="email" /><Button variant="outline" onClick={() => handleAddTag(memberInput, setMemberInput, teamMembers, setTeamMembers)} disabled={!memberInput.trim()}>Add</Button></div><div className="space-y-2">{teamMembers.map((member) => (<div key={member} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"><div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-[10px] font-medium text-white">{member.split('@')[0].slice(0, 2).toUpperCase()}</div><span className="text-sm text-slate-700">{member}</span></div><button onClick={() => handleRemoveTag(member, teamMembers, setTeamMembers)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button></div>))}</div></div>)}
        {currentStep === 4 && (<div className="space-y-4"><div className="rounded-lg border border-slate-200 bg-slate-50 p-6"><h3 className="text-lg font-bold text-slate-900 mb-1">{projectName}</h3><p className="text-sm text-slate-500 mb-4">Sponsored by {sponsor} | Start: {startDate}</p><div className="space-y-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">In Scope</p><div className="flex flex-wrap gap-1.5">{inScope.map((item) => (<Badge key={item} variant="secondary">{item}</Badge>))}</div></div>{outOfScope.length > 0 && (<div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Out of Scope</p><div className="flex flex-wrap gap-1.5">{outOfScope.map((item) => (<Badge key={item} variant="outline" className="border-red-200 text-red-700">{item}</Badge>))}</div></div>)}<div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Team Members</p><div className="space-y-1">{teamMembers.map((m) => (<p key={m} className="text-sm text-slate-600">{m}</p>))}</div></div></div></div></div>)}
      </CardContent></Card>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={() => { if (currentStep === 1) setWizardOpen(false); else setCurrentStep(currentStep - 1) }}>{currentStep === 1 ? 'Cancel' : 'Back'}</Button>
        {currentStep < 4 ? (<Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}>Continue</Button>) : (<Button onClick={handleSubmit}>Create Charter</Button>)}
      </div>
    </div>
  )
}


  if (!wizardOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Project Charters</h1><p className="mt-1 text-sm text-slate-500">Define project scope, team, and objectives with a guided wizard.</p></div>
          {isAdmin && (<Button onClick={openWizard} className="gap-2"><Plus className="h-4 w-4" />New Charter</Button>)}
        </div>
        {!isAdmin && (<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"><p className="text-sm text-amber-800 font-medium">You are viewing as a <span className="font-bold">Viewer</span>. Charter creation is disabled.</p></div>)}
        {charters.length === 0 ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><div className="rounded-full bg-slate-100 p-4 mb-4"><FileText className="h-8 w-8 text-slate-400" /></div><h3 className="text-lg font-semibold text-slate-900">No charters yet</h3><p className="mt-1 text-sm text-slate-500">Create your first project charter to get started.</p>{isAdmin && (<Button onClick={openWizard} className="mt-4 gap-2"><Plus className="h-4 w-4" />Create First Charter</Button>)}</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{charters.map((charter) => (
            <Card key={charter.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3"><div className="flex items-center justify-between"><Badge variant="secondary" className="text-xs font-mono">{charter.id.slice(0, 8)}</Badge><div className="flex items-center gap-1 text-xs text-slate-400"><Calendar className="h-3 w-3" />{charter.start_date || 'TBD'}</div></div><CardTitle className="text-base mt-2">{charter.name}</CardTitle><CardDescription>Sponsor: {charter.sponsor}</CardDescription></CardHeader>
              <CardContent className="space-y-3"><div><p className="text-xs font-medium text-slate-500 mb-1">In Scope</p><div className="flex flex-wrap gap-1">{charter.in_scope.map((item) => (<Badge key={item} variant="outline" className="text-xs">{item}</Badge>))}</div></div><div><p className="text-xs font-medium text-slate-500 mb-1">Team</p><div className="flex -space-x-2">{charter.team_members.map((member) => (<div key={member} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-violet-400 to-indigo-600 text-[9px] font-medium text-white" title={member}>{member.split('@')[0].slice(0, 2).toUpperCase()}</div>))}</div></div></CardContent>
            </Card>))}</div>
        )}
      </div>
    )
  }


  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">New Project Charter</h1><p className="mt-1 text-sm text-slate-500">Follow the steps to define your project.</p></div>
      <div className="flex items-center justify-center"><div className="flex items-center gap-2">{steps.map((step, index) => { const Icon = step.icon; const isActive = currentStep === step.id; const isCompleted = currentStep > step.id; return (<React.Fragment key={step.id}><div className="flex items-center gap-2"><div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</div><span className={`text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</span></div>{index < steps.length - 1 && (<div className={`h-px w-12 ${isCompleted ? 'bg-emerald-300' : 'bg-slate-200'}`} />)}</React.Fragment>) })}</div></div>
      <Card className="max-w-2xl mx-auto"><CardContent className="p-6">
        {currentStep === 1 && (<div className="space-y-4"><div className="space-y-2"><Label>Project Name</Label><Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g., Platform Migration" /></div><div className="space-y-2"><Label>Executive Sponsor</Label><Input value={sponsor} onChange={(e) => setSponsor(e.target.value)} placeholder="e.g., CTO - Jennifer Walsh" /></div><div className="space-y-2"><Label>Planned Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div></div>)}
        {currentStep === 2 && (<div className="space-y-6"><div className="space-y-3"><Label>In-Scope Items</Label><div className="flex gap-2"><Input value={inScopeInput} onChange={(e) => setInScopeInput(e.target.value)} onKeyDown={(e) => handleKeyDown(e, inScopeInput, setInScopeInput, inScope, setInScope)} placeholder="Type and press Enter..." /><Button variant="outline" onClick={() => handleAddTag(inScopeInput, setInScopeInput, inScope, setInScope)} disabled={!inScopeInput.trim()}>Add</Button></div><div className="flex flex-wrap gap-2">{inScope.map((item) => (<Badge key={item} variant="secondary" className="gap-1 pr-1">{item}<button onClick={() => handleRemoveTag(item, inScope, setInScope)} className="ml-1 rounded-full p-0.5 hover:bg-slate-300"><X className="h-3 w-3" /></button></Badge>))}</div></div><div className="space-y-3"><Label>Out-of-Scope</Label><div className="flex gap-2"><Input value={outScopeInput} onChange={(e) => setOutScopeInput(e.target.value)} onKeyDown={(e) => handleKeyDown(e, outScopeInput, setOutScopeInput, outOfScope, setOutOfScope)} placeholder="Type and press Enter..." /><Button variant="outline" onClick={() => handleAddTag(outScopeInput, setOutScopeInput, outOfScope, setOutOfScope)} disabled={!outScopeInput.trim()}>Add</Button></div><div className="flex flex-wrap gap-2">{outOfScope.map((item) => (<Badge key={item} variant="outline" className="gap-1 pr-1 border-red-200 text-red-700">{item}<button onClick={() => handleRemoveTag(item, outOfScope, setOutOfScope)} className="ml-1 rounded-full p-0.5 hover:bg-red-100"><X className="h-3 w-3" /></button></Badge>))}</div></div></div>)}
        {currentStep === 3 && (<div className="space-y-4"><Label>Team Members</Label><div className="flex gap-2"><Input value={memberInput} onChange={(e) => setMemberInput(e.target.value)} onKeyDown={(e) => handleKeyDown(e, memberInput, setMemberInput, teamMembers, setTeamMembers)} placeholder="email@company.com" type="email" /><Button variant="outline" onClick={() => handleAddTag(memberInput, setMemberInput, teamMembers, setTeamMembers)} disabled={!memberInput.trim()}>Add</Button></div><div className="space-y-2">{teamMembers.map((member) => (<div key={member} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"><div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-[10px] font-medium text-white">{member.split('@')[0].slice(0, 2).toUpperCase()}</div><span className="text-sm text-slate-700">{member}</span></div><button onClick={() => handleRemoveTag(member, teamMembers, setTeamMembers)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button></div>))}</div></div>)}
        {currentStep === 4 && (<div className="rounded-lg border border-slate-200 bg-slate-50 p-6"><h3 className="text-lg font-bold text-slate-900 mb-1">{projectName}</h3><p className="text-sm text-slate-500 mb-4">Sponsored by {sponsor} | Start: {startDate}</p><div className="space-y-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">In Scope</p><div className="flex flex-wrap gap-1.5">{inScope.map((i) => (<Badge key={i} variant="secondary">{i}</Badge>))}</div></div>{outOfScope.length > 0 && (<div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Out of Scope</p><div className="flex flex-wrap gap-1.5">{outOfScope.map((i) => (<Badge key={i} variant="outline" className="border-red-200 text-red-700">{i}</Badge>))}</div></div>)}<div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Team</p><div className="space-y-1">{teamMembers.map((m) => (<p key={m} className="text-sm text-slate-600">{m}</p>))}</div></div></div></div>)}
      </CardContent></Card>
      <div className="flex justify-center gap-3"><Button variant="outline" onClick={() => { if (currentStep === 1) setWizardOpen(false); else setCurrentStep(currentStep - 1) }}>{currentStep === 1 ? 'Cancel' : 'Back'}</Button>{currentStep < 4 ? (<Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}>Continue</Button>) : (<Button onClick={handleSubmit}>Create Charter</Button>)}</div>
    </div>
  )
}
