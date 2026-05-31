// ─── Workspace Members Management ────────────────────────────────────────────
// Members are stored in localStorage for now. In production, this should
// be backed by Supabase (workspace_members table with RLS).

const MEMBERS_KEY = 'sastra-workspace-members'
const WORKSPACE_NAME_KEY = 'sastra-workspace-name'
const WORKSPACE_LOGO_KEY = 'sastra-workspace-logo'

export interface WorkspaceMember {
  id: string
  name: string
  email: string
  role: string
  department: string
}

export function getWorkspaceMembers(): WorkspaceMember[] {
  try { return JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]') } catch { return [] }
}

export function addWorkspaceMember(member: Omit<WorkspaceMember, 'id'>): WorkspaceMember {
  const members = getWorkspaceMembers()
  const newMember = { ...member, id: crypto.randomUUID() }
  members.push(newMember)
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members))
  return newMember
}

export function removeWorkspaceMember(id: string): void {
  const members = getWorkspaceMembers().filter(m => m.id !== id)
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members))
}

export function updateWorkspaceMember(id: string, updates: Partial<WorkspaceMember>): void {
  const members = getWorkspaceMembers().map(m => m.id === id ? { ...m, ...updates } : m)
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members))
}

// Initialize with defaults if empty (demo data for first-time users)
export function initDefaultMembers(): void {
  if (getWorkspaceMembers().length === 0) {
    const defaults: Omit<WorkspaceMember, 'id'>[] = [
      { name: 'Sarah Chen', email: 'sarah@company.com', role: 'CTO', department: 'Engineering' },
      { name: 'Marcus Rivera', email: 'marcus@company.com', role: 'Product Manager', department: 'Product' },
      { name: 'Emily Watson', email: 'emily@company.com', role: 'Lead Designer', department: 'Design' },
      { name: 'James Park', email: 'james@company.com', role: 'Backend Engineer', department: 'Engineering' },
      { name: 'Lisa Thompson', email: 'lisa@company.com', role: 'Marketing Lead', department: 'Marketing' },
      { name: 'Alex Kim', email: 'alex@company.com', role: 'DevOps Engineer', department: 'Engineering' },
    ]
    defaults.forEach(d => addWorkspaceMember(d))
  }
}

// ─── Workspace Branding ──────────────────────────────────────────────────────
export function getWorkspaceName(): string {
  try { return localStorage.getItem(WORKSPACE_NAME_KEY) || 'Sastra' } catch { return 'Sastra' }
}

export function getWorkspaceLogo(): string {
  try { return localStorage.getItem(WORKSPACE_LOGO_KEY) || 'S' } catch { return 'S' }
}

export function setWorkspaceBranding(name: string, logo: string): void {
  localStorage.setItem(WORKSPACE_NAME_KEY, name)
  localStorage.setItem(WORKSPACE_LOGO_KEY, logo)
}
