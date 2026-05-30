import React, { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Target,
  ShieldAlert,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  LogOut,
  User,
  Bell,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'

interface LayoutProps {
  children: React.ReactNode
  currentPage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'strategy', label: 'Strategy (SWOT)', icon: Target },
  { id: 'risks', label: 'Risk Manager', icon: ShieldAlert },
  { id: 'charters', label: 'Project Charters', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const breadcrumbMap: Record<string, string> = {
  dashboard: 'Dashboard',
  strategy: 'Strategy Board',
  risks: 'Risk Manager',
  charters: 'Project Charters',
  settings: 'Settings',
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { sidebarCollapsed, toggleSidebar } = useStore()
  const [profileOpen, setProfileOpen] = useState(false)

  const handleInvite = () => {
    toast.success('Invitation sent to team member', {
      description: 'They will receive an email with access instructions.',
    })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } flex flex-col border-r border-slate-200 bg-white transition-all duration-200 ease-in-out`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-slate-200 px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-bold">
                S
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">Sastra</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-bold">
              S
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-slate-200 p-2">
          <button
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Sastra</span>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-700">{breadcrumbMap[currentPage] || 'Dashboard'}</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleInvite} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>

            <button className="relative rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-md p-1.5 hover:bg-slate-100 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-medium text-white">
                  JW
                </div>
                {!sidebarCollapsed && (
                  <div className="hidden sm:flex items-center gap-1">
                    <span className="text-sm font-medium text-slate-700">Jennifer W.</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </div>
                )}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">Jennifer Walsh</p>
                    <p className="text-xs text-slate-500">jennifer@sastra.io</p>
                  </div>
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                    <User className="h-4 w-4" />
                    Profile Settings
                  </button>
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-6">{children}</div>
        </main>
      </div>

      {/* Click outside to close profile */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}
    </div>
  )
}
