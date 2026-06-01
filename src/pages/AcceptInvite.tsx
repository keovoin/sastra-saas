import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Lock, CheckCircle2, ArrowRight } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'

function getParam(name: string): string {
  if (typeof window === 'undefined') return ''
  const url = new URL(window.location.href)
  // Supabase puts auth params in the hash; our own params are in the query.
  const fromQuery = url.searchParams.get(name)
  if (fromQuery) return fromQuery
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  const hashParams = new URLSearchParams(hash)
  return hashParams.get(name) || ''
}

export function AcceptInvite() {
  const wsSlug = getParam('ws')
  const token = getParam('token')

  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  // The Supabase invite link signs the user in (detectSessionInUrl handles the
  // token in the URL). Wait for that session to be established.
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setCheckingSession(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) {
        setSession(s)
        setCheckingSession(false)
      }
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  const redirectToWorkspace = () => {
    const target = wsSlug ? `/w/${encodeURIComponent(wsSlug)}` : '/'
    window.location.href = target
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setIsLoading(true)
    try {
      // 1. Set the user's password (they arrived via an invite session).
      const { error: pwError } = await supabase.auth.updateUser({ password })
      if (pwError) {
        toast.error('Could not set password', { description: pwError.message })
        setIsLoading(false)
        return
      }

      // 2. Ensure membership via the SECURITY DEFINER RPC. It returns the joined
      //    workspace id, or null when no pending invitation matches. A non-owner
      //    cannot self-insert into workspace_members (RLS), so the RPC is the
      //    only valid path — there is intentionally no direct-insert fallback.
      let joined = false
      let joinError: string | null = null
      try {
        const { data: joinedWsId, error: rpcError } = await supabase.rpc(
          'accept_workspace_invitation',
          { invite_token: token || '' }
        )
        if (rpcError) {
          joinError = rpcError.message
        } else if (joinedWsId) {
          joined = true
        } else {
          joinError = 'We couldn\u2019t find a pending invitation for your account.'
        }
      } catch (rpcErr: unknown) {
        joinError = rpcErr instanceof Error ? rpcErr.message : 'Could not process the invitation.'
      }

      setDone(true)

      if (joined) {
        toast.success('Welcome aboard!', { description: 'Your account is ready.' })
        setTimeout(redirectToWorkspace, 1200)
      } else {
        // Password was set successfully, but we couldn't attach them to the
        // invited workspace. Don't fake success — send them to sign in / their
        // own space and explain.
        toast.message('Password set', {
          description: joinError || 'Please sign in to continue.',
        })
        setTimeout(() => { window.location.href = '/' }, 1800)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error('Failed to accept invitation', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white text-lg font-bold mb-3">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sastra</h1>
          <p className="mt-1 text-sm text-slate-500">Business Operating System</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">
              {done ? 'You\u2019re all set' : 'Accept your invitation'}
            </CardTitle>
            <CardDescription>
              {done
                ? 'Redirecting you to your workspace\u2026'
                : wsSlug
                ? `Set a password to join the "${wsSlug}" workspace.`
                : 'Set a password to finish creating your account.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkingSession ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                <p className="text-sm text-slate-500">Verifying your invitation\u2026</p>
              </div>
            ) : done ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <Button onClick={redirectToWorkspace} className="gap-2 mt-2">
                  Go to workspace <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : !session ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                  <p className="text-sm text-amber-800">
                    This invitation link looks invalid or has expired. Please ask your workspace
                    admin to send a new invite.
                  </p>
                </div>
                <a href="/" className="block text-center text-sm text-primary hover:underline">
                  &larr; Back to sign in
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {session.user.email && (
                  <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-600">
                    Joining as <span className="font-medium text-slate-900">{session.user.email}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10"
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10"
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Set password & join
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-400">
          Secured by Supabase Auth with Row Level Security
        </p>
      </div>
    </div>
  )
}
