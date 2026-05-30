import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react'

type AuthMode = 'sign_in' | 'sign_up' | 'magic_link'

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setIsLoading(false)

    if (error) {
      toast.error('Sign in failed', { description: error.message })
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || email },
      },
    })
    setIsLoading(false)

    if (error) {
      toast.error('Sign up failed', { description: error.message })
    } else {
      toast.success('Account created!', {
        description: 'Check your email for a confirmation link, or sign in directly if email confirmation is disabled.',
      })
      setMode('sign_in')
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setIsLoading(false)

    if (error) {
      toast.error('Failed to send magic link', { description: error.message })
    } else {
      toast.success('Magic link sent!', { description: `Check ${email} for the login link.` })
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
              {mode === 'sign_in' && 'Welcome back'}
              {mode === 'sign_up' && 'Create your account'}
              {mode === 'magic_link' && 'Passwordless login'}
            </CardTitle>
            <CardDescription>
              {mode === 'sign_in' && 'Sign in to your workspace'}
              {mode === 'sign_up' && 'Start managing your business operations'}
              {mode === 'magic_link' && "We'll send you a login link via email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={
                mode === 'sign_in'
                  ? handleSignIn
                  : mode === 'sign_up'
                  ? handleSignUp
                  : handleMagicLink
              }
              className="space-y-4"
            >
              {mode === 'sign_up' && (
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {mode !== 'magic_link' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
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
              )}

              {mode === 'sign_in' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('magic_link')}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {mode === 'sign_in' && 'Sign In'}
                {mode === 'sign_up' && 'Create Account'}
                {mode === 'magic_link' && 'Send Magic Link'}
              </Button>
            </form>

            {/* OAuth Providers */}
            {mode !== 'magic_link' && (
              <div className="mt-4 space-y-2">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-full border-t border-slate-200" />
                  <span className="relative bg-white px-3 text-xs text-slate-400">or continue with</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Button variant="outline" type="button" className="w-full gap-2" disabled={isLoading}
                    onClick={async () => {
                      const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: window.location.origin } })
                      if (error) toast.error('GitHub login failed', { description: error.message })
                    }}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    GitHub
                  </Button>
                  <Button variant="outline" type="button" className="w-full gap-2" disabled={isLoading}
                    onClick={async () => {
                      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
                      if (error) toast.error('Google login failed', { description: error.message })
                    }}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                  </Button>
                </div>
              </div>
            )}

            {/* Mode Switcher */}
            <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
              {mode === 'sign_in' && (
                <>
                  <button
                    onClick={() => setMode('sign_up')}
                    className="w-full text-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Don&apos;t have an account? <span className="font-medium">Sign up</span>
                  </button>
                  <button
                    onClick={() => setMode('magic_link')}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Or sign in with a magic link
                  </button>
                </>
              )}
              {mode === 'sign_up' && (
                <button
                  onClick={() => setMode('sign_in')}
                  className="w-full text-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Already have an account? <span className="font-medium">Sign in</span>
                </button>
              )}
              {mode === 'magic_link' && (
                <button
                  onClick={() => setMode('sign_in')}
                  className="w-full text-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Back to <span className="font-medium">password login</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-400">
          Secured by Supabase Auth with Row Level Security
        </p>
      </div>
    </div>
  )
}
