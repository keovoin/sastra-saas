import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Users, Plus, Trash2, Edit2, Grid3X3, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAIJson } from '@/lib/ai'

type RACIRole = 'R' | 'A' | 'C' | 'I' | ''

interface TeamMember {
  id: string
  name: string
  role: string
  department: string
}

interface Activity {
  id: string
  name: string
  category: string
}

interface RACIAssignment {
  activityId: string
  memberId: string
  role: RACIRole
}

const RACI_CONFIG: Record<Exclude<RACIRole, ''>, { label: string; color: string; description: string }> = {
  R: { label: 'Responsible', color: 'bg-blue-500 text-white', description: 'Does the work' },
  A: { label: 'Accountable', color: 'bg-violet-500 text-white', description: 'Owns the outcome' },
  C: { label: 'Consulted', color: 'bg-amber-500 text-white', description: 'Provides input' },
  I: { label: 'Informed', color: 'bg-emerald-500 text-white', description: 'Kept in the loop' },
}

const DEMO_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Sarah Chen', role: 'CTO', department: 'Engineering' },
  { id: '2', name: 'Marcus Rivera', role: 'Product Manager', department: 'Product' },
  { id: '3', name: 'Emily Watson', role: 'Lead Designer', department: 'Design' },
  { id: '4', name: 'James Park', role: 'Backend Engineer', department: 'Engineering' },
  { id: '5', name: 'Lisa Thompson', role: 'Marketing Lead', department: 'Marketing' },
  { id: '6', name: 'Alex Kim', role: 'DevOps Engineer', department: 'Engineering' },
]

const DEMO_ACTIVITIES: Activity[] = [
  { id: '1', name: 'Product Roadmap Planning', category: 'Strategy' },
  { id: '2', name: 'Sprint Planning & Execution', category: 'Development' },
  { id: '3', name: 'UI/UX Design Reviews', category: 'Design' },
  { id: '4', name: 'Infrastructure & Deployments', category: 'Operations' },
  { id: '5', name: 'Customer Feedback Analysis', category: 'Product' },
  { id: '6', name: 'Marketing Campaigns', category: 'Marketing' },
  { id: '7', name: 'Security Audits', category: 'Compliance' },
  { id: '8', name: 'Hiring & Onboarding', category: 'HR' },
  { id: '9', name: 'Budget Approvals', category: 'Finance' },
  { id: '10', name: 'Vendor Management', category: 'Operations' },
]

const DEMO_ASSIGNMENTS: RACIAssignment[] = [
  { activityId: '1', memberId: '1', role: 'A' },
  { activityId: '1', memberId: '2', role: 'R' },
  { activityId: '1', memberId: '3', role: 'C' },
  { activityId: '1', memberId: '5', role: 'I' },
  { activityId: '2', memberId: '1', role: 'A' },
  { activityId: '2', memberId: '4', role: 'R' },
  { activityId: '2', memberId: '2', role: 'C' },
  { activityId: '2', memberId: '6', role: 'C' },
  { activityId: '3', memberId: '3', role: 'R' },
  { activityId: '3', memberId: '2', role: 'A' },
  { activityId: '3', memberId: '1', role: 'I' },
  { activityId: '4', memberId: '6', role: 'R' },
  { activityId: '4', memberId: '1', role: 'A' },
  { activityId: '4', memberId: '4', role: 'C' },
  { activityId: '5', memberId: '2', role: 'R' },
  { activityId: '5', memberId: '5', role: 'C' },
  { activityId: '5', memberId: '3', role: 'I' },
  { activityId: '6', memberId: '5', role: 'R' },
  { activityId: '6', memberId: '2', role: 'A' },
  { activityId: '6', memberId: '3', role: 'C' },
  { activityId: '7', memberId: '6', role: 'R' },
  { activityId: '7', memberId: '1', role: 'A' },
  { activityId: '7', memberId: '4', role: 'C' },
  { activityId: '8', memberId: '1', role: 'A' },
  { activityId: '8', memberId: '2', role: 'C' },
  { activityId: '9', memberId: '1', role: 'A' },
  { activityId: '9', memberId: '2', role: 'R' },
  { activityId: '10', memberId: '6', role: 'R' },
  { activityId: '10', memberId: '1', role: 'A' },
]

