import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export function Settings() {
  const handleSave = () => {
    toast.success('Settings saved successfully')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your workspace preferences and team configuration.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace</CardTitle>
            <CardDescription>General workspace settings and branding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input id="workspace-name" defaultValue="Sastra Technologies" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-url">Workspace URL</Label>
              <Input id="workspace-url" defaultValue="sastra-tech" disabled />
              <p className="text-xs text-slate-500">https://app.sastra.io/sastra-tech</p>
            </div>
            <Button onClick={handleSave} size="sm">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Members</CardTitle>
            <CardDescription>People with access to this workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Jennifer Walsh', email: 'jennifer@sastra.io', role: 'Owner' },
                { name: 'Sarah Chen', email: 'sarah@sastra.io', role: 'Admin' },
                { name: 'Marcus Johnson', email: 'marcus@sastra.io', role: 'Member' },
                { name: 'Priya Sharma', email: 'priya@sastra.io', role: 'Member' },
              ].map((member) => (
                <div key={member.email} className="flex items-center justify-between rounded-md border border-slate-100 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-medium text-white">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{member.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>Choose what updates you receive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Risk severity changes', description: 'When a risk crosses the high-severity threshold', enabled: true },
              { label: 'New team member joins', description: 'When someone accepts a workspace invitation', enabled: true },
              { label: 'Charter milestones', description: 'When a project reaches a key milestone date', enabled: false },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between rounded-md border border-slate-100 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{pref.label}</p>
                  <p className="text-xs text-slate-500">{pref.description}</p>
                </div>
                <button
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    pref.enabled ? 'bg-slate-900' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      pref.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
