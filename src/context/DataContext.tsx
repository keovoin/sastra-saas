import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useBusinessOS } from '@/context/BusinessContext'
import { toast } from 'sonner'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Task {
  id: string; project_id: string; title: string; description: string; assignee: string
  priority: string; labels: string[]; due_date: string | null; column_id: string
  order: number; created_at: string; updated_at: string
}
export interface PipelineDeal {
  id: string; project_id: string; company: string; value: number; contact: string
  probability: number; next_action: string; stage: string; assignee: string
  created_at: string; updated_at: string
}
export interface Invoice {
  id: string; project_id: string; invoice_number: string; client: string; amount: number
  status: string; due_date: string | null; issued_date: string | null; remark: string
  reference_id: string; created_at: string; updated_at: string
}
export interface CalendarEvent {
  id: string; project_id: string; title: string; event_date: string; type: string
  description: string; created_at: string
}
export interface OnboardingChecklist {
  id: string; project_id: string; employee_name: string; role: string
  start_date: string | null; steps: any[]; created_at: string
}
export interface OffboardingChecklist {
  id: string; project_id: string; employee_name: string; department: string
  last_day: string | null; steps: any[]; created_at: string
}
export interface EmployeeMovement {
  id: string; project_id: string; employee_name: string; movement_type: string
  from_role: string; from_dept: string; to_role: string; to_dept: string
  approved_by: string; movement_date: string; notes: string; created_at: string
}
export interface Message {
  id: string; channel_id: string; author_id: string; author_name: string
  content: string; reply_to: string | null; created_at: string
}
export interface Channel {
  id: string; name: string; type: string; description: string
  created_by: string | null; members: string[]; created_at: string
}
export interface Ticket {
  id: string; project_id: string; subject: string; description: string
  requester_name: string; requester_id: string | null; assignee: string
  category: string; priority: string; status: string; due_date: string | null
  created_at: string; updated_at: string
}
export interface TicketReply {
  id: string; ticket_id: string; author_name: string; author_id: string | null
  content: string; created_at: string
}


// ─── Context Interface ───────────────────────────────────────────────────────

interface DataContextValue {
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_id'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  deals: PipelineDeal[]
  addDeal: (deal: Omit<PipelineDeal, 'id' | 'created_at' | 'updated_at' | 'project_id'>) => Promise<void>
  updateDeal: (id: string, updates: Partial<PipelineDeal>) => Promise<void>
  deleteDeal: (id: string) => Promise<void>
  invoices: Invoice[]
  addInvoice: (inv: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'project_id'>) => Promise<void>
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  calendarEvents: CalendarEvent[]
  addCalendarEvent: (ev: Omit<CalendarEvent, 'id' | 'created_at' | 'project_id'>) => Promise<void>
  deleteCalendarEvent: (id: string) => Promise<void>
  onboardingChecklists: OnboardingChecklist[]
  addOnboarding: (cl: Omit<OnboardingChecklist, 'id' | 'created_at' | 'project_id'>) => Promise<void>
  updateOnboarding: (id: string, updates: Partial<OnboardingChecklist>) => Promise<void>
  deleteOnboarding: (id: string) => Promise<void>
  offboardingChecklists: OffboardingChecklist[]
  addOffboarding: (cl: Omit<OffboardingChecklist, 'id' | 'created_at' | 'project_id'>) => Promise<void>
  updateOffboarding: (id: string, updates: Partial<OffboardingChecklist>) => Promise<void>
  deleteOffboarding: (id: string) => Promise<void>
  movements: EmployeeMovement[]
  addMovement: (m: Omit<EmployeeMovement, 'id' | 'created_at' | 'project_id'>) => Promise<void>
  deleteMovement: (id: string) => Promise<void>
  messages: Message[]
  channels: Channel[]
  sendMessage: (msg: { channel_id: string; content: string; author_name: string; reply_to?: string }) => Promise<void>
  addChannel: (ch: Omit<Channel, 'id' | 'created_at' | 'created_by'>) => Promise<void>
  tickets: Ticket[]
  ticketReplies: TicketReply[]
  addTicket: (t: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'project_id'>) => Promise<void>
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>
  deleteTicket: (id: string) => Promise<void>
  fetchTicketReplies: (ticketId: string) => Promise<void>
  addTicketReply: (reply: { ticket_id: string; content: string; author_name: string }) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be inside DataProvider')
  return ctx
}


