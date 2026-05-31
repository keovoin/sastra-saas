import React, { useState } from 'react'
import { useBusinessOS } from '@/context/BusinessContext'
import { useTheme } from '@/hooks/useTheme'
import { InviteModal } from '@/components/InviteModal'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, Target, ShieldAlert, FileText, Settings,
  ChevronLeft, ChevronRight, UserPlus, LogOut, User, Bell,
  ChevronDown, Loader2, Printer, FolderOpen, Plus, Moon, Sun, Menu, X,
  Activity, Sparkles, FileCheck, Swords, Calculator, Users2,
  BarChart3, Scale, GitBranch, Pipette, Heart, DollarSign, Presentation, Building2,
  KanbanSquare, ClipboardCheck, UserMinus, ArrowRightLeft, Calendar,
  MessageCircle, CreditCard, UserCircle, Grid3X3,
} from 'lucide-react'
import { toast } from 'sonner'

interface LayoutProps {
  children: React.ReactNode
  currentPage: string
  onNavigate: (page: string) => void
  onExport: () => void
}

interface NavGroup {
  label: string
  items: { id: string; label: string; icon: any }[]
}

const navGroups: NavGroup[] = [
  { label: 'Core', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'project-board', label: 'Project Board', icon: KanbanSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'messaging', label: 'Messaging', icon: MessageCircle },
  ]},
  { label: 'Strategy', items: [
    { id: 'strategy', label: 'Strategy (SWOT)', icon: Target },
    { id: 'risks', label: 'Risk Manager', icon: ShieldAlert },
    { id: 'charters', label: 'Project Charters', icon: FileText },
    { id: 'goals', label: 'Goal Cascade', icon: GitBranch },
    { id: 'decisions', label: 'Decision Log', icon: Scale },
    { id: 'competitors', label: 'Competitors', icon: Swords },
    { id: 'stakeholders', label: 'Stakeholder Map', icon: Users2 },
  ]},
  { label: 'Sales & Finance', items: [
    { id: 'pipeline', label: 'Sales Pipeline', icon: Pipette },
    { id: 'kpis', label: 'KPI Dashboard', icon: BarChart3 },
    { id: 'runway', label: 'Runway Calculator', icon: Calculator },
    { id: 'unit-economics', label: 'Unit Economics', icon: DollarSign },
    { id: 'invoices', label: 'Invoices & Revenue', icon: FileCheck },
  ]},
  { label: 'HR & People', items: [
    { id: 'pulse', label: 'Team Pulse', icon: Heart },
    { id: 'org', label: 'Organization', icon: Building2 },
    { id: 'raci', label: 'RACI Matrix', icon: Grid3X3 },
    { id: 'onboarding', label: 'Onboarding', icon: ClipboardCheck },
    { id: 'offboarding', label: 'Offboarding', icon: UserMinus },
    { id: 'employee-movement', label: 'Movements', icon: ArrowRightLeft },
    { id: 'workload', label: 'Staff Workload', icon: BarChart3 },
  ]},
  { label: 'Intelligence', items: [
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'board-deck', label: 'Board Deck', icon: Presentation },
    { id: 'activity', label: 'Activity Feed', icon: Activity },
  ]},
  { label: 'Account', items: [
    { id: 'user-profile', label: 'My Profile', icon: UserCircle },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]},
]

// Flat list for compatibility
const navItems = navGroups.flatMap(g => g.items)

const breadcrumbMap: Record<string, string> = {
  dashboard: 'Dashboard',
  'project-board': 'Project Board',
  calendar: 'Calendar',
  messaging: 'Messaging',
  strategy: 'Strategy Board',
  risks: 'Risk Manager',
  charters: 'Project Charters',
  goals: 'Goal Cascade',
  decisions: 'Decision Log',
  pipeline: 'Sales Pipeline',
  competitors: 'Competitors',
  stakeholders: 'Stakeholder Map',
  kpis: 'KPI Dashboard',
  runway: 'Runway Calculator',
  'unit-economics': 'Unit Economics',
  invoices: 'Invoices & Revenue',
  pulse: 'Team Pulse',
  org: 'Organization',
  onboarding: 'Onboarding',
  offboarding: 'Offboarding',
  raci: 'RACI Matrix',
  'employee-movement': 'Employee Movements',
  workload: 'Staff Workload',
  'ai-assistant': 'AI Assistant',
  'board-deck': 'Board Deck',
  activity: 'Activity Feed',
  'user-profile': 'My Profile',
  billing: 'Billing & Plans',
  profile: 'Profile',
  settings: 'Settings',
}

