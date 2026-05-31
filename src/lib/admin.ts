import { supabase } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────
export type Plan = 'free' | 'pro' | 'enterprise'
export type AccountStatus = 'active' | 'suspended' | 'banned'

export interface AdminUser {
  id: string
  full_name: string
  email: string
  role: string
  plan: Plan
  account_status: AccountStatus
  is_superadmin: boolean
  created_at: string
  last_active_at: string | null
}

export interface AdminWorkspace {
  id: string
  title: string
  description: string
  owner_id: string
  plan: Plan
  created_at: string
  updated_at: string
}

export interface BillingEvent {
  id: string
  created_at: string
  user_id: string | null
  event_type: string
  plan: string
  amount: number
  currency: string
}

export interface PlatformStats {
  totalUsers: number
  totalWorkspaces: number
  activeToday: number
  activeThisWeek: number
  planCounts: Record<Plan, number>
  mrr: number
  signupsThisWeek: number
}


// ─── Superadmin Check ────────────────────────────────────────────────────────
export async function checkIsSuperadmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', userId)
    .single()
  if (error || !data) return false
  return data.is_superadmin === true
}

// ─── Fetch Users ─────────────────────────────────────────────────────────────
export async function fetchAllUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as AdminUser[]
}

// ─── Fetch Workspaces ────────────────────────────────────────────────────────
export async function fetchAllWorkspaces(): Promise<AdminWorkspace[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as AdminWorkspace[]
}

// ─── Fetch Billing Events ────────────────────────────────────────────────────
export async function fetchBillingEvents(): Promise<BillingEvent[]> {
  const { data, error } = await supabase
    .from('billing_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error || !data) return []
  return data as BillingEvent[]
}

// ─── Update User Plan ────────────────────────────────────────────────────────
export async function updateUserPlan(userId: string, plan: Plan): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({ plan }).eq('id', userId)
  if (!error) await logAdminAction('update_user_plan', 'user', userId, { plan })
  return !error
}

// ─── Update User Status ──────────────────────────────────────────────────────
export async function updateUserStatus(userId: string, status: AccountStatus): Promise<boolean> {
  const { error } = await supabase.from('profiles').update({ account_status: status }).eq('id', userId)
  if (!error) await logAdminAction('update_user_status', 'user', userId, { status })
  return !error
}

// ─── Update Workspace Plan ───────────────────────────────────────────────────
export async function updateWorkspacePlan(workspaceId: string, plan: Plan): Promise<boolean> {
  const { error } = await supabase.from('projects').update({ plan }).eq('id', workspaceId)
  if (!error) await logAdminAction('update_workspace_plan', 'workspace', workspaceId, { plan })
  return !error
}

// ─── Audit Logging ───────────────────────────────────────────────────────────
async function logAdminAction(action: string, targetType: string, targetId: string, details: Record<string, unknown>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('admin_audit_log').insert({
    admin_id: user.id,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  })
}


// ─── Platform Stats (Dashboard) ──────────────────────────────────────────────
const PLAN_PRICES: Record<Plan, number> = { free: 0, pro: 29, enterprise: 99 }

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const [users, workspaces] = await Promise.all([
    fetchAllUsers(),
    fetchAllWorkspaces(),
  ])

  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const weekMs = 7 * dayMs

  const activeToday = users.filter(u => u.last_active_at && now - new Date(u.last_active_at).getTime() < dayMs).length
  const activeThisWeek = users.filter(u => u.last_active_at && now - new Date(u.last_active_at).getTime() < weekMs).length
  const signupsThisWeek = users.filter(u => now - new Date(u.created_at).getTime() < weekMs).length

  const planCounts: Record<Plan, number> = { free: 0, pro: 0, enterprise: 0 }
  let mrr = 0
  users.forEach(u => {
    const plan = (u.plan || 'free') as Plan
    planCounts[plan] = (planCounts[plan] || 0) + 1
    mrr += PLAN_PRICES[plan] || 0
  })

  return {
    totalUsers: users.length,
    totalWorkspaces: workspaces.length,
    activeToday,
    activeThisWeek,
    planCounts,
    mrr,
    signupsThisWeek,
  }
}

// ─── Signup Trend (last 8 weeks) ─────────────────────────────────────────────
export async function fetchSignupTrend(): Promise<{ week: string; signups: number }[]> {
  const users = await fetchAllUsers()
  const weeks: { week: string; signups: number }[] = []
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000

  for (let i = 7; i >= 0; i--) {
    const start = now - (i + 1) * weekMs
    const end = now - i * weekMs
    const count = users.filter(u => {
      const t = new Date(u.created_at).getTime()
      return t >= start && t < end
    }).length
    weeks.push({ week: `W${8 - i}`, signups: count })
  }
  return weeks
}
