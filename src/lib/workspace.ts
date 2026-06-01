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



// ─── Workspace Governance (admin-defined) ────────────────────────────────────
// Departments, position levels, and which modules each department can access.
// Admin-controlled. Members pick from these lists (no free text).

const DEPARTMENTS_KEY = 'sastra-departments'
const POSITIONS_KEY = 'sastra-positions'
const DEPT_ACCESS_KEY = 'sastra-dept-access'
const DEPT_CHANGE_REQ_KEY = 'sastra-dept-change-requests'

export interface Position {
  id: string
  title: string
  level: number // 1 = junior ... 5 = executive
}

export interface DeptChangeRequest {
  id: string
  memberName: string
  fromDept: string
  toDept: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

// All module ids that can be gated per department
export const GOVERNED_MODULES = [
  'dashboard', 'project-board', 'calendar', 'messaging', 'strategy', 'risks',
  'charters', 'goals', 'decisions', 'pipeline', 'competitors', 'stakeholders',
  'kpis', 'runway', 'unit-economics', 'invoices', 'pulse', 'org', 'raci',
  'onboarding', 'offboarding', 'employee-movement', 'workload', 'help-desk',
  'ai-assistant', 'board-deck', 'activity', 'user-profile', 'billing',
] as const

export function getDepartments(): string[] {
  try {
    const r = localStorage.getItem(DEPARTMENTS_KEY)
    if (r) return JSON.parse(r)
  } catch {}
  return ['Engineering', 'Product', 'Design', 'Marketing', 'Finance', 'HR', 'Operations', 'General']
}
export function setDepartments(depts: string[]): void {
  localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(depts))
}

export function getPositions(): Position[] {
  try {
    const r = localStorage.getItem(POSITIONS_KEY)
    if (r) return JSON.parse(r)
  } catch {}
  return [
    { id: '1', title: 'Intern', level: 1 },
    { id: '2', title: 'Associate', level: 2 },
    { id: '3', title: 'Senior', level: 3 },
    { id: '4', title: 'Manager', level: 4 },
    { id: '5', title: 'Director / Executive', level: 5 },
  ]
}
export function setPositions(positions: Position[]): void {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions))
}

// Department -> list of allowed module ids. Empty/missing = all modules allowed.
export function getDeptAccess(): Record<string, string[]> {
  try {
    const r = localStorage.getItem(DEPT_ACCESS_KEY)
    if (r) return JSON.parse(r)
  } catch {}
  return {}
}
export function setDeptAccess(access: Record<string, string[]>): void {
  localStorage.setItem(DEPT_ACCESS_KEY, JSON.stringify(access))
}

// Returns true if a department can access a module.
// If no rule is set for the department, default allow (full access).
export function deptCanAccess(department: string, moduleId: string): boolean {
  const access = getDeptAccess()
  const allowed = access[department]
  if (!allowed || allowed.length === 0) return true
  return allowed.includes(moduleId)
}

// ─── Department Change Requests ──────────────────────────────────────────────
export function getDeptChangeRequests(): DeptChangeRequest[] {
  try { return JSON.parse(localStorage.getItem(DEPT_CHANGE_REQ_KEY) || '[]') } catch { return [] }
}
export function addDeptChangeRequest(req: Omit<DeptChangeRequest, 'id' | 'status' | 'createdAt'>): void {
  const list = getDeptChangeRequests()
  list.unshift({ ...req, id: crypto.randomUUID(), status: 'pending', createdAt: new Date().toISOString() })
  localStorage.setItem(DEPT_CHANGE_REQ_KEY, JSON.stringify(list))
}
export function resolveDeptChangeRequest(id: string, status: 'approved' | 'rejected'): void {
  const list = getDeptChangeRequests().map(r => r.id === id ? { ...r, status } : r)
  localStorage.setItem(DEPT_CHANGE_REQ_KEY, JSON.stringify(list))
}

// ─── Current user's workspace profile (department/position) ──────────────────
const USER_WS_PROFILE_KEY = 'sastra-user-ws-profile'
export interface UserWorkspaceProfile {
  nickname: string
  positionId: string
  department: string
  departmentLocked: boolean // true after first set; change requires admin approval
}
export function getUserWorkspaceProfile(): UserWorkspaceProfile {
  try {
    const r = localStorage.getItem(USER_WS_PROFILE_KEY)
    if (r) return JSON.parse(r)
  } catch {}
  return { nickname: '', positionId: '', department: '', departmentLocked: false }
}
export function setUserWorkspaceProfile(p: UserWorkspaceProfile): void {
  localStorage.setItem(USER_WS_PROFILE_KEY, JSON.stringify(p))
}