export function Layout({ children, currentPage, onNavigate, onExport }: LayoutProps) {
  const { profile, isAdmin, signOut, isSaving, activeProject, projects, setActiveProjectId, createProject } = useBusinessOS()
  const { theme, toggleTheme } = useTheme()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [projectSelectorOpen, setProjectSelectorOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleNewProject = async () => {
    const title = prompt('Enter project name:')
    if (title?.trim()) {
      await createProject(title.trim())
    }
  }

  const handleNavigation = (page: string) => {
    onNavigate(page)
    setMobileMenuOpen(false)
  }

  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'
  const displayName = profile?.full_name || 'User'

  return (
    <div className="flex h-screen overflow-hidden bg-background print:hidden">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:relative inset-y-0 left-0 z-50
        w-64 flex flex-col border-r border-border bg-card
        transition-all duration-200 ease-in-out
      `}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">S</div>
              <span className="text-lg font-bold tracking-tight">Sastra</span>
            </div>
          )}
          {sidebarCollapsed && !mobileMenuOpen && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">S</div>
          )}
          {/* Mobile close button */}
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden rounded-md p-1 text-muted-foreground hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Project Selector */}
        {(!sidebarCollapsed || mobileMenuOpen) && (
          <div className="border-b border-border px-3 py-3">
            <div className="relative">
              <button
                onClick={() => setProjectSelectorOpen(!projectSelectorOpen)}
                className="flex w-full items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{activeProject?.title || 'No project'}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              </button>
              {projectSelectorOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProjectSelectorOpen(false)} />
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-card py-1 shadow-lg">
                    {projects.map((project) => (
                      <button key={project.id} onClick={() => { setActiveProjectId(project.id); setProjectSelectorOpen(false) }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${project.id === activeProject?.id ? 'bg-accent font-medium' : 'hover:bg-accent/50'}`}>
                        <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate">{project.title}</span>
                      </button>
                    ))}
                    {isAdmin && (
                      <button onClick={() => { setProjectSelectorOpen(false); handleNewProject() }}
                        className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50">
                        <Plus className="h-3.5 w-3.5" />New Project
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-3">
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <button key={item.id} onClick={() => handleNavigation(item.id)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'} ${sidebarCollapsed && !mobileMenuOpen ? 'justify-center' : ''}`}
                    title={sidebarCollapsed && !mobileMenuOpen ? item.label : undefined}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {(!sidebarCollapsed || mobileMenuOpen) && <span className="truncate">{item.label}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Collapse Toggle (desktop only) */}
        <div className="hidden lg:block border-t border-border p-2">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          {/* Left: Hamburger + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden rounded-md p-2 text-muted-foreground hover:bg-accent">
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sastra</span>
              <span className="text-muted-foreground/50">/</span>
              {activeProject && (<><span className="text-muted-foreground truncate max-w-[100px]">{activeProject.title}</span><span className="text-muted-foreground/50">/</span></>)}
              <span className="font-medium">{breadcrumbMap[currentPage] || 'Dashboard'}</span>
            </div>
            <span className="sm:hidden font-medium text-sm">{breadcrumbMap[currentPage] || 'Dashboard'}</span>
            {isSaving && (<span className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Saving...</span>)}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {(currentPage === 'risks' || currentPage === 'charters') && (
              <Button variant="outline" size="sm" onClick={onExport} className="hidden sm:flex gap-2">
                <Printer className="h-4 w-4" /><span className="hidden md:inline">Export</span>
              </Button>
            )}

            {isAdmin && (
              <Button size="sm" onClick={() => setInviteModalOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" /><span className="hidden md:inline">Invite</span>
              </Button>
            )}

            {/* Dark mode toggle */}
            <button onClick={toggleTheme} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <div className="relative">
              <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-border bg-card py-1 shadow-lg">
                  <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Notifications</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <Bell className="h-6 w-6 text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">No notifications yet</p>
                    </div>
                  </div>
                  <div className="border-t border-border px-4 py-2">
                    <button className="text-xs text-primary hover:underline w-full text-center">Mark all as read</button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-accent transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-medium text-white">{userInitials}</div>
                <div className="hidden lg:flex items-center gap-1">
                  <span className="text-sm font-medium">{displayName}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-56 rounded-lg border border-border bg-card py-1 shadow-lg">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{profile?.role === 'admin' ? 'Administrator' : 'Viewer'}</p>
                  </div>
                  <button onClick={() => { setProfileOpen(false); onNavigate('settings') }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-accent">
                    <User className="h-4 w-4" />Profile Settings
                  </button>
                  <button onClick={() => { setProfileOpen(false); signOut() }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <LogOut className="h-4 w-4" />Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">
            {!activeProject ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="rounded-full bg-muted p-4 mb-4"><FolderOpen className="h-8 w-8 text-muted-foreground" /></div>
                <h2 className="text-lg font-semibold">No project selected</h2>
                <p className="mt-1 text-sm text-muted-foreground mb-4">Create a project to get started.</p>
                {isAdmin && (<Button onClick={handleNewProject} className="gap-2"><Plus className="h-4 w-4" />Create First Project</Button>)}
              </div>
            ) : children}
          </div>
        </main>
      </div>

      {/* Click outside to close dropdowns */}
      {(profileOpen || notificationsOpen) && (<div className="fixed inset-0 z-40" onClick={() => { setProfileOpen(false); setNotificationsOpen(false) }} />)}

      {/* Invite Modal */}
      <InviteModal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} />
    </div>
  )
}
