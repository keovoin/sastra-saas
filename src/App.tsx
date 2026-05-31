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
import { AuthScreen } from '@/components/AuthScreen'
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
      <DataProvider>
        <Layout currentPage={currentPage} onNavigate={setCurrentPage} onExport={handleExport}>
          {renderPage()}
        </Layout>
        {printMode && <PrintView mode={printMode} onClose={() => setPrintMode(null)} />}
      </DataProvider>
    </BusinessOSProvider>
  )
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

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

  if (session) return <><AuthenticatedApp session={session} /><Toaster position="bottom-right" richColors closeButton /><Analytics /><SpeedInsights /></>
  if (showAuth) return <><AuthScreen /><Toaster position="bottom-right" richColors closeButton /><Analytics /><SpeedInsights /></>

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