// ─── Provider ────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { activeProject, session } = useBusinessOS()
  const [tasks, setTasks] = useState<Task[]>([])
  const [deals, setDeals] = useState<PipelineDeal[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [onboardingChecklists, setOnboardingChecklists] = useState<OnboardingChecklist[]>([])
  const [offboardingChecklists, setOffboardingChecklists] = useState<OffboardingChecklist[]>([])
  const [movements, setMovements] = useState<EmployeeMovement[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)

  // ─── Fetch All Data ──────────────────────────────────────────────────────

  const fetchAll = useCallback(async (projectId: string) => {
    const [tasksRes, dealsRes, invoicesRes, eventsRes, onbRes, offbRes, movRes, ticketsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('project_id', projectId).order('order'),
      supabase.from('pipeline_deals').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('calendar_events').select('*').eq('project_id', projectId).order('event_date'),
      supabase.from('onboarding_checklists').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('offboarding_checklists').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('employee_movements').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('tickets').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    ])
    if (tasksRes.data) setTasks(tasksRes.data as Task[])
    if (dealsRes.data) setDeals(dealsRes.data as PipelineDeal[])
    if (invoicesRes.data) setInvoices(invoicesRes.data as Invoice[])
    if (eventsRes.data) setCalendarEvents(eventsRes.data as CalendarEvent[])
    if (onbRes.data) setOnboardingChecklists(onbRes.data as OnboardingChecklist[])
    if (offbRes.data) setOffboardingChecklists(offbRes.data as OffboardingChecklist[])
    if (movRes.data) setMovements(movRes.data as EmployeeMovement[])
    if (ticketsRes.data) setTickets(ticketsRes.data as Ticket[])
  }, [])

  const fetchChannels = useCallback(async () => {
    const { data } = await supabase.from('channels').select('*').order('created_at')
    if (data) setChannels(data as Channel[])
  }, [])

  const fetchMessages = useCallback(async (channelId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('channel_id', channelId).order('created_at')
    if (data) setMessages(data as Message[])
  }, [])


  // ─── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeProject?.id) {
      fetchAll(activeProject.id)
      fetchChannels()
    } else {
      setTasks([]); setDeals([]); setInvoices([]); setCalendarEvents([])
      setOnboardingChecklists([]); setOffboardingChecklists([]); setMovements([])
      setTickets([]); setTicketReplies([])
    }
  }, [activeProject?.id, fetchAll, fetchChannels])

  // ─── Realtime Subscriptions ──────────────────────────────────────────────

  useEffect(() => {
    if (!activeProject?.id) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const ch = supabase
      .channel(`data-${activeProject.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${activeProject.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') setTasks(prev => prev.some(t => t.id === (payload.new as Task).id) ? prev : [...prev, payload.new as Task])
        else if (payload.eventType === 'UPDATE') setTasks(prev => prev.map(t => t.id === (payload.new as Task).id ? payload.new as Task : t))
        else if (payload.eventType === 'DELETE') setTasks(prev => prev.filter(t => t.id !== (payload.old as { id: string }).id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_deals', filter: `project_id=eq.${activeProject.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') setDeals(prev => prev.some(d => d.id === (payload.new as PipelineDeal).id) ? prev : [...prev, payload.new as PipelineDeal])
        else if (payload.eventType === 'UPDATE') setDeals(prev => prev.map(d => d.id === (payload.new as PipelineDeal).id ? payload.new as PipelineDeal : d))
        else if (payload.eventType === 'DELETE') setDeals(prev => prev.filter(d => d.id !== (payload.old as { id: string }).id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `project_id=eq.${activeProject.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') setInvoices(prev => prev.some(i => i.id === (payload.new as Invoice).id) ? prev : [...prev, payload.new as Invoice])
        else if (payload.eventType === 'UPDATE') setInvoices(prev => prev.map(i => i.id === (payload.new as Invoice).id ? payload.new as Invoice : i))
        else if (payload.eventType === 'DELETE') setInvoices(prev => prev.filter(i => i.id !== (payload.old as { id: string }).id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.eventType === 'INSERT') setMessages(prev => prev.some(m => m.id === (payload.new as Message).id) ? prev : [...prev, payload.new as Message])
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `project_id=eq.${activeProject.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') setTickets(prev => prev.some(t => t.id === (payload.new as Ticket).id) ? prev : [payload.new as Ticket, ...prev])
        else if (payload.eventType === 'UPDATE') setTickets(prev => prev.map(t => t.id === (payload.new as Ticket).id ? payload.new as Ticket : t))
        else if (payload.eventType === 'DELETE') setTickets(prev => prev.filter(t => t.id !== (payload.old as { id: string }).id))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_replies' }, (payload) => {
        setTicketReplies(prev => prev.some(r => r.id === (payload.new as TicketReply).id) ? prev : [...prev, payload.new as TicketReply])
      })
      .subscribe()

    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [activeProject?.id])


  // ─── Task CRUD ─────────────────────────────────────────────────────────────

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_id'>) => {
    if (!activeProject) return
    const tempId = crypto.randomUUID()
    const optimistic = { id: tempId, ...task, project_id: activeProject.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Task
    setTasks(prev => [...prev, optimistic])
    const { data, error } = await supabase.from('tasks').insert({ ...task, project_id: activeProject.id }).select().single()
    if (error) { setTasks(prev => prev.filter(t => t.id !== tempId)); toast.error('Failed to create task', { description: error.message }); return }
    setTasks(prev => prev.map(t => t.id === tempId ? data as Task : t))
    toast.success('Task created')
  }, [activeProject])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const prev = tasks.find(t => t.id === id)
    if (!prev) return
    setTasks(p => p.map(t => t.id === id ? { ...t, ...updates } : t))
    const { error } = await supabase.from('tasks').update(updates).eq('id', id)
    if (error) { setTasks(p => p.map(t => t.id === id ? prev : t)); toast.error('Failed to update task', { description: error.message }) }
  }, [tasks])

  const deleteTask = useCallback(async (id: string) => {
    const prev = tasks.find(t => t.id === id)
    setTasks(p => p.filter(t => t.id !== id))
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { if (prev) setTasks(p => [...p, prev]); toast.error('Failed to delete task', { description: error.message }); return }
    toast.success('Task deleted')
  }, [tasks])

  // ─── Deal CRUD ─────────────────────────────────────────────────────────────

  const addDeal = useCallback(async (deal: Omit<PipelineDeal, 'id' | 'created_at' | 'updated_at' | 'project_id'>) => {
    if (!activeProject) return
    const tempId = crypto.randomUUID()
    const optimistic = { id: tempId, ...deal, project_id: activeProject.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as PipelineDeal
    setDeals(prev => [...prev, optimistic])
    const { data, error } = await supabase.from('pipeline_deals').insert({ ...deal, project_id: activeProject.id }).select().single()
    if (error) { setDeals(prev => prev.filter(d => d.id !== tempId)); toast.error('Failed to add deal', { description: error.message }); return }
    setDeals(prev => prev.map(d => d.id === tempId ? data as PipelineDeal : d))
    toast.success('Deal added to pipeline')
  }, [activeProject])

  const updateDeal = useCallback(async (id: string, updates: Partial<PipelineDeal>) => {
    const prev = deals.find(d => d.id === id)
    if (!prev) return
    setDeals(p => p.map(d => d.id === id ? { ...d, ...updates } : d))
    const { error } = await supabase.from('pipeline_deals').update(updates).eq('id', id)
    if (error) { setDeals(p => p.map(d => d.id === id ? prev : d)); toast.error('Failed to update deal', { description: error.message }) }
  }, [deals])

  const deleteDeal = useCallback(async (id: string) => {
    const prev = deals.find(d => d.id === id)
    setDeals(p => p.filter(d => d.id !== id))
    const { error } = await supabase.from('pipeline_deals').delete().eq('id', id)
    if (error) { if (prev) setDeals(p => [...p, prev]); toast.error('Failed to delete deal', { description: error.message }); return }
    toast.success('Deal removed')
  }, [deals])


  // ─── Invoice CRUD ──────────────────────────────────────────────────────────

  const addInvoice = useCallback(async (inv: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'project_id'>) => {
    if (!activeProject) return
    const tempId = crypto.randomUUID()
    const optimistic = { id: tempId, ...inv, project_id: activeProject.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Invoice
    setInvoices(prev => [...prev, optimistic])
    const { data, error } = await supabase.from('invoices').insert({ ...inv, project_id: activeProject.id }).select().single()
    if (error) { setInvoices(prev => prev.filter(i => i.id !== tempId)); toast.error('Failed to create invoice', { description: error.message }); return }
    setInvoices(prev => prev.map(i => i.id === tempId ? data as Invoice : i))
    toast.success('Invoice created')
  }, [activeProject])

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    const prev = invoices.find(i => i.id === id)
    if (!prev) return
    setInvoices(p => p.map(i => i.id === id ? { ...i, ...updates } : i))
    const { error } = await supabase.from('invoices').update(updates).eq('id', id)
    if (error) { setInvoices(p => p.map(i => i.id === id ? prev : i)); toast.error('Failed to update invoice', { description: error.message }) }
  }, [invoices])

  const deleteInvoice = useCallback(async (id: string) => {
    const prev = invoices.find(i => i.id === id)
    setInvoices(p => p.filter(i => i.id !== id))
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) { if (prev) setInvoices(p => [...p, prev]); toast.error('Failed to delete invoice', { description: error.message }); return }
    toast.success('Invoice deleted')
  }, [invoices])

  // ─── Calendar Event CRUD ───────────────────────────────────────────────────

  const addCalendarEvent = useCallback(async (ev: Omit<CalendarEvent, 'id' | 'created_at' | 'project_id'>) => {
    if (!activeProject) return
    const tempId = crypto.randomUUID()
    const optimistic = { id: tempId, ...ev, project_id: activeProject.id, created_at: new Date().toISOString() } as CalendarEvent
    setCalendarEvents(prev => [...prev, optimistic])
    const { data, error } = await supabase.from('calendar_events').insert({ ...ev, project_id: activeProject.id }).select().single()
    if (error) { setCalendarEvents(prev => prev.filter(e => e.id !== tempId)); toast.error('Failed to add event', { description: error.message }); return }
    setCalendarEvents(prev => prev.map(e => e.id === tempId ? data as CalendarEvent : e))
    toast.success('Event added')
  }, [activeProject])

  const deleteCalendarEvent = useCallback(async (id: string) => {
    const prev = calendarEvents.find(e => e.id === id)
    setCalendarEvents(p => p.filter(e => e.id !== id))
    const { error } = await supabase.from('calendar_events').delete().eq('id', id)
    if (error) { if (prev) setCalendarEvents(p => [...p, prev]); toast.error('Failed to delete event', { description: error.message }); return }
    toast.success('Event removed')
  }, [calendarEvents])


  // ─── Onboarding CRUD ───────────────────────────────────────────────────────

  const addOnboarding = useCallback(async (cl: Omit<OnboardingChecklist, 'id' | 'created_at' | 'project_id'>) => {
    if (!activeProject) return
    const tempId = crypto.randomUUID()
    const optimistic = { id: tempId, ...cl, project_id: activeProject.id, created_at: new Date().toISOString() } as OnboardingChecklist
    setOnboardingChecklists(prev => [optimistic, ...prev])
    const { data, error } = await supabase.from('onboarding_checklists').insert({ ...cl, project_id: activeProject.id }).select().single()
    if (error) { setOnboardingChecklists(prev => prev.filter(c => c.id !== tempId)); toast.error('Failed to create checklist', { description: error.message }); return }
    setOnboardingChecklists(prev => prev.map(c => c.id === tempId ? data as OnboardingChecklist : c))
    toast.success('Onboarding checklist created')
  }, [activeProject])

  const updateOnboarding = useCallback(async (id: string, updates: Partial<OnboardingChecklist>) => {
    const prev = onboardingChecklists.find(c => c.id === id)
    if (!prev) return
    setOnboardingChecklists(p => p.map(c => c.id === id ? { ...c, ...updates } : c))
    const { error } = await supabase.from('onboarding_checklists').update(updates).eq('id', id)
    if (error) { setOnboardingChecklists(p => p.map(c => c.id === id ? prev : c)); toast.error('Failed to update', { description: error.message }) }
  }, [onboardingChecklists])

  const deleteOnboarding = useCallback(async (id: string) => {
    const prev = onboardingChecklists.find(c => c.id === id)
    setOnboardingChecklists(p => p.filter(c => c.id !== id))
    const { error } = await supabase.from('onboarding_checklists').delete().eq('id', id)
    if (error) { if (prev) setOnboardingChecklists(p => [prev, ...p]); toast.error('Failed to delete', { description: error.message }); return }
    toast.success('Checklist removed')
  }, [onboardingChecklists])

  // ─── Offboarding CRUD ──────────────────────────────────────────────────────

  const addOffboarding = useCallback(async (cl: Omit<OffboardingChecklist, 'id' | 'created_at' | 'project_id'>) => {
    if (!activeProject) return
    const tempId = crypto.randomUUID()
    const optimistic = { id: tempId, ...cl, project_id: activeProject.id, created_at: new Date().toISOString() } as OffboardingChecklist
    setOffboardingChecklists(prev => [optimistic, ...prev])
    const { data, error } = await supabase.from('offboarding_checklists').insert({ ...cl, project_id: activeProject.id }).select().single()
    if (error) { setOffboardingChecklists(prev => prev.filter(c => c.id !== tempId)); toast.error('Failed to create checklist', { description: error.message }); return }
    setOffboardingChecklists(prev => prev.map(c => c.id === tempId ? data as OffboardingChecklist : c))
    toast.success('Offboarding checklist created')
  }, [activeProject])

  const updateOffboarding = useCallback(async (id: string, updates: Partial<OffboardingChecklist>) => {
    const prev = offboardingChecklists.find(c => c.id === id)
    if (!prev) return
    setOffboardingChecklists(p => p.map(c => c.id === id ? { ...c, ...updates } : c))
    const { error } = await supabase.from('offboarding_checklists').update(updates).eq('id', id)
    if (error) { setOffboardingChecklists(p => p.map(c => c.id === id ? prev : c)); toast.error('Failed to update', { description: error.message }) }
  }, [offboardingChecklists])

  const deleteOffboarding = useCallback(async (id: string) => {
    const prev = offboardingChecklists.find(c => c.id === id)
    setOffboardingChecklists(p => p.filter(c => c.id !== id))
    const { error } = await supabase.from('offboarding_checklists').delete().eq('id', id)
    if (error) { if (prev) setOffboardingChecklists(p => [prev, ...p]); toast.error('Failed to delete', { description: error.message }); return }
    toast.success('Checklist removed')
  }, [offboardingChecklists])


  // ─── Employee Movement CRUD ────────────────────────────────────────────────

  const addMovement = useCallback(async (m: Omit<EmployeeMovement, 'id' | 'created_at' | 'project_id'>) => {
    if (!activeProject) return
    const tempId = crypto.randomUUID()
    const optimistic = { id: tempId, ...m, project_id: activeProject.id, created_at: new Date().toISOString() } as EmployeeMovement
    setMovements(prev => [optimistic, ...prev])
    const { data, error } = await supabase.from('employee_movements').insert({ ...m, project_id: activeProject.id }).select().single()
    if (error) { setMovements(prev => prev.filter(x => x.id !== tempId)); toast.error('Failed to record movement', { description: error.message }); return }
    setMovements(prev => prev.map(x => x.id === tempId ? data as EmployeeMovement : x))
    toast.success('Movement recorded')
  }, [activeProject])

  const deleteMovement = useCallback(async (id: string) => {
    const prev = movements.find(m => m.id === id)
    setMovements(p => p.filter(m => m.id !== id))
    const { error } = await supabase.from('employee_movements').delete().eq('id', id)
    if (error) { if (prev) setMovements(p => [prev, ...p]); toast.error('Failed to delete', { description: error.message }); return }
    toast.success('Movement removed')
  }, [movements])

  // ─── Messaging CRUD ────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (msg: { channel_id: string; content: string; author_name: string; reply_to?: string }) => {
    if (!session) return
    const tempId = crypto.randomUUID()
    const optimistic: Message = { id: tempId, channel_id: msg.channel_id, author_id: session.user.id, author_name: msg.author_name, content: msg.content, reply_to: msg.reply_to || null, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, optimistic])
    const { data, error } = await supabase.from('messages').insert({ channel_id: msg.channel_id, author_id: session.user.id, author_name: msg.author_name, content: msg.content, reply_to: msg.reply_to || null }).select().single()
    if (error) { setMessages(prev => prev.filter(m => m.id !== tempId)); toast.error('Failed to send', { description: error.message }); return }
    setMessages(prev => prev.map(m => m.id === tempId ? data as Message : m))
  }, [session])

  const addChannel = useCallback(async (ch: Omit<Channel, 'id' | 'created_at' | 'created_by'>) => {
    const tempId = crypto.randomUUID()
    const optimistic: Channel = { id: tempId, ...ch, created_by: session?.user.id || null, created_at: new Date().toISOString() }
    setChannels(prev => [...prev, optimistic])
    const { data, error } = await supabase.from('channels').insert({ ...ch, created_by: session?.user.id || null }).select().single()
    if (error) { setChannels(prev => prev.filter(c => c.id !== tempId)); toast.error('Failed to create channel', { description: error.message }); return }
    setChannels(prev => prev.map(c => c.id === tempId ? data as Channel : c))
    toast.success(`#${ch.name} created`)
  }, [session])

  // ─── Ticket CRUD ───────────────────────────────────────────────────────────

  const addTicket = useCallback(async (t: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'project_id'>) => {
    if (!activeProject) return
    const tempId = crypto.randomUUID()
    const optimistic = { id: tempId, ...t, project_id: activeProject.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Ticket
    setTickets(prev => [optimistic, ...prev])
    const { data, error } = await supabase.from('tickets').insert({ ...t, project_id: activeProject.id, requester_id: session?.user.id || null }).select().single()
    if (error) { setTickets(prev => prev.filter(x => x.id !== tempId)); toast.error('Failed to create ticket', { description: error.message }); return }
    setTickets(prev => prev.map(x => x.id === tempId ? data as Ticket : x))
    toast.success('Ticket created')
  }, [activeProject, session])

  const updateTicket = useCallback(async (id: string, updates: Partial<Ticket>) => {
    const prev = tickets.find(t => t.id === id)
    if (!prev) return
    setTickets(p => p.map(t => t.id === id ? { ...t, ...updates } : t))
    const { error } = await supabase.from('tickets').update(updates).eq('id', id)
    if (error) { setTickets(p => p.map(t => t.id === id ? prev : t)); toast.error('Failed to update ticket', { description: error.message }) }
  }, [tickets])

  const deleteTicket = useCallback(async (id: string) => {
    const prev = tickets.find(t => t.id === id)
    setTickets(p => p.filter(t => t.id !== id))
    const { error } = await supabase.from('tickets').delete().eq('id', id)
    if (error) { if (prev) setTickets(p => [prev, ...p]); toast.error('Failed to delete ticket', { description: error.message }); return }
    toast.success('Ticket deleted')
  }, [tickets])

  const fetchTicketReplies = useCallback(async (ticketId: string) => {
    const { data } = await supabase.from('ticket_replies').select('*').eq('ticket_id', ticketId).order('created_at')
    if (data) setTicketReplies(data as TicketReply[])
  }, [])

  const addTicketReply = useCallback(async (reply: { ticket_id: string; content: string; author_name: string }) => {
    const tempId = crypto.randomUUID()
    const optimistic: TicketReply = { id: tempId, ticket_id: reply.ticket_id, author_name: reply.author_name, author_id: session?.user.id || null, content: reply.content, created_at: new Date().toISOString() }
    setTicketReplies(prev => [...prev, optimistic])
    const { data, error } = await supabase.from('ticket_replies').insert({ ticket_id: reply.ticket_id, content: reply.content, author_name: reply.author_name, author_id: session?.user.id || null }).select().single()
    if (error) { setTicketReplies(prev => prev.filter(r => r.id !== tempId)); toast.error('Failed to send reply', { description: error.message }); return }
    setTicketReplies(prev => prev.map(r => r.id === tempId ? data as TicketReply : r))
  }, [session])


  // ─── Context Value ─────────────────────────────────────────────────────────

  const value: DataContextValue = {
    tasks, addTask, updateTask, deleteTask,
    deals, addDeal, updateDeal, deleteDeal,
    invoices, addInvoice, updateInvoice, deleteInvoice,
    calendarEvents, addCalendarEvent, deleteCalendarEvent,
    onboardingChecklists, addOnboarding, updateOnboarding, deleteOnboarding,
    offboardingChecklists, addOffboarding, updateOffboarding, deleteOffboarding,
    movements, addMovement, deleteMovement,
    messages, channels, sendMessage, addChannel,
    tickets, ticketReplies, addTicket, updateTicket, deleteTicket, fetchTicketReplies, addTicketReply,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
