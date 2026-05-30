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
