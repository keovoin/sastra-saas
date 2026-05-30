import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Priority = 'Low' | 'Medium' | 'High'
export type SwotCategory = 'strengths' | 'weaknesses' | 'opportunities' | 'threats'
export type RiskStatus = 'Active' | 'Mitigated' | 'Watch'
export type UserRole = 'admin' | 'viewer'

export interface UserPersona {
  id: string
  name: string
  email: string
  initials: string
  role: UserRole
  gradient: string
}

export interface SwotItem {
  id: string
  text: string
  priority: Priority
  category: SwotCategory
}

export interface RiskItem {
  id: string
  description: string
  probability: number
  impact: number
  severity: number
  owner: string
  ownerAvatar: string
  status: RiskStatus
}

export interface ProjectCharter {
  id: string
  name: string
  sponsor: string
  startDate: string
  inScope: string[]
  outOfScope: string[]
  teamMembers: string[]
  createdAt: string
}

interface DataStore {
  swotItems: SwotItem[]
  risks: RiskItem[]
  charters: ProjectCharter[]
}

interface BusinessOSContextValue {
  // Auth / RBAC
  activeUser: UserPersona
  switchUser: (userId: string) => void
  isAdmin: boolean

  // UI State
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  isSaving: boolean

  // SWOT
  swotItems: SwotItem[]
  addSwotItem: (item: Omit<SwotItem, 'id'>) => void
  updateSwotItem: (id: string, updates: Partial<SwotItem>) => void
  deleteSwotItem: (id: string) => void

  // Risks
  risks: RiskItem[]
  addRisk: (risk: Omit<RiskItem, 'id'>) => void
  updateRisk: (id: string, updates: Partial<RiskItem>) => void
  deleteRisk: (id: string) => void

  // Project Charters
  charters: ProjectCharter[]
  addCharter: (charter: Omit<ProjectCharter, 'id' | 'createdAt'>) => void
}

// ─── User Personas ────────────────────────────────────────────────────────────

export const PERSONAS: UserPersona[] = [
  {
    id: 'user-a',
    name: 'John Doe',
    email: 'john.doe@sastra.io',
    initials: 'JD',
    role: 'admin',
    gradient: 'from-violet-500 to-indigo-600',
  },
  {
    id: 'user-b',
    name: 'Jane Smith',
    email: 'jane.smith@sastra.io',
    initials: 'JS',
    role: 'viewer',
    gradient: 'from-amber-500 to-orange-600',
  },
]

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_DATA: DataStore = {
  swotItems: [
    { id: 'swot-1', text: 'Strong engineering team with 15+ years average experience', priority: 'High', category: 'strengths' },
    { id: 'swot-2', text: 'Proprietary ML pipeline reduces processing time by 60%', priority: 'High', category: 'strengths' },
    { id: 'swot-3', text: 'Limited brand awareness in enterprise segment', priority: 'Medium', category: 'weaknesses' },
    { id: 'swot-4', text: 'Technical debt in legacy payment module', priority: 'High', category: 'weaknesses' },
    { id: 'swot-5', text: 'EU market expansion post-GDPR compliance certification', priority: 'High', category: 'opportunities' },
    { id: 'swot-6', text: 'Partnership with Salesforce for CRM integration', priority: 'Medium', category: 'opportunities' },
    { id: 'swot-7', text: 'New competitor funded $50M Series C in same vertical', priority: 'High', category: 'threats' },
    { id: 'swot-8', text: 'Potential regulatory changes in data privacy (AI Act)', priority: 'Medium', category: 'threats' },
  ],
  risks: [
    { id: 'RSK-001', description: 'Cloud infrastructure vendor lock-in with AWS services', probability: 4, impact: 4, severity: 16, owner: 'Sarah Chen', ownerAvatar: 'SC', status: 'Active' },
    { id: 'RSK-002', description: 'Key engineer departure risk (bus factor = 1 on auth module)', probability: 3, impact: 5, severity: 15, owner: 'Marcus Johnson', ownerAvatar: 'MJ', status: 'Watch' },
    { id: 'RSK-003', description: 'Third-party API deprecation (Stripe v2 sunset Q4)', probability: 5, impact: 4, severity: 20, owner: 'Priya Sharma', ownerAvatar: 'PS', status: 'Active' },
    { id: 'RSK-004', description: 'Data breach through unpatched dependencies', probability: 2, impact: 5, severity: 10, owner: 'Alex Rivera', ownerAvatar: 'AR', status: 'Mitigated' },
    { id: 'RSK-005', description: 'Market timing risk for Q3 product launch', probability: 3, impact: 3, severity: 9, owner: 'Sarah Chen', ownerAvatar: 'SC', status: 'Watch' },
    { id: 'RSK-006', description: 'Compliance gap with SOC 2 Type II certification', probability: 4, impact: 5, severity: 20, owner: 'David Kim', ownerAvatar: 'DK', status: 'Active' },
    { id: 'RSK-007', description: 'Customer churn due to slow feature delivery cadence', probability: 3, impact: 4, severity: 12, owner: 'Marcus Johnson', ownerAvatar: 'MJ', status: 'Watch' },
    { id: 'RSK-008', description: 'Budget overrun on infrastructure scaling costs', probability: 4, impact: 3, severity: 12, owner: 'Priya Sharma', ownerAvatar: 'PS', status: 'Active' },
  ],
  charters: [
    {
      id: 'CHR-001',
      name: 'Platform Migration to Kubernetes',
      sponsor: 'CTO - Jennifer Walsh',
      startDate: '2024-09-01',
      inScope: ['Container orchestration', 'CI/CD pipeline update', 'Service mesh implementation'],
      outOfScope: ['Database migration', 'Frontend rewrite'],
      teamMembers: ['sarah@company.com', 'marcus@company.com', 'priya@company.com'],
      createdAt: '2024-08-15',
    },
  ],
}

