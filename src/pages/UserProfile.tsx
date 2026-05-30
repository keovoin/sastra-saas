import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { User, Edit2, Mail, Calendar, Shield, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { useBusinessOS } from '@/context/BusinessContext'

export function UserProfile() {
  const { profile, isAdmin } = useBusinessOS()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    fullName: profile?.full_name || '',
    title: 'Team Member',
    department: 'General',
  })

  const save = () => {
    setEditing(false)
    toast.success('Profile updated')
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
              <h1 className="text-xl font-bold">{form.fullName || profile?.full_name || 'User'}</h1>
              <p className="text-sm text-muted-foreground">{form.title} • {form.department}</p>
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
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Title</span><span className="font-medium">{form.title}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Department</span><span className="font-medium">{form.department}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Email</span><span className="font-medium text-xs">{profile?.id ? '***@***.com' : '—'}</span></div>
            <div className="flex justify-between text-sm items-center"><span className="text-muted-foreground">Member Since</span><span className="font-medium flex items-center gap-1"><Calendar className="h-3 w-3" />{memberSince}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Role & Permissions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Organization Role</span>
              <Badge className={isAdmin ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}>
                {isAdmin ? 'Administrator' : 'Viewer'}
              </Badge>
            </div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Can Invite</span><span className="font-medium">{isAdmin ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Can Create Projects</span><span className="font-medium">{isAdmin ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Module Access</span><span className="font-medium">All</span></div>
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
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
