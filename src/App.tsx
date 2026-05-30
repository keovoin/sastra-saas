import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BusinessOSProvider } from '@/context/BusinessContext'
import { Layout } from '@/components/Layout'
import { PrintView } from '@/components/PrintView'
import { Dashboard } from '@/pages/Dashboard'
import { StrategyBoard } from '@/pages/StrategyBoard'
import { RiskRegister } from '@/pages/RiskRegister'
import { ProjectCharters } from '@/pages/ProjectCharters'
import { Settings } from '@/pages/Settings'
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
      case 'dashboard':
        return <Dashboard />
      case 'strategy':
        return <StrategyBoard />
      case 'risks':
        return <RiskRegister />
      case 'charters':
        return <ProjectCharters />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-bold animate-pulse">
            S
          </div>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {session ? <AuthenticatedApp session={session} /> : <AuthScreen />}
      <Toaster position="bottom-right" richColors closeButton />
    </>
  )
}

export default App
