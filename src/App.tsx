import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BusinessOSProvider } from '@/context/BusinessContext'
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
import { AuthScreen } from '@/components/AuthScreen'
import { Toaster } from 'sonner'
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
      case 'strategy': return <StrategyBoard />
      case 'risks': return <RiskRegister />
      case 'charters': return <ProjectCharters />
      case 'activity': return <ActivityFeed />
      case 'ai-assistant': return <AIAssistant />
      case 'profile': return <ProfilePage />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <BusinessOSProvider session={session}>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage} onExport={handleExport}>
        {renderPage()}
      </Layout>
      {printMode && <PrintView mode={printMode} onClose={() => setPrintMode(null)} />}
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

  if (session) return <><AuthenticatedApp session={session} /><Toaster position="bottom-right" richColors closeButton /></>
  if (showAuth) return <><AuthScreen /><Toaster position="bottom-right" richColors closeButton /></>

  return (
    <>
      <LandingPage onGetStarted={() => setShowAuth(true)} />
      <Toaster position="bottom-right" richColors closeButton />
    </>
  )
}

export default App
