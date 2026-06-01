import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { slugify } from '@/lib/workspace'

// ─── Types ───────────────────────────────────────────────────────────────────

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
}

export interface CurrentWorkspace {
  id: string
  name: string
  slug: string
  role: WorkspaceRole
}

export interface WorkspaceMemberRow {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  department: string
  position: string
  status: string
  created_at: string
}

export interface WorkspaceInvitationRow {
  id: string
  workspace_id: string
  email: string
  role: string
  department: string
  token: string | null
  status: 'pending' | 'accepted' | 'expired'
  invited_by: string | null
  expires_at: string | null
  created_at: string
}

export interface InviteMemberArgs {
  email: string
  role?: string
  department?: string
}

export interface InviteMemberResult {
  success: boolean
  emailSent?: boolean
  inviteLink?: string
  warning?: string
  error?: string
}

interface WorkspaceContextValue {
  currentWorkspace: CurrentWorkspace | null
  myWorkspaces: CurrentWorkspace[]
  isWorkspaceAdmin: boolean
  members: WorkspaceMemberRow[]
  invitations: WorkspaceInvitationRow[]
  isLoading: boolean
  /** True when the workspace tables are missing (migration not run yet). */
  tablesMissing: boolean
  createWorkspace: (name: string) => Promise<CurrentWorkspace | null>
  inviteMember: (args: InviteMemberArgs) => Promise<InviteMemberResult>
  refresh: () => Promise<void>
}

// ─── Context ─────────────────────────────────────────────────────────────────

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider')
  return ctx
}

/** Safe variant — returns null instead of throwing if no provider is mounted.
 *  Useful for components (e.g. AuthScreen) that render before the provider. */
