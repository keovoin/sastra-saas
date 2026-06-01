import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Building2, Plus, Trash2, ShieldCheck, Grid3X3, X, Check, Layers, GitPullRequest,
} from 'lucide-react'
import { toast } from 'sonner'
import { useBusinessOS } from '@/context/BusinessContext'
import {
  getDepartments, setDepartments, getPositions, setPositions, type Position,
  getDeptAccess, setDeptAccess, GOVERNED_MODULES,
  getDeptChangeRequests, resolveDeptChangeRequest,
} from '@/lib/workspace'

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', 'project-board': 'Project Board', calendar: 'Calendar', messaging: 'Messaging',
  strategy: 'Strategy', risks: 'Risk Manager', charters: 'Charters', goals: 'Goal Cascade',
  decisions: 'Decision Log', pipeline: 'Sales Pipeline', competitors: 'Competitors', stakeholders: 'Stakeholders',
  kpis: 'KPIs', runway: 'Runway', 'unit-economics': 'Unit Economics', invoices: 'Invoices',
  pulse: 'Team Pulse', org: 'Organization', raci: 'RACI Matrix', onboarding: 'Onboarding',
  offboarding: 'Offboarding', 'employee-movement': 'Movements', workload: 'Workload', 'help-desk': 'Help Desk',
  'ai-assistant': 'AI Assistant', 'board-deck': 'Board Deck', activity: 'Activity', 'user-profile': 'My Profile', billing: 'Billing',
}

type Tab = 'departments' | 'positions' | 'access' | 'requests'

