import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, RealtimeChannel } from '@supabase/supabase-js'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Priority = 'Low' | 'Medium' | 'High'
export type SwotType = 'strength' | 'weakness' | 'opportunity' | 'threat'
export type RiskStatus = 'Active' | 'Mitigated' | 'Watch'
export type UserRole = 'admin' | 'viewer'

export interface Profile {
  id: string
  full_name: string
  avatar_url: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  created_at: string
  updated_at: string
  title: string
  description: string
  owner_id: string
}

export interface Risk {
  id: string
  created_at: string
  updated_at: string
  project_id: string
  description: string
  probability: number
  impact: number
  severity: number
  owner_name: string
  status: RiskStatus
}

export interface SwotItem {
  id: string
  created_at: string
  updated_at: string
  project_id: string
  type: SwotType
  content: string
  priority: Priority
}

export interface Charter {
  id: string
  created_at: string
  updated_at: string
  project_id: string
  name: string
  sponsor: string
  start_date: string | null
  in_scope: string[]
  out_of_scope: string[]
  team_members: string[]
}

// ─── Context Value Interface ─────────────────────────────────────────────────

interface BusinessOSContextValue {
  session: Session | null
  profile: Profile | null
  isAdmin: boolean
  signOut: () => Promise<void>
  activeProject: Project | null
  projects: Project[]
  setActiveProjectId: (id: string) => void
  createProject: (title: string, description?: string) => Promise<void>
  isLoading: boolean
  isSaving: boolean
  swotItems: SwotItem[]
  addSwotItem: (item: { type: SwotType; content: string; priority?: Priority }) => Promise<void>
  updateSwotItem: (id: string, updates: Partial<SwotItem>) => Promise<void>
  deleteSwotItem: (id: string) => Promise<void>
  risks: Risk[]
  addRisk: (risk: { description: string; probability?: number; impact?: number; owner_name?: string; status?: RiskStatus }) => Promise<void>
  updateRisk: (id: string, updates: Partial<Risk>) => Promise<void>
  deleteRisk: (id: string) => Promise<void>
  charters: Charter[]
  addCharter: (charter: { name: string; sponsor?: string; start_date?: string | null; in_scope?: string[]; out_of_scope?: string[]; team_members?: string[] }) => Promise<void>
  updateCharter: (id: string, updates: Partial<Charter>) => Promise<void>
  deleteCharter: (id: string) => Promise<void>
}

// ─── Context ─────────────────────────────────────────────────────────────────

const BusinessOSContext = createContext<BusinessOSContextValue | null>(null)

export function useBusinessOS() {
  const ctx = useContext(BusinessOSContext)
  if (!ctx) throw new Error('useBusinessOS must be used within a BusinessOSProvider')
  return ctx
}

// ─── Provider ────────────────────────────────────────────────────────────────

interface ProviderProps {
  children: React.ReactNode
  session: Session
}

