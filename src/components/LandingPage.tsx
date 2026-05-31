import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Target, ShieldAlert, FileText, BarChart3, Users, Zap, ArrowRight,
  CheckCircle2, Globe, Lock, Sparkles, GitBranch, Pipette, Heart,
  DollarSign, Calculator, Scale, Building2, Presentation, ChevronDown,
  Star, Quote, Play, Menu, X,
} from 'lucide-react'

interface LandingPageProps {
  onGetStarted: () => void
}

const features = [
  { icon: Target, title: 'SWOT Strategy Board', description: 'Interactive 2x2 grid with priority voting and AI-generated insights per industry.', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { icon: ShieldAlert, title: 'Risk Register', description: 'Auto-calculated severity scoring, visual heatmaps, and AI risk suggestions.', color: 'text-red-600', bg: 'bg-red-500/10' },
  { icon: Pipette, title: 'Sales Pipeline CRM', description: 'Kanban deal tracker with 6 stages and AI-powered next-action recommendations.', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  { icon: Calculator, title: 'Runway Calculator', description: '24-month cash projection with burn rate modeling and AI cost-cutting advice.', color: 'text-violet-600', bg: 'bg-violet-500/10' },
  { icon: Sparkles, title: 'AI Strategy Assistant', description: 'Generate SWOT analysis, competitor insights, and board decks with any LLM provider.', color: 'text-amber-600', bg: 'bg-amber-500/10' },
  { icon: GitBranch, title: 'Goal Cascade', description: 'Link Vision → Goals → Initiatives → Tasks in a visual hierarchy with progress tracking.', color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
  { icon: Heart, title: 'Team Pulse Survey', description: 'Weekly emoji-rated check-ins with trend charts and AI sentiment analysis.', color: 'text-pink-600', bg: 'bg-pink-500/10' },
  { icon: DollarSign, title: 'Unit Economics', description: 'CAC, LTV, payback period — auto-calculated with AI health recommendations.', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { icon: Scale, title: 'Decision Log', description: 'Record decisions with full context, alternatives considered, and AI-suggested options.', color: 'text-sky-600', bg: 'bg-sky-500/10' },
  { icon: Building2, title: 'Organization & RBAC', description: 'Per-module permissions (Admin/Editor/Viewer/None) for granular team access.', color: 'text-teal-600', bg: 'bg-teal-500/10' },
  { icon: Presentation, title: 'Board Deck Generator', description: 'AI generates a full investor update from your real company data in one click.', color: 'text-violet-600', bg: 'bg-violet-500/10' },
  { icon: FileText, title: 'Invoice & Revenue', description: 'Track payments, monitor cash flow, and get AI revenue forecasts.', color: 'text-orange-600', bg: 'bg-orange-500/10' },
]

const testimonials = [
  { name: 'Sarah Chen', title: 'CTO, Meridian Health', quote: 'Replaced our Notion + Google Sheets + Jira combo. The AI board deck generator alone saves us 4 hours per month.', avatar: 'SC' },
  { name: 'Marcus Rivera', title: 'CEO, CloudNine Solutions', quote: 'The runway calculator with AI advice helped us identify $18k/month in savings we were missing.', avatar: 'MR' },
  { name: 'Emily Watson', title: 'VP Strategy, TechFlow', quote: 'Finally one place for SWOT, risks, and OKRs that actually talk to each other. The real-time collaboration is seamless.', avatar: 'EW' },
]

const pricingPlans = [
  { name: 'Starter', price: 'Free', description: 'For solo founders', features: ['3 projects', '5 modules', 'Basic AI (built-in)', 'Email support'], cta: 'Start Free', highlight: false },
  { name: 'Pro', price: '$29', description: 'For growing teams', features: ['Unlimited projects', 'All 21 modules', 'BYOK AI (any provider)', 'Priority support', 'Team collaboration', 'Export & Print'], cta: 'Start Pro Trial', highlight: true },
  { name: 'Enterprise', price: 'Custom', description: 'For organizations', features: ['Everything in Pro', 'SSO & SAML', 'Dedicated success manager', 'Custom integrations', 'SLA guarantee', 'Audit logs'], cta: 'Contact Sales', highlight: false },
]

const stats = [
  { value: '21', label: 'Integrated Modules' },
  { value: '10+', label: 'Tools Replaced' },
  { value: '< 60s', label: 'Setup Time' },
  { value: '99.9%', label: 'Uptime SLA' },
]

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [mobileNav, setMobileNav] = useState(false)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileNav(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Navigation ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">S</div>
            <span className="text-xl font-bold tracking-tight">Sastra</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo('features')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</button>
            <button onClick={() => scrollTo('pricing')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
            <button onClick={() => scrollTo('testimonials')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</button>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onGetStarted}>Sign In</Button>
            <Button size="sm" onClick={onGetStarted} className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0">Get Started <ArrowRight className="h-4 w-4" /></Button>
          </div>
          <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden p-2 text-muted-foreground">
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
            <button onClick={() => scrollTo('features')} className="block w-full text-left text-sm py-2">Features</button>
            <button onClick={() => scrollTo('pricing')} className="block w-full text-left text-sm py-2">Pricing</button>
            <button onClick={() => scrollTo('testimonials')} className="block w-full text-left text-sm py-2">Testimonials</button>
            <Button className="w-full mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white" onClick={onGetStarted}>Get Started</Button>
          </div>
        )}
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl animate-float" />
          <div className="absolute top-40 right-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl animate-float delay-200" />
          <div className="absolute bottom-20 left-1/3 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl animate-float delay-400" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-20 sm:pt-32 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 glass px-4 py-1.5 text-sm text-violet-200 mb-8 animate-fade-in-up">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Now with AI-powered strategy generation
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-white animate-fade-in-up delay-100">
            Run Your Entire Business<br />
            <span className="gradient-text bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent animate-gradient">From One Platform</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-violet-200/80 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Strategy, risk management, sales pipeline, financial modeling, and team health — unified with AI. Replace 10+ scattered tools with one beautiful system.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
            <Button size="lg" onClick={onGetStarted} className="gap-2 text-base px-8 h-13 bg-white text-slate-900 hover:bg-violet-50 shadow-xl shadow-white/10 hover-lift">
              Start Free <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="gap-2 text-base px-8 h-13 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm" onClick={() => scrollTo('features')}>
              <Play className="h-4 w-4" /> See All Features
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-violet-300/80 animate-fade-in-up delay-400">
            {['No credit card required', 'Free tier available', '21+ modules included'].map((b) => (
              <span key={b} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {b}</span>
            ))}
          </div>

          {/* Floating Illustrations */}
          <div className="absolute top-20 left-8 hidden lg:block animate-float">
            <div className="glass rounded-xl p-3 shadow-xl"><Target className="h-6 w-6 text-emerald-400" /></div>
          </div>
          <div className="absolute top-32 right-12 hidden lg:block animate-float delay-300">
            <div className="glass rounded-xl p-3 shadow-xl"><BarChart3 className="h-6 w-6 text-violet-400" /></div>
          </div>
          <div className="absolute bottom-32 left-16 hidden lg:block animate-float delay-500">
            <div className="glass rounded-xl p-3 shadow-xl"><Sparkles className="h-6 w-6 text-amber-400" /></div>
          </div>
          <div className="absolute bottom-24 right-24 hidden lg:block animate-float delay-100">
            <div className="glass rounded-xl p-3 shadow-xl"><ShieldAlert className="h-6 w-6 text-red-400" /></div>
          </div>
        </div>
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0,40 C360,80 720,0 1440,40 L1440,80 L0,80 Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* ─── Stats Bar ────────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Dashboard Preview ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
        <div className="rounded-xl border border-border bg-card shadow-2xl shadow-black/5 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/30">
            <div className="h-3 w-3 rounded-full bg-red-400" /><div className="h-3 w-3 rounded-full bg-amber-400" /><div className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs text-muted-foreground">app — Dashboard</span>
          </div>
          <div className="p-4 sm:p-6 bg-gradient-to-br from-background to-muted/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[{ l: 'Revenue', v: '$62.4k', c: '+12.5%', cl: 'text-emerald-600' }, { l: 'Risks', v: '6 Active', c: '3 critical', cl: 'text-red-600' }, { l: 'Pipeline', v: '$850k', c: '8 deals', cl: 'text-blue-600' }, { l: 'Runway', v: '18 mo', c: 'Healthy', cl: 'text-violet-600' }].map((k) => (
                <div key={k.l} className="rounded-lg border border-border bg-card p-3"><p className="text-[10px] sm:text-xs text-muted-foreground">{k.l}</p><p className="text-base sm:text-xl font-bold mt-0.5">{k.v}</p><p className={`text-[10px] sm:text-xs mt-0.5 ${k.cl}`}>{k.c}</p></div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 h-32 rounded-lg border border-border bg-gradient-to-tr from-violet-500/5 to-indigo-500/5 flex items-center justify-center"><BarChart3 className="h-12 w-12 text-muted-foreground/30" /></div>
              <div className="h-32 rounded-lg border border-border bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 flex items-center justify-center"><Target className="h-12 w-12 text-muted-foreground/30" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ────────────────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 border-t border-border">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-2">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">21 Modules. One Platform.</h2>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">Everything you need to run strategy, operations, finance, and people — integrated and AI-enhanced.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, idx) => { const Icon = f.icon; return (
            <Card key={f.title} className="border-border card-glow hover-lift group animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <CardContent className="p-5">
                <div className={`inline-flex rounded-lg p-2.5 ${f.bg} mb-3 group-hover:scale-110 transition-transform`}><Icon className={`h-5 w-5 ${f.color}`} /></div>
                <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          )})}
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-2">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Up and Running in 60 Seconds</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Sign Up', description: 'Create your account with email or magic link. No credit card needed.' },
              { step: '2', title: 'Create a Project', description: 'Set up your first project. Add SWOT items, risks, and goals.' },
              { step: '3', title: 'Invite Your Team', description: 'Add team members with role-based access. Collaborate in real-time.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-lg font-bold mb-4">{s.step}</div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI Section ───────────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 mb-4">
                <Sparkles className="h-3 w-3" /> AI-Powered
              </div>
              <h2 className="text-3xl font-bold tracking-tight">AI That Understands Your Business</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">Every module has built-in AI. Generate SWOT analyses, suggest risks, recommend deal actions, forecast revenue, and produce board decks — all from your real data.</p>
              <ul className="mt-6 space-y-3">
                {['Works with OpenAI, Groq, Together AI, OpenRouter, or Ollama', 'Bring Your Own Key — stored only in your browser', 'AI reads your actual data for contextual insights', 'Rate-limited and sanitized for security'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />{item}</li>
                ))}
              </ul>
              <Button className="mt-6 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white" onClick={onGetStarted}><Sparkles className="h-4 w-4" /> Try AI Features</Button>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-amber-500" /> AI Strategy Assistant</div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground mb-2">Industry: SaaS / Technology</p>
                <div className="space-y-2">{['Recurring revenue model with predictable cash flow', 'Scalable infrastructure with low marginal cost per user', 'Strong developer ecosystem and API-first architecture'].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm"><div className="h-2 w-2 rounded-full bg-emerald-500" />{s}</div>
                ))}</div>
              </div>
              <Button variant="outline" size="sm" className="gap-1 text-xs" disabled><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Added to Strategy Board</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────────── */}
      <section id="testimonials" className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-2">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Loved by Strategy Teams</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">{Array.from({length: 5}).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
                  <Quote className="h-5 w-5 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-foreground leading-relaxed mb-4">{t.quote}</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-border">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-medium text-white">{t.avatar}</div>
                    <div><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.title}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-2">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.highlight ? 'border-primary shadow-lg shadow-primary/10 ring-1 ring-primary' : 'border-border'}`}>
                {plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">Most Popular</div>}
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== 'Free' && plan.price !== 'Custom' && <span className="text-muted-foreground text-sm">/month</span>}
                  </div>
                  <Button onClick={onGetStarted} className={`w-full ${plan.highlight ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>{plan.cta}</Button>
                  <ul className="mt-6 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{f}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12 text-center text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 animate-gradient" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-1/4 h-32 w-32 rounded-full bg-white/20 blur-2xl animate-float" />
              <div className="absolute bottom-4 right-1/4 h-24 w-24 rounded-full bg-white/20 blur-2xl animate-float delay-300" />
            </div>
            <div className="relative">
              <h2 className="text-2xl sm:text-4xl font-bold">Ready to unify your business operations?</h2>
              <p className="mt-3 text-violet-100 max-w-lg mx-auto">Join teams who replaced 10+ tools with one AI-powered Business Operating System.</p>
              <Button size="lg" onClick={onGetStarted} className="mt-6 bg-white text-violet-700 hover:bg-violet-50 gap-2 text-base px-8 h-12 shadow-xl hover-lift">Get Started Free <ArrowRight className="h-5 w-5" /></Button>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm text-violet-200">
                <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> End-to-end encrypted</span>
                <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Setup in 60 seconds</span>
                <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Works worldwide</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">S</div>
                <span className="font-bold">Sastra</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">The all-in-one Business Operating System for strategy-driven teams.</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">Product</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>Features</li><li>Pricing</li><li>AI Assistant</li><li>Security</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">Resources</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>Documentation</li><li>API Reference</li><li>Changelog</li><li>Status Page</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">Company</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>About</li><li>Blog</li><li>Careers</li><li>Contact</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">&copy; 2026 Sastra Technologies. All rights reserved.</p>
            <div className="flex gap-4 text-xs">
              <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
              <a href="/refund" className="text-muted-foreground hover:text-foreground transition-colors">Refund Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
