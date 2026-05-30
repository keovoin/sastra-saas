import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useBusinessOS } from '@/context/BusinessContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Lock, Save, Loader2, Shield, Camera, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export function ProfilePage() {
  const { profile, session } = useBusinessOS()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const userEmail = session?.user?.email || ''
  const userInitials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail[0]?.toUpperCase() || '?'

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setIsSavingProfile(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), avatar_url: avatarUrl.trim() })
      .eq('id', session?.user?.id || '')

    setIsSavingProfile(false)

    if (error) {
      toast.error('Failed to update profile', { description: error.message })
    } else {
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
      toast.success('Profile updated successfully')
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setIsChangingPassword(false)

    if (error) {
      toast.error('Failed to change password', { description: error.message })
    } else {
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account information and security.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Avatar & Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Profile</CardTitle>
            <CardDescription>This is how others will see you in the workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-bold text-white">
                  {userInitials}
                </div>
                <div className="absolute -bottom-1 -right-1 rounded-full bg-card border border-border p-1">
                  <Camera className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
              <div>
                <p className="font-medium">{fullName || 'Unnamed User'}</p>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  <Shield className="h-3 w-3 mr-1" />
                  {profile?.role === 'admin' ? 'Administrator' : 'Viewer'}
                </Badge>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  value={userEmail}
                  disabled
                  className="pl-10 opacity-60"
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <Label htmlFor="avatar-url">Avatar URL (Optional)</Label>
              <Input
                id="avatar-url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="text-xs text-muted-foreground">Paste a URL to your profile picture. Leave blank for initials.</p>
            </div>

            {/* Save Button */}
            <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="gap-2">
              {isSavingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : profileSaved ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSavingProfile ? 'Saving...' : profileSaved ? 'Saved!' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="pl-10"
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="pl-10"
                />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !newPassword || newPassword !== confirmPassword}
              variant="outline"
              className="gap-2"
            >
              {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
            <CardDescription>Details about your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Account ID</p>
                  <p className="text-xs text-muted-foreground font-mono">{session?.user?.id?.slice(0, 20)}...</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-xs text-muted-foreground">{profile?.role === 'admin' ? 'Administrator — Full access to all features' : 'Viewer — Read-only access'}</p>
                </div>
                <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
                  {profile?.role || 'viewer'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
