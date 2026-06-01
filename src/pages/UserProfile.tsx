import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { User, Edit2, Calendar, Shield, Activity, Lock, GitPullRequest } from 'lucide-react'
import { toast } from 'sonner'
import { useBusinessOS } from '@/context/BusinessContext'
import {
  getDepartments, getPositions,
  getUserWorkspaceProfile, setUserWorkspaceProfile, addDeptChangeRequest,
} from '@/lib/workspace'

export function UserProfile() {
  const { profile, isAdmin } = useBusinessOS()
  const departments = getDepartments()
  const positions = getPositions()
  const stored = getUserWorkspaceProfile()

  const [editing, setEditing] = useState(false)
  const [showDeptRequest, setShowDeptRequest] = useState(false)
  const [requestedDept, setRequestedDept] = useState('')
  const [form, setForm] = useState({
    fullName: profile?.full_name || '',
    nickname: stored.nickname || '',
    positionId: stored.positionId || (positions[0]?.id ?? ''),
    department: stored.department || '',
    departmentLocked: stored.departmentLocked || false,
  })

  const positionTitle = positions.find(p => p.id === form.positionId)?.title || 'Not set'

  const save = () => {
    // If department not yet locked and a department was picked, lock it now.
    const lockDept = form.department ? true : false
    setUserWorkspaceProfile({
      nickname: form.nickname,
      positionId: form.positionId,
      department: form.department,
      departmentLocked: lockDept,
    })
    setForm(p => ({ ...p, departmentLocked: lockDept }))
    setEditing(false)
    toast.success('Profile updated')
  }

  const submitDeptRequest = () => {
    if (!requestedDept) { toast.error('Select a department'); return }
    addDeptChangeRequest({
      memberName: form.fullName || profile?.full_name || 'User',
      fromDept: form.department,
      toDept: requestedDept,
    })
    setShowDeptRequest(false)
    setRequestedDept('')
    toast.success('Department change request sent to admin')
  }

  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'
  const initials = profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Profile Header */}
      <Card className="card-glow overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />
        <CardContent className="p-6 -mt-12">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-2xl text-white font-bold border-4 border-card shadow-lg">
              {initials}
            </div>
            <div className="flex-1 pb-1">
              <h1 className="text-xl font-bold">{form.fullName || profile?.full_name || 'User'}{form.nickname && <span className="text-muted-foreground font-normal text-base"> ({form.nickname})</span>}</h1>
              <p className="text-sm text-muted-foreground">{positionTitle}{form.department && ` • ${form.department}`}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Edit2 className="h-4 w-4 mr-1" />Edit</Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium">{form.fullName || profile?.full_name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Nickname</span><span className="font-medium">{form.nickname || '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Position</span><span className="font-medium">{positionTitle}</span></div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium flex items-center gap-1">
                {form.department || 'Not set'}
                {form.departmentLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </span>
            </div>
            <div className="flex justify-between text-sm items-center"><span className="text-muted-foreground">Member Since</span><span className="font-medium flex items-center gap-1"><Calendar className="h-3 w-3" />{memberSince}</span></div>
            {form.departmentLocked && (
              <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => setShowDeptRequest(true)}>
                <GitPullRequest className="h-3.5 w-3.5 mr-1" />Request Department Change
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Role & Permissions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Organization Role</span>
              <Badge className={isAdmin ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}>
                {isAdmin ? 'Workspace Admin' : 'Member'}
              </Badge>
            </div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Can Invite</span><span className="font-medium">{isAdmin ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Manage Workspace</span><span className="font-medium">{isAdmin ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Module Access</span><span className="font-medium">{isAdmin ? 'All' : 'By Department'}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" />Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Activity tracking will appear here as you use the platform</p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Nickname</Label><Input value={form.nickname} onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))} placeholder="What people call you" /></div>
            <div className="space-y-2">
              <Label>Position</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.positionId} onChange={e => setForm(p => ({ ...p, positionId: e.target.value }))}>
                {positions.map(p => <option key={p.id} value={p.id}>{p.title} (L{p.level})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">Department {form.departmentLocked && <Lock className="h-3 w-3 text-muted-foreground" />}</Label>
              {form.departmentLocked ? (
                <div className="text-sm p-2.5 rounded-md border border-border bg-muted/40 flex items-center justify-between">
                  <span>{form.department}</span>
                  <span className="text-xs text-muted-foreground">Locked — request change from profile</span>
                </div>
              ) : (
                <>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <p className="text-[11px] text-muted-foreground">You can set your department once. Changing it later requires admin approval.</p>
                </>
              )}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Department Change Request Dialog */}
      <Dialog open={showDeptRequest} onOpenChange={setShowDeptRequest}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Department Change</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Current department: <span className="font-medium text-foreground">{form.department}</span></p>
            <div className="space-y-2">
              <Label>Requested Department</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={requestedDept} onChange={e => setRequestedDept(e.target.value)}>
                <option value="">Select...</option>
                {departments.filter(d => d !== form.department).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <p className="text-[11px] text-muted-foreground">Your admin will review and approve this request.</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowDeptRequest(false)}>Cancel</Button><Button onClick={submitDeptRequest}>Send Request</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
