import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Target, ShieldAlert, FileText, BarChart3, Users, Zap,
  ArrowRight, CheckCircle2, Globe, Lock, Sparkles,
} from 'lucide-react'

interface LandingPageProps {
  onGetStarted: () => void
}

const features = [
  { icon: Target, title: 'Strategy Board', description: 'Interactive SWOT analysis with priority voting and real-time collaboration.', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { icon: ShieldAlert, title: 'Risk Register', description: 'Track risks with auto-calculated severity scoring and visual heatmaps.', color: 'text-red-600', bg: 'bg-red-500/10' },
  { icon: FileText, title: 'Project Charters', description: 'Define scope and objectives with a guided wizard. Export board-ready PDFs.', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  { icon: BarChart3, title: 'Live Dashboard', description: 'KPI cards, burn-down charts, risk heatmaps — all powered by real data.', color: 'text-violet-600', bg: 'bg-violet-500/10' },
  { icon: Sparkles, title: 'AI Strategy Assistant', description: 'Generate SWOT suggestions powered by AI. Get industry insights in seconds.', color: 'text-amber-600', bg: 'bg-amber-500/10' },
  { icon: Users, title: 'Team Collaboration', description: 'Invite members with role-based access. Real-time sync across the team.', color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
]

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">S</div>
            <span className="text-xl font-bold tracking-tight">Sastra</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onGetStarted}>Sign In</Button>
            <Button size="sm" onClick={onGetStarted} className="gap-2">Get Started <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-6">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Now with AI-powered strategy suggestions
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
          Your Business<br />
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Operating System</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Strategy, risk management, and project governance — unified in one platform. Make better decisions faster with real-time collaboration and AI insights.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" onClick={onGetStarted} className="gap-2 text-base px-8">Start Free <ArrowRight className="h-5 w-5" /></Button>
          <Button variant="outline" size="lg" className="gap-2 text-base px-8"><Globe className="h-5 w-5" /> Live Demo</Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {['No credit card required', 'Free for up to 3 projects', 'Real-time collaboration'].map((b) => (
            <span key={b} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {b}</span>
          ))}
        </div>
      </section>

      {/* Preview */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-20">
        <div className="rounded-xl border border-border bg-card shadow-2xl shadow-black/5 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/30">
            <div className="h-3 w-3 rounded-full bg-red-400" /><div className="h-3 w-3 rounded-full bg-amber-400" /><div className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs text-muted-foreground">sastratech.live/dashboard</span>
          </div>
          <div className="p-6 sm:p-8 bg-gradient-to-br from-background to-muted/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {[{ label: 'Revenue', value: '$62.4k', change: '+12.5%', color: 'text-emerald-600' }, { label: 'Strategic Items', value: '24', change: '4 quadrants', color: 'text-blue-600' }, { label: 'Active Risks', value: '6', change: '3 critical', color: 'text-red-600' }, { label: 'Projects', value: '4', change: 'On track', color: 'text-violet-600' }].map((kpi) => (
                <div key={kpi.label} className="rounded-lg border border-border bg-card p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-lg sm:text-2xl font-bold mt-1">{kpi.value}</p>
                  <p className={`text-[10px] sm:text-xs mt-1 ${kpi.color}`}>{kpi.change}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-border">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything you need to run strategy</h2>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">Replace scattered spreadsheets with one integrated platform.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f) => { const Icon = f.icon; return (
            <Card key={f.title} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className={`inline-flex rounded-lg p-2.5 ${f.bg} mb-4`}><Icon className={`h-5 w-5 ${f.color}`} /></div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          )})}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-border">
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to operationalize your strategy?</h2>
          <p className="mt-3 text-violet-100 max-w-lg mx-auto">Join teams who replaced 5+ tools with one Business Operating System.</p>
          <Button size="lg" onClick={onGetStarted} className="mt-6 bg-white text-violet-700 hover:bg-violet-50 gap-2 text-base px-8">Get Started Free <ArrowRight className="h-5 w-5" /></Button>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-violet-200">
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> End-to-end encrypted</span>
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Setup in 60 seconds</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">S</div>
            <span className="text-sm font-semibold">Sastra</span>
          </div>
          <p className="text-sm text-muted-foreground">&copy; 2024 Sastra Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
