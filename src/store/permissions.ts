// ─── Module-Level RBAC System ─────────────────────────────────────────────────
export type ModulePermission = 'admin' | 'editor' | 'viewer' | 'none'

export type ModuleId =
  | 'dashboard' | 'strategy' | 'risks' | 'charters' | 'okrs' | 'goals'
  | 'competitors' | 'stakeholders' | 'kpis' | 'runway' | 'meetings'
  | 'decisions' | 'ai-assistant' | 'activity' | 'pipeline' | 'invoices'
  | 'unit-economics' | 'pulse' | 'board-deck' | 'org' | 'settings'

export interface ModuleConfig {
  id: ModuleId
  label: string
  description: string
  category: 'strategy' | 'operations' | 'finance' | 'people' | 'intelligence' | 'system'
}

export const ALL_MODULES: ModuleConfig[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Overview KPIs and charts', category: 'intelligence' },
  { id: 'strategy', label: 'Strategy (SWOT)', description: 'Interactive SWOT analysis', category: 'strategy' },
  { id: 'risks', label: 'Risk Manager', description: 'Track and assess risks', category: 'strategy' },
  { id: 'charters', label: 'Project Charters', description: 'Define project scope', category: 'strategy' },
  { id: 'goals', label: 'Goal Cascade', description: 'Vision to tasks hierarchy', category: 'strategy' },
  { id: 'okrs', label: 'OKR Tracker', description: 'Objectives and key results', category: 'strategy' },
  { id: 'decisions', label: 'Decision Log', description: 'Record strategic decisions', category: 'strategy' },
  { id: 'competitors', label: 'Competitor Tracker', description: 'Monitor competition', category: 'operations' },
  { id: 'stakeholders', label: 'Stakeholder Map', description: 'Power/interest mapping', category: 'operations' },
  { id: 'pipeline', label: 'Sales Pipeline', description: 'CRM-lite deal tracking', category: 'operations' },
  { id: 'meetings', label: 'Meeting Notes', description: 'Notes and action items', category: 'operations' },
  { id: 'kpis', label: 'KPI Dashboard', description: 'Custom metric tracking', category: 'finance' },
  { id: 'runway', label: 'Runway Calculator', description: 'Cash burn projections', category: 'finance' },
  { id: 'invoices', label: 'Invoices & Revenue', description: 'Track income and payments', category: 'finance' },
  { id: 'unit-economics', label: 'Unit Economics', description: 'CAC, LTV, payback period', category: 'finance' },
  { id: 'pulse', label: 'Team Pulse', description: 'Employee sentiment survey', category: 'people' },
  { id: 'org', label: 'Organization', description: 'Team structure and roles', category: 'people' },
  { id: 'ai-assistant', label: 'AI Assistant', description: 'AI-powered strategy tools', category: 'intelligence' },
  { id: 'board-deck', label: 'Board Deck', description: 'AI-generated investor updates', category: 'intelligence' },
  { id: 'activity', label: 'Activity Feed', description: 'Real-time event log', category: 'intelligence' },
  { id: 'settings', label: 'Settings', description: 'Workspace configuration', category: 'system' },
]

export type UserModulePermissions = Record<ModuleId, ModulePermission>

export interface OrgMember {
  id: string
  email: string
  name: string
  orgRole: 'owner' | 'admin' | 'member'
  modules: UserModulePermissions
  department: string
  title: string
}

export function getDefaultPermissions(orgRole: 'owner' | 'admin' | 'member'): UserModulePermissions {
  const base = {} as UserModulePermissions
  ALL_MODULES.forEach((m) => {
    if (orgRole === 'owner') base[m.id] = 'admin'
    else if (orgRole === 'admin') base[m.id] = m.category === 'system' ? 'viewer' : 'editor'
    else {
      if (['runway', 'invoices', 'unit-economics', 'org', 'settings'].includes(m.id)) base[m.id] = 'none'
      else base[m.id] = 'viewer'
    }
  })
  return base
}

export function canAccess(p: ModulePermission): boolean { return p !== 'none' }
export function canEdit(p: ModulePermission): boolean { return p === 'admin' || p === 'editor' }
export function canAdmin(p: ModulePermission): boolean { return p === 'admin' }

const PERMS_KEY = 'sastra-user-perms'
export function getStoredPermissions(): UserModulePermissions {
  try { const r = localStorage.getItem(PERMS_KEY); if (r) return JSON.parse(r) } catch {}
  return getDefaultPermissions('owner')
}
export function setStoredPermissions(p: UserModulePermissions) { localStorage.setItem(PERMS_KEY, JSON.stringify(p)) }