export function useWorkspaceOptional() {
  return useContext(WorkspaceContext)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Reads the workspace slug from a /w/{slug} path, if present. */
export function getWorkspaceSlugFromPath(): string | null {
  if (typeof window === 'undefined') return null
  const match = window.location.pathname.match(/^\/w\/([^/]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

// A Postgres "relation does not exist" error (migration not run yet).
function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === '42P01') return true
  const msg = (error.message || '').toLowerCase()
  return msg.includes('does not exist') || msg.includes('not find the table') || msg.includes('schema cache')
}

// Handoff key set by AuthScreen during signup so we can name the auto-created
// workspace even when email confirmation defers the session.
const PENDING_WORKSPACE_KEY = 'sastra-pending-workspace'

// ─── Provider ────────────────────────────────────────────────────────────────

interface ProviderProps {
  children: React.ReactNode
  session: Session
}

export function WorkspaceProvider({ children, session }: ProviderProps) {
  const userId = session.user.id

  const [myWorkspaces, setMyWorkspaces] = useState<CurrentWorkspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<CurrentWorkspace | null>(null)
  const [members, setMembers] = useState<WorkspaceMemberRow[]>([])
  const [invitations, setInvitations] = useState<WorkspaceInvitationRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tablesMissing, setTablesMissing] = useState(false)

  const currentWsId = currentWorkspace?.id ?? null
  const isWorkspaceAdmin = currentWorkspace?.role === 'owner' || currentWorkspace?.role === 'admin'

  // Keep a ref to avoid stale closures inside realtime callbacks.
  const currentWsIdRef = useRef<string | null>(null)
  currentWsIdRef.current = currentWsId

  // ─── Resolve the list of workspaces this user belongs to ───────────────────
  const loadMyWorkspaces = useCallback(async (): Promise<CurrentWorkspace[]> => {
    try {
      // workspace_members joined to workspaces.
      const { data, error } = await supabase
        .from('workspace_members')
        .select('role, workspaces:workspace_id ( id, name, slug, owner_id )')
        .eq('user_id', userId)

      if (error) {
        if (isMissingTableError(error)) setTablesMissing(true)
        return []
      }

      const list: CurrentWorkspace[] = (data || [])
        .map((row: any) => {
          const ws = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces
          if (!ws) return null
          return {
            id: ws.id as string,
            name: (ws.name as string) || 'Workspace',
            slug: ws.slug as string,
            role: (row.role as WorkspaceRole) || 'member',
          }
        })
        .filter((w): w is CurrentWorkspace => w !== null)

      return list
    } catch {
      return []
    }
  }, [userId])

  // ─── Fetch members + invitations for the active workspace ──────────────────
  const loadMembers = useCallback(async (wsId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: true })
      if (error) {
        if (isMissingTableError(error)) setTablesMissing(true)
        setMembers([])
        return
      }
      setMembers((data || []) as WorkspaceMemberRow[])
    } catch {
      setMembers([])
    }
  }, [])

  const loadInvitations = useCallback(async (wsId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: false })
      if (error) {
        // Non-owners aren't allowed to read invitations — that's fine, just empty.
        if (isMissingTableError(error)) setTablesMissing(true)
        setInvitations([])
        return
      }
      setInvitations((data || []) as WorkspaceInvitationRow[])
    } catch {
      setInvitations([])
    }
  }, [])

  // ─── Pick the active workspace (path-based or first membership) ─────────────
  const resolveCurrent = useCallback(
    (list: CurrentWorkspace[]): CurrentWorkspace | null => {
      if (list.length === 0) return null
      const slug = getWorkspaceSlugFromPath()
      if (slug) {
        const matched = list.find((w) => w.slug === slug)
        if (matched) return matched
      }
      return list[0]
    },
    []
  )

  const refresh = useCallback(async () => {
    setIsLoading(true)
    const list = await loadMyWorkspaces()
    setMyWorkspaces(list)
    const active = resolveCurrent(list)
    setCurrentWorkspace(active)
    if (active) {
      await Promise.all([loadMembers(active.id), loadInvitations(active.id)])
    } else {
      setMembers([])
      setInvitations([])
    }
    setIsLoading(false)
  }, [loadMyWorkspaces, resolveCurrent, loadMembers, loadInvitations])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // ─── Realtime: refresh members/invites for the active workspace ────────────
  useEffect(() => {
    if (!currentWsId) return
    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel(`workspace-${currentWsId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'workspace_members', filter: `workspace_id=eq.${currentWsId}` },
          () => { loadMembers(currentWsId) }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'workspace_invitations', filter: `workspace_id=eq.${currentWsId}` },
          () => { loadInvitations(currentWsId) }
        )
        .subscribe()
    } catch {
      // Realtime not available (tables missing) — ignore.
    }
    return () => {
      if (channel) {
        try { supabase.removeChannel(channel) } catch { /* noop */ }
      }
    }
  }, [currentWsId, loadMembers, loadInvitations])

  // ─── Create a new workspace (caller becomes owner) ─────────────────────────
  const createWorkspace = useCallback(
    async (name: string): Promise<CurrentWorkspace | null> => {
      const trimmed = (name || '').trim()
      if (!trimmed) return null

      try {
        // Generate a unique-ish slug; append a short random suffix on collision.
        let slug = slugify(trimmed)
        const baseSlug = slug

        const insertWorkspace = async (s: string) =>
          supabase
            .from('workspaces')
            .insert({ name: trimmed, slug: s, owner_id: userId })
            .select('id, name, slug, owner_id, created_at')
            .single()

        let { data, error } = await insertWorkspace(slug)

        // Retry once with a random suffix if the slug is taken.
        if (error && (error.code === '23505' || (error.message || '').includes('duplicate'))) {
          slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
          ;({ data, error } = await insertWorkspace(slug))
        }

        if (error || !data) {
          if (isMissingTableError(error)) setTablesMissing(true)
          return null
        }

        const ws = data as Workspace

        // Add the creator as an owner member. This MUST succeed — otherwise the
        // workspace has no membership row and becomes invisible to the
        // membership-based listing (and would re-trigger auto-provisioning).
        const { error: memberError } = await supabase
          .from('workspace_members')
          .insert({ workspace_id: ws.id, user_id: userId, role: 'owner', status: 'active' })

        if (memberError) {
          // Roll back the orphaned workspace so it doesn't linger invisibly.
          try { await supabase.from('workspaces').delete().eq('id', ws.id) } catch { /* noop */ }
          return null
        }

        const created: CurrentWorkspace = {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          role: 'owner',
        }
        setMyWorkspaces((prev) => [...prev.filter((w) => w.id !== created.id), created])
        setCurrentWorkspace(created)
        await Promise.all([loadMembers(created.id), loadInvitations(created.id)])
        return created
      } catch {
        return null
      }
    },
    [userId, loadMembers, loadInvitations]
  )

  // ─── Invite a member via the edge function ─────────────────────────────────
  const inviteMember = useCallback(
    async ({ email, role = 'member', department = '' }: InviteMemberArgs): Promise<InviteMemberResult> => {
      if (!currentWorkspace) {
        return { success: false, error: 'No active workspace.' }
      }
      try {
        const { data: { session: current } } = await supabase.auth.getSession()
        const accessToken = current?.access_token || ''

        const res = await fetch('/api/invite-member', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email,
            role,
            department,
            workspaceId: currentWorkspace.id,
            workspaceSlug: currentWorkspace.slug,
            inviterName: session.user.email || '',
          }),
        })

        let body: any = {}
        try { body = await res.json() } catch { /* non-JSON response */ }

        if (!res.ok || body?.error) {
          return {
            success: false,
            error: body?.error || `Invite failed (HTTP ${res.status}).`,
            inviteLink: body?.inviteLink,
          }
        }

        // Refresh invitation list so the new pending invite shows up.
        loadInvitations(currentWorkspace.id)

        return {
          success: true,
          emailSent: body?.emailSent !== false,
          inviteLink: body?.inviteLink,
          warning: body?.warning,
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Network error'
        return { success: false, error: message }
      }
    },
    [currentWorkspace, session.user.email, loadInvitations]
  )

  // ─── Auto-provision a personal workspace if the user has none ──────────────
  // New signups (and confirmed-email signups) land here with zero memberships.
  // Runs at most once per mount and only when the tables actually exist.
  const ensuredRef = useRef(false)
  useEffect(() => {
    if (isLoading || tablesMissing || ensuredRef.current) return
    if (myWorkspaces.length > 0) return
    ensuredRef.current = true
    let pending = ''
    try { pending = localStorage.getItem(PENDING_WORKSPACE_KEY) || '' } catch { /* noop */ }
    // Fall back to the name captured in signup metadata (survives a different
    // browser confirming the email), then to an email-derived default.
    const meta = (session.user.user_metadata || {}) as Record<string, unknown>
    const metaName = typeof meta.workspace_name === 'string' ? meta.workspace_name : ''
    const emailPrefix = (session.user.email || 'My').split('@')[0]
    const name = pending || metaName || `${emailPrefix}'s Workspace`
    createWorkspace(name)
      .then((ws) => {
        // If provisioning failed, allow a later refresh to retry rather than
        // leaving the user permanently without a workspace.
        if (!ws) ensuredRef.current = false
      })
      .finally(() => {
        try { localStorage.removeItem(PENDING_WORKSPACE_KEY) } catch { /* noop */ }
      })
  }, [isLoading, tablesMissing, myWorkspaces, createWorkspace, session.user.email, session.user.user_metadata])

  const value: WorkspaceContextValue = {
    currentWorkspace,
    myWorkspaces,
    isWorkspaceAdmin,
    members,
    invitations,
    isLoading,
    tablesMissing,
    createWorkspace,
    inviteMember,
    refresh,
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