// ─── LocalStorage Helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = 'sastra-bos-data'
const USER_KEY = 'sastra-bos-user'

function loadFromStorage(): DataStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_DATA
}

function saveToStorage(data: DataStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function loadActiveUser(): string {
  try {
    return localStorage.getItem(USER_KEY) || 'user-a'
  } catch {
    return 'user-a'
  }
}

function saveActiveUser(userId: string) {
  try {
    localStorage.setItem(USER_KEY, userId)
  } catch {}
}

// ─── Context ──────────────────────────────────────────────────────────────────

const BusinessOSContext = createContext<BusinessOSContextValue | null>(null)

export function useBusinessOS() {
  const ctx = useContext(BusinessOSContext)
  if (!ctx) throw new Error('useBusinessOS must be used within a BusinessOSProvider')
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BusinessOSProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DataStore>(loadFromStorage)
  const [activeUserId, setActiveUserId] = useState<string>(loadActiveUser)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeUser = PERSONAS.find((p) => p.id === activeUserId) || PERSONAS[0]
  const isAdmin = activeUser.role === 'admin'

  // Persist data to localStorage with simulated latency
  const persistData = useCallback((newData: DataStore) => {
    setIsSaving(true)

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(newData)
      setIsSaving(false)
    }, 600)
  }, [])

  // Wrap state mutation with latency simulation
  const mutateData = useCallback(
    (updater: (prev: DataStore) => DataStore, successMessage?: string) => {
      setData((prev) => {
        const next = updater(prev)
        persistData(next)
        return next
      })
      if (successMessage) {
        // Delay toast to sync with save animation
        setTimeout(() => toast.success(successMessage), 650)
      }
    },
    [persistData]
  )

  // ─── User Switching ───────────────────────────────────────────────────────

  const switchUser = useCallback((userId: string) => {
    setActiveUserId(userId)
    saveActiveUser(userId)
    const persona = PERSONAS.find((p) => p.id === userId)
    toast.info(`Switched to ${persona?.name} (${persona?.role === 'admin' ? 'Admin' : 'Viewer'})`)
  }, [])

  // ─── Sidebar ──────────────────────────────────────────────────────────────

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev)
  }, [])

  // ─── SWOT Operations ──────────────────────────────────────────────────────

  const addSwotItem = useCallback(
    (item: Omit<SwotItem, 'id'>) => {
      mutateData(
        (prev) => ({
          ...prev,
          swotItems: [...prev.swotItems, { ...item, id: `swot-${Date.now()}` }],
        }),
        'Item added to Strategy Board'
      )
    },
    [mutateData]
  )

  const updateSwotItem = useCallback(
    (id: string, updates: Partial<SwotItem>) => {
      mutateData(
        (prev) => ({
          ...prev,
          swotItems: prev.swotItems.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        }),
        'Item updated successfully'
      )
    },
    [mutateData]
  )

  const deleteSwotItem = useCallback(
    (id: string) => {
      mutateData(
        (prev) => ({
          ...prev,
          swotItems: prev.swotItems.filter((item) => item.id !== id),
        }),
        'Item removed'
      )
    },
    [mutateData]
  )

  // ─── Risk Operations ──────────────────────────────────────────────────────

  const addRisk = useCallback(
    (risk: Omit<RiskItem, 'id'>) => {
      mutateData(
        (prev) => ({
          ...prev,
          risks: [...prev.risks, { ...risk, id: `RSK-${String(prev.risks.length + 1).padStart(3, '0')}` }],
        }),
        'New risk added to register'
      )
    },
    [mutateData]
  )

  const updateRisk = useCallback(
    (id: string, updates: Partial<RiskItem>) => {
      mutateData(
        (prev) => ({
          ...prev,
          risks: prev.risks.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        }),
        'Risk updated successfully'
      )
    },
    [mutateData]
  )

  const deleteRisk = useCallback(
    (id: string) => {
      mutateData(
        (prev) => ({
          ...prev,
          risks: prev.risks.filter((r) => r.id !== id),
        }),
        'Risk removed from register'
      )
    },
    [mutateData]
  )

  // ─── Charter Operations ───────────────────────────────────────────────────

  const addCharter = useCallback(
    (charter: Omit<ProjectCharter, 'id' | 'createdAt'>) => {
      mutateData(
        (prev) => ({
          ...prev,
          charters: [
            ...prev.charters,
            {
              ...charter,
              id: `CHR-${String(prev.charters.length + 1).padStart(3, '0')}`,
              createdAt: new Date().toISOString().split('T')[0],
            },
          ],
        }),
        'Project Charter created successfully'
      )
    },
    [mutateData]
  )

  // ─── Context Value ────────────────────────────────────────────────────────

  const value: BusinessOSContextValue = {
    activeUser,
    switchUser,
    isAdmin,
    sidebarCollapsed,
    toggleSidebar,
    isSaving,
    swotItems: data.swotItems,
    addSwotItem,
    updateSwotItem,
    deleteSwotItem,
    risks: data.risks,
    addRisk,
    updateRisk,
    deleteRisk,
    charters: data.charters,
    addCharter,
  }

  return <BusinessOSContext.Provider value={value}>{children}</BusinessOSContext.Provider>
}
