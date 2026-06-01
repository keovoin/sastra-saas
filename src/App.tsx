import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BusinessOSProvider } from '@/context/BusinessContext'
import { DataProvider } from '@/context/DataContext'
import { Analytics } from '@vercel/analytics/react'
import { Layout } from '@/components/Layout'
import { PrintView } from '@/components/PrintView'
import { LandingPage } from '@/components/LandingPage'
import { Dashboard } from '@/pages/Dashboard'
import { StrategyBoard } from '@/pages/StrategyBoard'
import { RiskRegister } from '@/pages/RiskRegister'
import { ProjectCharters } from '@/pages/ProjectCharters'
import { Settings } from '@/pages/Settings'
import { ActivityFeed } from '@/pages/ActivityFeed'
import { AIAssistant } from '@/pages/AIAssistant'
import { ProfilePage } from '@/pages/ProfilePage'
import { CompetitorTracker } from '@/pages/CompetitorTracker'
import { RunwayCalculator } from '@/pages/RunwayCalculator'
import { StakeholderMap } from '@/pages/StakeholderMap'
import { KPIBuilder } from '@/pages/KPIBuilder'
import { DecisionLog } from '@/pages/DecisionLog'
import { GoalCascade } from '@/pages/GoalCascade'
import { SalesPipeline } from '@/pages/SalesPipeline'
import { UnitEconomics } from '@/pages/UnitEconomics'
import { InvoiceTracker } from '@/pages/InvoiceTracker'
import { PulseSurvey } from '@/pages/PulseSurvey'
import { BoardDeckGenerator } from '@/pages/BoardDeckGenerator'
import { OrgManagement } from '@/pages/OrgManagement'
import { ProjectBoard } from '@/pages/ProjectBoard'
import { OnboardingChecklist } from '@/pages/OnboardingChecklist'
import { OffboardingChecklist } from '@/pages/OffboardingChecklist'
import { EmployeeMovement } from '@/pages/EmployeeMovement'
import { CalendarView } from '@/pages/CalendarView'
import { Messaging } from '@/pages/Messaging'
import { BillingPlans } from '@/pages/BillingPlans'
import { StaffWorkload } from '@/pages/StaffWorkload'
import { UserProfile } from '@/pages/UserProfile'
import { RACIMatrix } from '@/pages/RACIMatrix'
import { AdminPortal } from '@/pages/AdminPortal'
import { checkIsSuperadmin } from '@/lib/admin'
import { AuthScreen } from '@/components/AuthScreen'
import { AcceptInvite } from '@/pages/AcceptInvite'
import { WorkspaceProvider } from '@/context/WorkspaceContext'
import { Toaster } from 'sonner'
import { SpeedInsights } from '@vercel/speed-insights/react'
import type { Session } from '@supabase/supabase-js'

function AuthenticatedApp({ session }: { session: Session }) {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [printMode, setPrintMode] = useState<'risks' | 'charters' | null>(null)

  const handleExport = () => {
    if (currentPage === 'risks') setPrintMode('risks')
    else if (currentPage === 'charters') setPrintMode('charters')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'project-board': return <ProjectBoard />
      case 'calendar': return <CalendarView />
      case 'messaging': return <Messaging />
      case 'strategy': return <StrategyBoard />
      case 'risks': return <RiskRegister />
      case 'charters': return <ProjectCharters />
      case 'competitors': return <CompetitorTracker />
      case 'runway': return <RunwayCalculator />
      case 'stakeholders': return <StakeholderMap />
      case 'kpis': return <KPIBuilder />
      case 'decisions': return <DecisionLog />
      case 'goals': return <GoalCascade />
      case 'pipeline': return <SalesPipeline />
      case 'unit-economics': return <UnitEconomics />
      case 'invoices': return <InvoiceTracker />
      case 'pulse': return <PulseSurvey />
      case 'board-deck': return <BoardDeckGenerator />
      case 'org': return <OrgManagement />
      case 'onboarding': return <OnboardingChecklist />
      case 'offboarding': return <OffboardingChecklist />
      case 'employee-movement': return <EmployeeMovement />
      case 'workload': return <StaffWorkload />
      case 'activity': return <ActivityFeed />
      case 'ai-assistant': return <AIAssistant />
      case 'user-profile': return <UserProfile />
      case 'raci': return <RACIMatrix />
      case 'billing': return <BillingPlans />
      case 'profile': return <ProfilePage />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <BusinessOSProvider session={session}>
      <WorkspaceProvider session={session}>
        <DataProvider>
          <Layout currentPage={currentPage} onNavigate={setCurrentPage} onExport={handleExport}>
            {renderPage()}
          </Layout>
          {printMode && <PrintView mode={printMode} onClose={() => setPrintMode(null)} />}
        </DataProvider>
      </WorkspaceProvider>
    </BusinessOSProvider>
  )
}

function AdminApp({ session }: { session: Session }) {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>('checking')

  useEffect(() => {
    checkIsSuperadmin(session.user.id).then(isAdmin => {
      setStatus(isAdmin ? 'allowed' : 'denied')
    })
  }, [session.user.id])

  if (status === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-muted border-t-violet-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <svg className="h-7 w-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h1 className="text-xl font-bold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">You don't have permission to access the Admin Portal. This area is restricted to platform administrators.</p>
          <a href="/" className="text-sm text-violet-600 hover:underline mt-2">&larr; Back to App</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold">S</div>
            <span className="font-bold">Sastra Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground">Exit to App</a>
            <button onClick={() => supabase.auth.signOut()} className="text-sm text-red-500 hover:text-red-600">Sign Out</button>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl p-4 lg:p-6">
        <AdminPortal />
      </div>
    </div>
  )
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  // Detect special routes via pathname (keeps the existing /admin pattern)
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const isAdminRoute = pathname.startsWith('/admin')
  const isAcceptInviteRoute = pathname.startsWith('/accept-invite')
  const isWorkspaceRoute = pathname.startsWith('/w/')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) setShowAuth(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold animate-pulse">S</div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Accept-invite route — the Supabase invite link establishes a session in the
  // URL; AcceptInvite handles the rest (set password, join, redirect).
  if (isAcceptInviteRoute) {
    return <><AcceptInvite /><Toaster position="bottom-right" richColors closeButton /></>
  }

  // Admin route — requires login + superadmin
  if (isAdminRoute) {
    if (session) return <><AdminApp session={session} /><Toaster position="bottom-right" richColors closeButton /></>
    return <><AuthScreen /><Toaster position="bottom-right" richColors closeButton /></>
  }

  // Authenticated app. The /w/{slug} route is resolved inside WorkspaceProvider
  // (the active workspace is picked from the path); a logged-in user with no
  // path still gets their default workspace, preserving existing behavior.
  if (session) return <><AuthenticatedApp session={session} /><Toaster position="bottom-right" richColors closeButton /><Analytics /><SpeedInsights /></>
  if (showAuth) return <><AuthScreen /><Toaster position="bottom-right" richColors closeButton /><Analytics /><SpeedInsights /></>

  // Visiting a workspace URL while logged out should go straight to sign in.
  if (isWorkspaceRoute) {
    return <><AuthScreen /><Toaster position="bottom-right" richColors closeButton /><Analytics /><SpeedInsights /></>
  }

  return (
    <>
      <LandingPage onGetStarted={() => setShowAuth(true)} />
      <Toaster position="bottom-right" richColors closeButton />
      <Analytics />
      <SpeedInsights />
    </>
  )
}

export default App
