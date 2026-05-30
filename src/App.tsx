import React, { useState } from 'react'
import { BusinessOSProvider } from '@/context/BusinessContext'
import { Layout } from '@/components/Layout'
import { PrintView } from '@/components/PrintView'
import { Dashboard } from '@/pages/Dashboard'
import { StrategyBoard } from '@/pages/StrategyBoard'
import { RiskRegister } from '@/pages/RiskRegister'
import { ProjectCharters } from '@/pages/ProjectCharters'
import { Settings } from '@/pages/Settings'
import { Toaster } from 'sonner'

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [printMode, setPrintMode] = useState<'risks' | 'charters' | null>(null)

  const handleExport = () => {
    if (currentPage === 'risks') {
      setPrintMode('risks')
    } else if (currentPage === 'charters') {
      setPrintMode('charters')
    }
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
    <>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage} onExport={handleExport}>
        {renderPage()}
      </Layout>
      {printMode && (
        <PrintView mode={printMode} onClose={() => setPrintMode(null)} />
      )}
      <Toaster position="bottom-right" richColors closeButton />
    </>
  )
}

function App() {
  return (
    <BusinessOSProvider>
      <AppContent />
    </BusinessOSProvider>
  )
}

export default App