export function WorkspaceSettings() {
  const { isAdmin } = useBusinessOS()
  const [tab, setTab] = useState<Tab>('departments')
  const [depts, setDepts] = useState<string[]>(getDepartments())
  const [positions, setPos] = useState<Position[]>(getPositions())
  const [access, setAccess] = useState<Record<string, string[]>>(getDeptAccess())
  const [requests, setRequests] = useState(getDeptChangeRequests())
  const [newDept, setNewDept] = useState('')
  const [newPos, setNewPos] = useState({ title: '', level: 1 })
  const [selectedDept, setSelectedDept] = useState<string>(getDepartments()[0] || '')

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold">Admin Only</h2>
        <p className="text-sm text-muted-foreground mt-1">Workspace settings are managed by your workspace administrator.</p>
      </div>
    )
  }

  // Departments
  const addDept = () => {
    if (!newDept.trim()) return
    if (depts.includes(newDept.trim())) { toast.error('Department already exists'); return }
    const updated = [...depts, newDept.trim()]
    setDepts(updated); setDepartments(updated); setNewDept('')
    toast.success('Department added')
  }
  const removeDept = (d: string) => {
    const updated = depts.filter(x => x !== d)
    setDepts(updated); setDepartments(updated)
    toast.success('Department removed')
  }

  // Positions
  const addPos = () => {
    if (!newPos.title.trim()) return
    const updated = [...positions, { id: crypto.randomUUID(), title: newPos.title.trim(), level: newPos.level }]
    setPos(updated); setPositions(updated); setNewPos({ title: '', level: 1 })
    toast.success('Position added')
  }
  const removePos = (id: string) => {
    const updated = positions.filter(p => p.id !== id)
    setPos(updated); setPositions(updated)
    toast.success('Position removed')
  }

  // Access matrix
  const toggleAccess = (dept: string, moduleId: string) => {
    const current = access[dept] && access[dept].length > 0 ? access[dept] : [...GOVERNED_MODULES]
    const updated = current.includes(moduleId) ? current.filter(m => m !== moduleId) : [...current, moduleId]
    const newAccess = { ...access, [dept]: updated }
    setAccess(newAccess); setDeptAccess(newAccess)
  }
  const isAllowed = (dept: string, moduleId: string) => {
    const a = access[dept]
    if (!a || a.length === 0) return true
    return a.includes(moduleId)
  }
  const grantAll = (dept: string) => {
    const newAccess = { ...access, [dept]: [...GOVERNED_MODULES] }
    setAccess(newAccess); setDeptAccess(newAccess); toast.success(`${dept}: all modules granted`)
  }
  const revokeAll = (dept: string) => {
    const newAccess = { ...access, [dept]: ['dashboard', 'user-profile'] }
    setAccess(newAccess); setDeptAccess(newAccess); toast.success(`${dept}: restricted to Dashboard + Profile`)
  }

  // Requests
  const resolveReq = (id: string, status: 'approved' | 'rejected') => {
    resolveDeptChangeRequest(id, status)
    setRequests(getDeptChangeRequests())
    toast.success(`Request ${status}`)
  }
  const pendingReqs = requests.filter(r => r.status === 'pending')

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'positions', label: 'Position Levels', icon: Layers },
    { id: 'access', label: 'Module Access', icon: Grid3X3 },
    { id: 'requests', label: `Change Requests${pendingReqs.length ? ` (${pendingReqs.length})` : ''}`, icon: GitPullRequest },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/10"><ShieldCheck className="h-6 w-6 text-indigo-600" /></div>
        <div>
          <h1 className="text-2xl font-bold">Workspace Settings</h1>
          <p className="text-muted-foreground text-sm">Define departments, positions, and module access (admin only)</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-indigo-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="h-4 w-4" />{t.label}
            </button>
          )
        })}
      </div>

      {/* Departments */}
      {tab === 'departments' && (
        <Card className="animate-fade-in-up">
          <CardHeader><CardTitle className="text-base">Departments</CardTitle><CardDescription>Members choose their department from this list</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="New department name..." value={newDept} onChange={e => setNewDept(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDept()} />
              <Button onClick={addDept}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {depts.map(d => (
                <Badge key={d} variant="secondary" className="gap-1 py-1.5 px-3 text-sm">
                  <Building2 className="h-3 w-3" />{d}
                  <button onClick={() => removeDept(d)} className="ml-1 hover:text-red-500"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Positions */}
      {tab === 'positions' && (
        <Card className="animate-fade-in-up">
          <CardHeader><CardTitle className="text-base">Position Levels</CardTitle><CardDescription>Job titles with seniority levels (1=junior, 5=executive)</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input className="flex-1" placeholder="Position title..." value={newPos.title} onChange={e => setNewPos(p => ({ ...p, title: e.target.value }))} />
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={newPos.level} onChange={e => setNewPos(p => ({ ...p, level: Number(e.target.value) }))}>
                {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>Level {l}</option>)}
              </select>
              <Button onClick={addPos}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>
            <div className="space-y-2">
              {positions.sort((a, b) => a.level - b.level).map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">L{p.level}</Badge>
                    <span className="text-sm font-medium">{p.title}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => removePos(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Module Access Matrix */}
      {tab === 'access' && (
        <Card className="animate-fade-in-up">
          <CardHeader><CardTitle className="text-base">Module Access by Department</CardTitle><CardDescription>Control which modules each department can use. Unchecked = hidden for that department.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Department:</span>
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                {depts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={() => grantAll(selectedDept)}>Grant All</Button>
              <Button variant="outline" size="sm" onClick={() => revokeAll(selectedDept)}>Restrict</Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {GOVERNED_MODULES.map(m => {
                const allowed = isAllowed(selectedDept, m)
                return (
                  <button key={m} onClick={() => toggleAccess(selectedDept, m)}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-all ${allowed ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20' : 'border-border opacity-60'}`}>
                    <div className={`h-4 w-4 rounded flex items-center justify-center ${allowed ? 'bg-emerald-500' : 'bg-muted border border-border'}`}>
                      {allowed && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="truncate text-xs">{MODULE_LABELS[m] || m}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Requests */}
      {tab === 'requests' && (
        <Card className="animate-fade-in-up">
          <CardHeader><CardTitle className="text-base">Department Change Requests</CardTitle><CardDescription>Approve or reject member department change requests</CardDescription></CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8"><GitPullRequest className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">No change requests</p></div>
            ) : (
              <div className="space-y-2">
                {requests.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium">{r.memberName}</p>
                      <p className="text-xs text-muted-foreground">{r.fromDept || 'None'} → {r.toDept}</p>
                    </div>
                    {r.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => resolveReq(r.id, 'approved')}><Check className="h-3.5 w-3.5 mr-1" />Approve</Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => resolveReq(r.id, 'rejected')}><X className="h-3.5 w-3.5 mr-1" />Reject</Button>
                      </div>
                    ) : (
                      <Badge variant={r.status === 'approved' ? 'default' : 'secondary'}>{r.status}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