export function RACIMatrix() {
  const [members, setMembers] = useState<TeamMember[]>(DEMO_MEMBERS)
  const [activities, setActivities] = useState<Activity[]>(DEMO_ACTIVITIES)
  const [assignments, setAssignments] = useState<RACIAssignment[]>(DEMO_ASSIGNMENTS)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddActivity, setShowAddActivity] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [memberForm, setMemberForm] = useState({ name: '', role: '', department: '' })
  const [activityForm, setActivityForm] = useState({ name: '', category: '' })

  const getAssignment = (activityId: string, memberId: string): RACIRole => {
    return assignments.find(a => a.activityId === activityId && a.memberId === memberId)?.role || ''
  }

  const cycleRole = (activityId: string, memberId: string) => {
    const roles: RACIRole[] = ['', 'R', 'A', 'C', 'I']
    const current = getAssignment(activityId, memberId)
    const nextIdx = (roles.indexOf(current) + 1) % roles.length
    const nextRole = roles[nextIdx]

    setAssignments(prev => {
      const filtered = prev.filter(a => !(a.activityId === activityId && a.memberId === memberId))
      if (nextRole) {
        return [...filtered, { activityId, memberId, role: nextRole }]
      }
      return filtered
    })
  }

  const addMember = () => {
    if (!memberForm.name.trim()) { toast.error('Name required'); return }
    setMembers(prev => [...prev, { id: crypto.randomUUID(), ...memberForm }])
    setMemberForm({ name: '', role: '', department: '' })
    setShowAddMember(false)
    toast.success('Member added')
  }

  const addActivity = () => {
    if (!activityForm.name.trim()) { toast.error('Activity name required'); return }
    setActivities(prev => [...prev, { id: crypto.randomUUID(), ...activityForm }])
    setActivityForm({ name: '', category: '' })
    setShowAddActivity(false)
    toast.success('Activity added')
  }

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id))
    setAssignments(prev => prev.filter(a => a.memberId !== id))
    toast.success('Member removed')
  }

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id))
    setAssignments(prev => prev.filter(a => a.activityId !== id))
    toast.success('Activity removed')
  }

  const aiSuggest = async () => {
    setAiLoading(true)
    const memberList = members.map(m => `${m.name} (${m.role}, ${m.department})`).join(', ')
    const actList = activities.map(a => a.name).join(', ')
    const result = await askAIJson<{ assignments: { activity: string; member: string; role: 'R' | 'A' | 'C' | 'I' }[] }>(
      `Given these team members: ${memberList}\nAnd these activities: ${actList}\nSuggest RACI assignments. Each activity must have exactly 1 Accountable (A) and at least 1 Responsible (R). Return JSON: {"assignments": [{"activity": "exact activity name", "member": "exact member name", "role": "R"|"A"|"C"|"I"}]}`
    )
    setAiLoading(false)
    if (result.success && result.data?.assignments) {
      const newAssignments: RACIAssignment[] = []
      for (const a of result.data.assignments) {
        const activity = activities.find(act => act.name === a.activity)
        const member = members.find(m => m.name === a.member)
        if (activity && member) {
          newAssignments.push({ activityId: activity.id, memberId: member.id, role: a.role })
        }
      }
      if (newAssignments.length > 0) {
        setAssignments(newAssignments)
        toast.success(`AI assigned ${newAssignments.length} RACI roles`)
      } else {
        toast.error('AI could not match names — check member/activity names')
      }
    } else {
      toast.error(result.error || 'AI suggestion failed')
    }
  }

  // Stats
  const totalAssignments = assignments.length
  const activitiesWithNoAccountable = activities.filter(
    act => !assignments.some(a => a.activityId === act.id && a.role === 'A')
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/10"><Grid3X3 className="h-6 w-6 text-teal-600" /></div>
          <div>
            <h1 className="text-2xl font-bold">RACI Matrix</h1>
            <p className="text-muted-foreground text-sm">Define roles and responsibilities for every activity</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAIConfigured() && (
            <Button variant="outline" size="sm" onClick={aiSuggest} disabled={aiLoading}>
              <Sparkles className="h-4 w-4 mr-1" />{aiLoading ? 'Thinking...' : 'AI Suggest'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowAddActivity(true)}>
            <Plus className="h-4 w-4 mr-1" />Activity
          </Button>
          <Button size="sm" onClick={() => setShowAddMember(true)}>
            <Plus className="h-4 w-4 mr-1" />Member
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(RACI_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${cfg.color}`}>{key}</span>
            <span className="text-xs text-muted-foreground">{cfg.label} — {cfg.description}</span>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {activitiesWithNoAccountable.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-3">
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              {activitiesWithNoAccountable.length} activit{activitiesWithNoAccountable.length === 1 ? 'y has' : 'ies have'} no Accountable (A) assigned:
              {' '}{activitiesWithNoAccountable.map(a => a.name).join(', ')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Matrix Table */}
      <Card className="card-glow overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground min-w-[200px] sticky left-0 bg-muted/50 z-10">Activity</th>
                  {members.map(member => (
                    <th key={member.id} className="text-center px-2 py-3 min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-[9px] text-white font-medium">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-[10px] font-medium truncate max-w-[70px]">{member.name.split(' ')[0]}</span>
                        <span className="text-[9px] text-muted-foreground truncate max-w-[70px]">{member.role}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-2 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, idx) => (
                  <tr key={activity.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="px-4 py-3 sticky left-0 bg-card z-10">
                      <div>
                        <p className="font-medium text-sm">{activity.name}</p>
                        {activity.category && <Badge variant="secondary" className="text-[9px] mt-0.5">{activity.category}</Badge>}
                      </div>
                    </td>
                    {members.map(member => {
                      const role = getAssignment(activity.id, member.id)
                      return (
                        <td key={member.id} className="text-center px-2 py-3">
                          <button
                            onClick={() => cycleRole(activity.id, member.id)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold transition-all hover:scale-110 ${
                              role ? RACI_CONFIG[role].color : 'bg-muted/50 text-muted-foreground/30 hover:bg-muted border border-dashed border-border'
                            }`}
                            title={role ? `${RACI_CONFIG[role].label} — click to change` : 'Click to assign'}
                          >
                            {role || '·'}
                          </button>
                        </td>
                      )
                    })}
                    <td className="px-2 py-3">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500" onClick={() => removeActivity(activity.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Team Members</p><p className="text-2xl font-bold">{members.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Activities</p><p className="text-2xl font-bold">{activities.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Assignments</p><p className="text-2xl font-bold">{totalAssignments}</p></CardContent></Card>
        <Card className={activitiesWithNoAccountable.length > 0 ? 'border-amber-200' : ''}>
          <CardContent className="p-4"><p className="text-xs text-muted-foreground">Missing Accountable</p><p className={`text-2xl font-bold ${activitiesWithNoAccountable.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{activitiesWithNoAccountable.length}</p></CardContent>
        </Card>
      </div>

      {/* Member Management */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Team Members</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-xs text-white font-medium shrink-0">
                  {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role} • {member.department}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => removeMember(member.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={memberForm.name} onChange={e => setMemberForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Role / Title</Label><Input value={memberForm.role} onChange={e => setMemberForm(p => ({ ...p, role: e.target.value }))} placeholder="Product Manager" /></div>
              <div className="space-y-2"><Label>Department</Label><Input value={memberForm.department} onChange={e => setMemberForm(p => ({ ...p, department: e.target.value }))} placeholder="Product" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddMember(false)}>Cancel</Button><Button onClick={addMember}>Add Member</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Activity</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Activity Name *</Label><Input value={activityForm.name} onChange={e => setActivityForm(p => ({ ...p, name: e.target.value }))} placeholder="Quarterly Planning" /></div>
            <div className="space-y-2"><Label>Category</Label><Input value={activityForm.category} onChange={e => setActivityForm(p => ({ ...p, category: e.target.value }))} placeholder="Strategy" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddActivity(false)}>Cancel</Button><Button onClick={addActivity}>Add Activity</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
