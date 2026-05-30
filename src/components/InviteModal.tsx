import React, { useState } from 'react'
import { useBusinessOS } from '@/context/BusinessContext'
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
import { UserPlus, Mail, Shield, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface InviteModalProps {
  open: boolean
  onClose: () => void
}

export function InviteModal({ open, onClose }: InviteModalProps) {
  const { activeProject } = useBusinessOS()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer')
  const [isLoading, setIsLoading] = useState(false)
  const [invitedMembers, setInvitedMembers] = useState<Array<{ email: string; role: string; date: string }>>([])

  const handleInvite = async () => {
    if (!email.trim() || !activeProject) return

    setIsLoading(true)

    // Simulate invite - in production, this would send an email via Supabase Edge Function
    // or store in an invites table
    await new Promise((resolve) => setTimeout(resolve, 800))

    const newMember = {
      email: email.trim(),
      role,
      date: new Date().toLocaleDateString(),
    }

    setInvitedMembers((prev) => [newMember, ...prev])
    setIsLoading(false)
    setEmail('')

    toast.success(`Invitation sent to ${newMember.email}`, {
      description: `They will join as ${role === 'admin' ? 'an Admin' : 'a Viewer'}.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Invite people to collaborate on "{activeProject?.title || 'this project'}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleInvite() } }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
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
                  <p className="text-xs text-muted-foreground">Full access</p>
                </div>
              </button>
              <button
                onClick={() => setRole('viewer')}
                className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                  role === 'viewer'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <Eye className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium">Viewer</p>
                  <p className="text-xs text-muted-foreground">Read only</p>
                </div>
              </button>
            </div>
          </div>

          {/* Recent invites */}
          {invitedMembers.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground">Recently Invited</p>
              {invitedMembers.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                      {m.email[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-foreground">{m.email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{m.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
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
