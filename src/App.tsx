import React, { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { StrategyBoard } from '@/pages/StrategyBoard'
import { RiskRegister } from '@/pages/RiskRegister'
import { ProjectCharters } from '@/pages/ProjectCharters'
import { Settings } from '@/pages/Settings'
import { Toaster } from 'sonner'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

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
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
      <Toaster position="bottom-right" richColors closeButton />
    </>
  )
}

export default App
