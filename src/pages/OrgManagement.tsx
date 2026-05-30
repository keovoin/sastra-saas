import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Building2, Plus, Users, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAI } from '@/lib/ai'
import {
  type OrgMember,
  type ModulePermission,
  type ModuleId,
  ALL_MODULES,
  getDefaultPermissions,
} from '@/store/permissions'


const initialMembers: OrgMember[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    email: 'sarah@sastra.io',
    department: 'Engineering',
    title: 'CTO',
    orgRole: 'owner',
    modules: getDefaultPermissions('owner'),
  },
  {
    id: '2',
    name: 'Marcus Rivera',
    email: 'marcus@sastra.io',
    department: 'Product',
    title: 'VP Product',
    orgRole: 'admin',
    modules: getDefaultPermissions('admin'),
  },
  {
    id: '3',
    name: 'Emily Watson',
    email: 'emily@sastra.io',
    department: 'Sales',
    title: 'Sales Director',
    orgRole: 'admin',
    modules: getDefaultPermissions('admin'),
  },
  {
    id: '4',
    name: 'James Park',
    email: 'james@sastra.io',
    department: 'Engineering',
    title: 'Senior Engineer',
    orgRole: 'member',
    modules: getDefaultPermissions('member'),
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    email: 'lisa@sastra.io',
    department: 'Marketing',
    title: 'Marketing Manager',
    orgRole: 'member',
    modules: getDefaultPermissions('member'),
  },
  {
    id: '6',
    name: 'David Okafor',
    email: 'david@sastra.io',
    department: 'Finance',
    title: 'Finance Lead',
    orgRole: 'admin',
    modules: getDefaultPermissions('admin'),
  },
  {
    id: '7',
    name: 'Rachel Green',
    email: 'rachel@sastra.io',
    department: 'Design',
    title: 'UX Designer',
    orgRole: 'member',
    modules: getDefaultPermissions('member'),
  },
]


export function OrgManagement() {
  const [members, setMembers] = useState<OrgMember[]>(initialMembers)
  const [showForm, setShowForm] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    department: '',
    title: '',
    orgRole: 'member' as 'owner' | 'admin' | 'member',
  })

  const addMember = () => {
    if (!newMember.name || !newMember.email) {
      toast.error('Please fill in name and email')
      return
    }
    const member: OrgMember = {
      id: Date.now().toString(),
      name: newMember.name,
      email: newMember.email,
      department: newMember.department || 'General',
      title: newMember.title || 'Team Member',
      orgRole: newMember.orgRole,
      modules: getDefaultPermissions(newMember.orgRole),
    }
    setMembers(prev => [...prev, member])
    setNewMember({ name: '', email: '', department: '', title: '', orgRole: 'member' })
    setShowForm(false)
    toast.success(`${member.name} added to organization`)
  }

  const updatePermission = (memberId: string, moduleId: ModuleId, permission: ModulePermission) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m
      return { ...m, modules: { ...m.modules, [moduleId]: permission } }
    }))
    toast.success('Permission updated')
  }

  const roleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'admin': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const permColor = (perm: ModulePermission) => {
    switch (perm) {
      case 'admin': return 'text-purple-700 bg-purple-50'
      case 'editor': return 'text-blue-700 bg-blue-50'
      case 'viewer': return 'text-green-700 bg-green-50'
      case 'none': return 'text-gray-400 bg-gray-50'
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/10">
            <Building2 className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Organization Management</h1>
            <p className="text-muted-foreground">Manage team members, roles, and module-level permissions</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Add Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Members</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{members.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Owners</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{members.filter(m => m.orgRole === 'owner').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Admins</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{members.filter(m => m.orgRole === 'admin').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Members</span>
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{members.filter(m => m.orgRole === 'member').length}</p>
          </CardContent>
        </Card>
      </div>


      {/* Add Member Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Jane Smith" value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="jane@company.io" value={newMember.email} onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input placeholder="Engineering" value={newMember.department} onChange={e => setNewMember(p => ({ ...p, department: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Software Engineer" value={newMember.title} onChange={e => setNewMember(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Org Role</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={newMember.orgRole}
                  onChange={e => setNewMember(p => ({ ...p, orgRole: e.target.value as 'owner' | 'admin' | 'member' }))}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
            </div>
            <Button onClick={addMember} className="mt-4">Add Member</Button>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Click a member to manage their module permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Department</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Org Role</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Permissions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium text-foreground">{member.name}</td>
                    <td className="p-3 text-muted-foreground">{member.email}</td>
                    <td className="p-3 text-foreground">{member.department}</td>
                    <td className="p-3 text-muted-foreground">{member.title}</td>
                    <td className="p-3 text-center">
                      <Badge className={roleColor(member.orgRole)}>{member.orgRole}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
                      >
                        {selectedMember === member.id ? 'Hide' : 'Manage'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>


      {/* Permissions Grid */}
      {selectedMember && (
        <Card>
          <CardHeader>
            <CardTitle>Module Permissions — {members.find(m => m.id === selectedMember)?.name}</CardTitle>
            <CardDescription>Set access level for each module</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 font-medium text-muted-foreground">Module</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Category</th>
                    <th className="text-center p-2 font-medium text-muted-foreground">Permission</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_MODULES.map(mod => {
                    const member = members.find(m => m.id === selectedMember)!
                    const currentPerm = member.modules[mod.id]
                    return (
                      <tr key={mod.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-2">
                          <div>
                            <p className="font-medium text-foreground">{mod.label}</p>
                            <p className="text-xs text-muted-foreground">{mod.description}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="secondary" className="text-xs capitalize">{mod.category}</Badge>
                        </td>
                        <td className="p-2 text-center">
                          <select
                            className={`h-8 rounded-md border border-input px-2 text-xs font-medium ${permColor(currentPerm)}`}
                            value={currentPerm}
                            onChange={e => updatePermission(member.id, mod.id, e.target.value as ModulePermission)}
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                            <option value="none">None</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