export function BusinessOSProvider({ children, session }: ProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [swotItems, setSwotItems] = useState<SwotItem[]>([])
  const [risks, setRisks] = useState<Risk[]>([])
  const [charters, setCharters] = useState<Charter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const channelRef = useRef<RealtimeChannel | null>(null)

  const userId = session.user.id
  const isAdmin = profile?.role === 'admin'
  const activeProject = projects.find((p) => p.id === activeProjectId) || null

  const withSaving = useCallback(async (fn: () => Promise<void>) => {
    setIsSaving(true)
    try { await fn() } finally { setTimeout(() => setIsSaving(false), 300) }
  }, [])

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (!error && data) setProfile(data as Profile)
  }, [userId])

  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase.from('projects').select('*').eq('owner_id', userId).order('created_at', { ascending: false })
    if (!error && data) {
      const typed = data as Project[]
      setProjects(typed)
      if (typed.length > 0 && !activeProjectId) setActiveProjectId(typed[0].id)
    }
  }, [userId, activeProjectId])

  const fetchProjectData = useCallback(async (projectId: string) => {
    const [risksRes, swotRes, chartersRes] = await Promise.all([
      supabase.from('risks').select('*').eq('project_id', projectId).order('severity', { ascending: false }),
      supabase.from('swot_items').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
      supabase.from('charters').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    ])
    if (risksRes.data) setRisks(risksRes.data as Risk[])
    if (swotRes.data) setSwotItems(swotRes.data as SwotItem[])
    if (chartersRes.data) setCharters(chartersRes.data as Charter[])
  }, [])

  // ─── Initial Load ──────────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true
    async function init() {
      setIsLoading(true)
      await fetchProfile()
      await fetchProjects()
      if (mounted) setIsLoading(false)
    }
    init()
    return () => { mounted = false }
  }, [fetchProfile, fetchProjects])

  useEffect(() => {
    if (activeProjectId) fetchProjectData(activeProjectId)
  }, [activeProjectId, fetchProjectData])

  // ─── Real-Time ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeProjectId) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`project-${activeProjectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'risks', filter: `project_id=eq.${activeProjectId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRisks((prev) => { if (prev.some((r) => r.id === (payload.new as Risk).id)) return prev; return [...prev, payload.new as Risk].sort((a, b) => b.severity - a.severity) })
        } else if (payload.eventType === 'UPDATE') {
          setRisks((prev) => prev.map((r) => (r.id === (payload.new as Risk).id ? (payload.new as Risk) : r)).sort((a, b) => b.severity - a.severity))
        } else if (payload.eventType === 'DELETE') {
          setRisks((prev) => prev.filter((r) => r.id !== (payload.old as { id: string }).id))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'swot_items', filter: `project_id=eq.${activeProjectId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSwotItems((prev) => { if (prev.some((s) => s.id === (payload.new as SwotItem).id)) return prev; return [...prev, payload.new as SwotItem] })
        } else if (payload.eventType === 'UPDATE') {
          setSwotItems((prev) => prev.map((s) => (s.id === (payload.new as SwotItem).id ? (payload.new as SwotItem) : s)))
        } else if (payload.eventType === 'DELETE') {
          setSwotItems((prev) => prev.filter((s) => s.id !== (payload.old as { id: string }).id))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'charters', filter: `project_id=eq.${activeProjectId}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCharters((prev) => { if (prev.some((c) => c.id === (payload.new as Charter).id)) return prev; return [payload.new as Charter, ...prev] })
        } else if (payload.eventType === 'UPDATE') {
          setCharters((prev) => prev.map((c) => (c.id === (payload.new as Charter).id ? (payload.new as Charter) : c)))
        } else if (payload.eventType === 'DELETE') {
          setCharters((prev) => prev.filter((c) => c.id !== (payload.old as { id: string }).id))
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [activeProjectId])

  // ─── Auth ──────────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => { await supabase.auth.signOut() }, [])

  // ─── Project CRUD ──────────────────────────────────────────────────────────

  const createProject = useCallback(async (title: string, description?: string) => {
    await withSaving(async () => {
      const { data, error } = await supabase.from('projects').insert({ title, description: description || '', owner_id: userId }).select().single()
      if (error) { toast.error('Failed to create project', { description: error.message }); return }
      const project = data as Project
      setProjects((prev) => [project, ...prev])
      setActiveProjectId(project.id)
      toast.success('Project created', { description: title })
    })
  }, [userId, withSaving])

  // ─── SWOT CRUD ─────────────────────────────────────────────────────────────

  const addSwotItem = useCallback(async (item: { type: SwotType; content: string; priority?: Priority }) => {
    if (!activeProjectId) return
    const tempId = crypto.randomUUID()
    const optimistic: SwotItem = { id: tempId, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), project_id: activeProjectId, type: item.type, content: item.content, priority: item.priority || 'Medium' }
    setSwotItems((prev) => [...prev, optimistic])
    await withSaving(async () => {
      const { data, error } = await supabase.from('swot_items').insert({ project_id: activeProjectId, type: item.type, content: item.content, priority: item.priority || 'Medium' }).select().single()
      if (error) { setSwotItems((prev) => prev.filter((s) => s.id !== tempId)); toast.error('Failed to add item', { description: error.message }); return }
      setSwotItems((prev) => prev.map((s) => (s.id === tempId ? (data as SwotItem) : s)))
      toast.success('Item added to Strategy Board')
    })
  }, [activeProjectId, withSaving])

  const updateSwotItem = useCallback(async (id: string, updates: Partial<SwotItem>) => {
    const previous = swotItems.find((s) => s.id === id)
    if (!previous) return
    setSwotItems((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)))
    await withSaving(async () => {
      const { error } = await supabase.from('swot_items').update(updates).eq('id', id)
      if (error) { setSwotItems((prev) => prev.map((s) => (s.id === id ? previous : s))); toast.error('Failed to update', { description: error.message }); return }
      toast.success('Item updated')
    })
  }, [swotItems, withSaving])

  const deleteSwotItem = useCallback(async (id: string) => {
    const previous = swotItems.find((s) => s.id === id)
    setSwotItems((prev) => prev.filter((s) => s.id !== id))
    await withSaving(async () => {
      const { error } = await supabase.from('swot_items').delete().eq('id', id)
      if (error) { if (previous) setSwotItems((prev) => [...prev, previous]); toast.error('Failed to delete', { description: error.message }); return }
      toast.success('Item removed')
    })
  }, [swotItems, withSaving])

  // ─── Risk CRUD ─────────────────────────────────────────────────────────────

  const addRisk = useCallback(async (risk: { description: string; probability?: number; impact?: number; owner_name?: string; status?: RiskStatus }) => {
    if (!activeProjectId) return
    const prob = risk.probability || 3
    const imp = risk.impact || 3
    const tempId = crypto.randomUUID()
    const optimistic: Risk = { id: tempId, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), project_id: activeProjectId, description: risk.description, probability: prob, impact: imp, severity: prob * imp, owner_name: risk.owner_name || '', status: risk.status || 'Active' }
    setRisks((prev) => [...prev, optimistic].sort((a, b) => b.severity - a.severity))
    await withSaving(async () => {
      const { data, error } = await supabase.from('risks').insert({ project_id: activeProjectId, description: risk.description, probability: prob, impact: imp, owner_name: risk.owner_name || '', status: risk.status || 'Active' }).select().single()
      if (error) { setRisks((prev) => prev.filter((r) => r.id !== tempId)); toast.error('Failed to add risk', { description: error.message }); return }
      setRisks((prev) => prev.map((r) => (r.id === tempId ? (data as Risk) : r)).sort((a, b) => b.severity - a.severity))
      toast.success('Risk added to register')
    })
  }, [activeProjectId, withSaving])

  const updateRisk = useCallback(async (id: string, updates: Partial<Risk>) => {
    const previous = risks.find((r) => r.id === id)
    if (!previous) return
    const newProb = updates.probability ?? previous.probability
    const newImpact = updates.impact ?? previous.impact
    setRisks((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates, severity: newProb * newImpact } : r)).sort((a, b) => b.severity - a.severity))
    await withSaving(async () => {
      const { error } = await supabase.from('risks').update(updates).eq('id', id)
      if (error) { setRisks((prev) => prev.map((r) => (r.id === id ? previous : r)).sort((a, b) => b.severity - a.severity)); toast.error('Failed to update', { description: error.message }); return }
      toast.success('Risk updated')
    })
  }, [risks, withSaving])

  const deleteRisk = useCallback(async (id: string) => {
    const previous = risks.find((r) => r.id === id)
    setRisks((prev) => prev.filter((r) => r.id !== id))
    await withSaving(async () => {
      const { error } = await supabase.from('risks').delete().eq('id', id)
      if (error) { if (previous) setRisks((prev) => [...prev, previous].sort((a, b) => b.severity - a.severity)); toast.error('Failed to delete', { description: error.message }); return }
      toast.success('Risk removed')
    })
  }, [risks, withSaving])

  // ─── Charter CRUD ──────────────────────────────────────────────────────────

  const addCharter = useCallback(async (charter: { name: string; sponsor?: string; start_date?: string | null; in_scope?: string[]; out_of_scope?: string[]; team_members?: string[] }) => {
    if (!activeProjectId) return
    const tempId = crypto.randomUUID()
    const optimistic: Charter = { id: tempId, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), project_id: activeProjectId, name: charter.name, sponsor: charter.sponsor || '', start_date: charter.start_date || null, in_scope: charter.in_scope || [], out_of_scope: charter.out_of_scope || [], team_members: charter.team_members || [] }
    setCharters((prev) => [optimistic, ...prev])
    await withSaving(async () => {
      const { data, error } = await supabase.from('charters').insert({ project_id: activeProjectId, name: charter.name, sponsor: charter.sponsor || '', start_date: charter.start_date || null, in_scope: charter.in_scope || [], out_of_scope: charter.out_of_scope || [], team_members: charter.team_members || [] }).select().single()
      if (error) { setCharters((prev) => prev.filter((c) => c.id !== tempId)); toast.error('Failed to create charter', { description: error.message }); return }
      setCharters((prev) => prev.map((c) => (c.id === tempId ? (data as Charter) : c)))
      toast.success('Charter created', { description: charter.name })
    })
  }, [activeProjectId, withSaving])

  const updateCharter = useCallback(async (id: string, updates: Partial<Charter>) => {
    const previous = charters.find((c) => c.id === id)
    if (!previous) return
    setCharters((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    await withSaving(async () => {
      const { error } = await supabase.from('charters').update(updates).eq('id', id)
      if (error) { setCharters((prev) => prev.map((c) => (c.id === id ? previous : c))); toast.error('Failed to update', { description: error.message }); return }
      toast.success('Charter updated')
    })
  }, [charters, withSaving])

  const deleteCharter = useCallback(async (id: string) => {
    const previous = charters.find((c) => c.id === id)
    setCharters((prev) => prev.filter((c) => c.id !== id))
    await withSaving(async () => {
      const { error } = await supabase.from('charters').delete().eq('id', id)
      if (error) { if (previous) setCharters((prev) => [previous, ...prev]); toast.error('Failed to delete', { description: error.message }); return }
      toast.success('Charter removed')
    })
  }, [charters, withSaving])

  // ─── Value ─────────────────────────────────────────────────────────────────

  const value: BusinessOSContextValue = {
    session, profile, isAdmin, signOut,
    activeProject, projects, setActiveProjectId, createProject,
    isLoading, isSaving,
    swotItems, addSwotItem, updateSwotItem, deleteSwotItem,
    risks, addRisk, updateRisk, deleteRisk,
    charters, addCharter, updateCharter, deleteCharter,
  }

  return <BusinessOSContext.Provider value={value}>{children}</BusinessOSContext.Provider>
}
