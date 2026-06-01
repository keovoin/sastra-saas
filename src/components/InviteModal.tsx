import React, { useState } from 'react'
import { useWorkspaceOptional } from '@/context/WorkspaceContext'
import { getDepartments } from '@/lib/workspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { UserPlus, Mail, Shield, Eye, Loader2, Copy, Check, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface InviteModalProps {
  open: boolean
  onClose: () => void
}

type InviteRole = 'admin' | 'member'

export function InviteModal({ open, onClose }: InviteModalProps) {
  const workspace = useWorkspaceOptional()
  const departments = getDepartments()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('member')
  const [department, setDepartment] = useState(departments[0] || '')
  const [isLoading, setIsLoading] = useState(false)
  const [fallbackLink, setFallbackLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const currentWorkspace = workspace?.currentWorkspace || null
  const invitations = workspace?.invitations || []
  const pendingInvites = invitations.filter((i) => i.status === 'pending')

  const resetAndClose = () => {
    setEmail('')
    setFallbackLink(null)
    setCopied(false)
    onClose()
  }

  const handleInvite = async () => {
    const trimmed = email.trim()
    if (!trimmed) return

    if (!workspace || !currentWorkspace) {
      toast.error('No active workspace', {
        description: 'Workspace invitations require the workspace tables to be set up.',
      })
      return
    }

    setIsLoading(true)
    setFallbackLink(null)
    setCopied(false)

    const result = await workspace.inviteMember({ email: trimmed, role, department })

    setIsLoading(false)

    if (result.success) {
      if (result.emailSent === false) {
        // Email could not be sent — surface a copyable link instead.
        setFallbackLink(result.inviteLink || null)
        toast.warning('Invitation created (email not sent)', {
          description: result.warning || 'Copy the invite link below and share it directly.',
        })
      } else {
        toast.success(`Invitation sent to ${trimmed}`, {
          description: `They will join "${currentWorkspace.name}" as ${role === 'admin' ? 'an Admin' : 'a Member'}.`,
        })
        setEmail('')
      }
    } else {
      // Failure — still offer the fallback link if the server returned one.
      if (result.inviteLink) setFallbackLink(result.inviteLink)
      toast.error('Could not send invitation', {
        description: result.error || 'Please try again.',
      })
    }
  }

  const copyLink = async () => {
    if (!fallbackLink) return
    try {
      await navigator.clipboard.writeText(fallbackLink)
      setCopied(true)
      toast.success('Invite link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy — select and copy manually')
    }
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Invite people to join{' '}
            <span className="font-medium">"{currentWorkspace?.name || 'your workspace'}"</span>. They'll
            receive an email to set a password and join.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="pl-10"
                disabled={isLoading}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleInvite() } }}
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                  role === 'admin'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Shield className="h-4 w-4 text-violet-600" />
                <div>
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-muted-foreground">Manage workspace</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                  role === 'member'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Eye className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium">Member</p>
                  <p className="text-xs text-muted-foreground">Standard access</p>
                </div>
              </button>
            </div>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="invite-department">Department</Label>
            <select
              id="invite-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Fallback copy-link (shown when email delivery failed) */}
          {fallbackLink && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Email couldn't be sent. Share this invite link directly:
              </p>
              <div className="flex items-center gap-2">
                <Input value={fallbackLink} readOnly className="text-xs font-mono" />
                <Button type="button" size="sm" variant="outline" onClick={copyLink} className="shrink-0 gap-1">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {/* Pending invitations */}
          {pendingInvites.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground">Pending Invitations</p>
              {pendingInvites.slice(0, 5).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                      {inv.email[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm text-foreground truncate">{inv.email}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
                    <Clock className="h-3 w-3" />{inv.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            Done
          </Button>
          <Button onClick={handleInvite} disabled={!email.trim() || isLoading} className="gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
