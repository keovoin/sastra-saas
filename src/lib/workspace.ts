const MEMBERS_KEY = 'sastra-workspace-members'

export interface WorkspaceMember {
  id: string
  name: string
  email: string
  role: string
}

export function getWorkspaceMembers(): WorkspaceMember[] {
  try { return JSON.parse(localStorage.getItem(MEMBERS_KEY) || '[]') } catch { return [] }
}

export function addWorkspaceMember(member: Omit<WorkspaceMember, 'id'>): void {
  const members = getWorkspaceMembers()
  members.push({ ...member, id: crypto.randomUUID() })
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members))
}

export function removeWorkspaceMember(id: string): void {
  const members = getWorkspaceMembers().filter(m => m.id !== id)
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members))
}

// Initialize with some defaults if empty
export function initDefaultMembers(): void {
  if (getWorkspaceMembers().length === 0) {
    const defaults = [
      { name: 'Sarah Chen', email: 'sarah@company.com', role: 'CTO' },
      { name: 'Marcus Rivera', email: 'marcus@company.com', role: 'Product Manager' },
      { name: 'Emily Watson', email: 'emily@company.com', role: 'Lead Designer' },
      { name: 'James Park', email: 'james@company.com', role: 'Backend Engineer' },
      { name: 'Lisa Thompson', email: 'lisa@company.com', role: 'Marketing Lead' },
      { name: 'Alex Kim', email: 'alex@company.com', role: 'DevOps Engineer' },
    ]
    defaults.forEach(d => addWorkspaceMember(d))
  }
}
