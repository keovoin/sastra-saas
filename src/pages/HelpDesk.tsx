import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  LifeBuoy, Plus, Sparkles, Filter, GripVertical, Calendar,
  MessageSquare, Trash2, AlertTriangle, Send, Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import { useBusinessOS } from '@/context/BusinessContext'
import { useData, type Ticket } from '@/context/DataContext'
import { getWorkspaceMembers, initDefaultMembers } from '@/lib/workspace'
import { isAIConfigured, askAI, askAIJson } from '@/lib/ai'

// ─── Config ──────────────────────────────────────────────────────────────────
const COLUMNS: { id: string; title: string; color: string }[] = [
  { id: 'new', title: 'New', color: 'bg-blue-500' },
  { id: 'assigned', title: 'Assigned', color: 'bg-violet-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-amber-500' },
  { id: 'resolved', title: 'Resolved', color: 'bg-emerald-500' },
  { id: 'closed', title: 'Closed', color: 'bg-slate-500' },
]

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '🔴' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: '🟠' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '🟡' },
  low: { label: 'Low', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '🟢' },
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  it: { label: 'IT', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  hr: { label: 'HR', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
  finance: { label: 'Finance', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  facilities: { label: 'Facilities', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  general: { label: 'General', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
}


export function HelpDesk() {
  const { profile, isAdmin } = useBusinessOS()
  const { tickets, ticketReplies, addTicket, updateTicket, deleteTicket, fetchTicketReplies, addTicketReply } = useData()

  const [showCreate, setShowCreate] = useState(false)
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const members = getWorkspaceMembers()
  const currentUser = profile?.full_name || 'You'

  useEffect(() => { initDefaultMembers() }, [])

  // New ticket form
  const [form, setForm] = useState({
    subject: '', description: '', category: 'general', priority: 'medium', assignee: '', due_date: '',
  })

  // Permission: only workspace admin or the assigned person can change status/resolve
  const canManage = (ticket: Ticket) =>
    isAdmin || ticket.assignee === currentUser

  // ─── Drag & Drop ───────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, ticket: Ticket) => {
    if (!canManage(ticket)) { e.preventDefault(); toast.error('Only admins or the assignee can move this ticket'); return }
    setDraggedId(ticket.id)
    e.dataTransfer.effectAllowed = 'move'
    ;(e.currentTarget as HTMLElement).style.opacity = '0.5'
  }
  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1'
    setDraggedId(null); setDragOverCol(null)
  }
  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    if (draggedId) {
      const ticket = tickets.find(t => t.id === draggedId)
      if (ticket && ticket.status !== status) {
        updateTicket(draggedId, { status })
        toast.success(`Moved to ${COLUMNS.find(c => c.id === status)?.title}`)
      }
    }
    setDragOverCol(null); setDraggedId(null)
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────
  const createTicket = () => {
    if (!form.subject.trim()) { toast.error('Subject is required'); return }
    addTicket({
      subject: form.subject.trim(),
      description: form.description,
      requester_name: currentUser,
      requester_id: null,
      assignee: form.assignee,
      category: form.category,
      priority: form.priority,
      status: form.assignee ? 'assigned' : 'new',
      due_date: form.due_date || null,
    })
    setForm({ subject: '', description: '', category: 'general', priority: 'medium', assignee: '', due_date: '' })
    setShowCreate(false)
  }

  const openDetail = (ticket: Ticket) => {
    setDetailTicket(ticket)
    fetchTicketReplies(ticket.id)
  }

  const sendReply = () => {
    if (!detailTicket || !replyText.trim()) return
    addTicketReply({ ticket_id: detailTicket.id, content: replyText.trim(), author_name: currentUser })
    setReplyText('')
  }


  // ─── AI Assist ─────────────────────────────────────────────────────────────
  const aiCategorize = async () => {
    if (!form.subject) { toast.error('Enter a subject first'); return }
    setAiLoading(true)
    const result = await askAIJson<{ category: string; priority: string }>(
      `Categorize this internal support ticket. Subject: "${form.subject}". Description: "${form.description}".
Return JSON: {"category": "it"|"hr"|"finance"|"facilities"|"general", "priority": "low"|"medium"|"high"|"urgent"}`
    )
    setAiLoading(false)
    if (result.success && result.data) {
      setForm(p => ({ ...p, category: result.data!.category, priority: result.data!.priority }))
      toast.success(`AI set category: ${result.data.category}, priority: ${result.data.priority}`)
    } else toast.error(result.error || 'AI categorize failed')
  }

  const aiDraftReply = async () => {
    if (!detailTicket) return
    setAiLoading(true)
    const thread = ticketReplies.map(r => `${r.author_name}: ${r.content}`).join('\n')
    const result = await askAI(
      `You are an internal support agent. Draft a helpful, professional reply to this ticket.
Subject: ${detailTicket.subject}
Description: ${detailTicket.description}
Category: ${detailTicket.category}
Conversation so far:\n${thread || '(no replies yet)'}
Write only the reply text, concise and friendly.`
    )
    setAiLoading(false)
    if (result.success) { setReplyText(result.content); toast.success('AI drafted a reply — review and send') }
    else toast.error(result.error || 'AI draft failed')
  }

  const aiSummarize = async () => {
    if (!detailTicket) return
    setAiLoading(true)
    const thread = ticketReplies.map(r => `${r.author_name}: ${r.content}`).join('\n')
    const result = await askAI(
      `Summarize this support ticket thread in 2-3 sentences:\nSubject: ${detailTicket.subject}\nDescription: ${detailTicket.description}\n${thread}`
    )
    setAiLoading(false)
    if (result.success) toast.success('Summary', { description: result.content, duration: 10000 })
    else toast.error(result.error || 'AI summary failed')
  }

  // ─── Filters & Stats ───────────────────────────────────────────────────────
  const filtered = tickets.filter(t => {
    if (filterCategory && t.category !== filterCategory) return false
    if (filterPriority && t.priority !== filterPriority) return false
    if (filterAssignee && t.assignee !== filterAssignee) return false
    return true
  })

  const openCount = tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length
  const myCount = tickets.filter(t => t.assignee === currentUser && !['resolved', 'closed'].includes(t.status)).length
  const unassignedCount = tickets.filter(t => !t.assignee && t.status === 'new').length
  const urgentCount = tickets.filter(t => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status)).length


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10"><LifeBuoy className="h-6 w-6 text-cyan-600" /></div>
          <div>
            <h1 className="text-2xl font-bold">Help Desk</h1>
            <p className="text-muted-foreground text-sm">Submit and track internal support tickets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}><Filter className="h-4 w-4 mr-1" />Filters</Button>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />New Ticket</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="card-glow"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Open Tickets</p><p className="text-2xl font-bold">{openCount}</p></CardContent></Card>
        <Card className="card-glow"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Assigned to Me</p><p className="text-2xl font-bold text-violet-600">{myCount}</p></CardContent></Card>
        <Card className="card-glow"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Unassigned</p><p className="text-2xl font-bold text-amber-600">{unassignedCount}</p></CardContent></Card>
        <Card className={`card-glow ${urgentCount > 0 ? 'border-red-300 dark:border-red-800' : ''}`}><CardContent className="p-4"><p className="text-xs text-muted-foreground">Urgent</p><p className={`text-2xl font-bold ${urgentCount > 0 ? 'text-red-500' : ''}`}>{urgentCount}</p></CardContent></Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="animate-fade-in-up"><CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
              <option value="">All Assignees</option>
              {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
        </CardContent></Card>
      )}

      {/* Empty state */}
      {tickets.length === 0 && (
        <div className="text-center py-12 animate-fade-in-up">
          <LifeBuoy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No tickets yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Submit your first support ticket to get started</p>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />New Ticket</Button>
        </div>
      )}

      {/* Kanban Board */}
      {tickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[400px]">
          {COLUMNS.map(col => {
            const colTickets = filtered.filter(t => t.status === col.id)
            const isOver = dragOverCol === col.id
            return (
              <div key={col.id}
                className={`flex flex-col rounded-lg border transition-all ${isOver ? 'border-cyan-400 bg-cyan-50/50 dark:bg-cyan-900/10 ring-2 ring-cyan-200' : 'border-border bg-muted/30'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id) }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${col.color}`} />
                    <span className="font-medium text-sm">{col.title}</span>
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">{colTickets.length}</Badge>
                  </div>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[600px]">
                  {colTickets.map(ticket => {
                    const isOverdue = ticket.due_date && new Date(ticket.due_date) < new Date() && !['resolved', 'closed'].includes(ticket.status)
                    return (
                      <div key={ticket.id} draggable onDragStart={(e) => handleDragStart(e, ticket)} onDragEnd={handleDragEnd}
                        onClick={() => openDetail(ticket)}
                        className={`group p-3 rounded-md border bg-card hover:shadow-md transition-all cursor-pointer hover-lift ${draggedId === ticket.id ? 'opacity-50' : ''} ${isOverdue ? 'border-red-300 dark:border-red-800' : 'border-border'}`}>
                        <div className="flex items-start gap-1">
                          {canManage(ticket) ? <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 cursor-grab" /> : <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0 mt-1" />}
                          <p className="text-sm font-medium flex-1 min-w-0">{ticket.subject}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CATEGORY_CONFIG[ticket.category]?.color}`}>{CATEGORY_CONFIG[ticket.category]?.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_CONFIG[ticket.priority]?.color}`}>{PRIORITY_CONFIG[ticket.priority]?.icon} {ticket.priority}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                          <span className="text-[10px] text-muted-foreground truncate">{ticket.assignee || 'Unassigned'}</span>
                          <div className="flex items-center gap-1">
                            {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
                            {ticket.due_date && <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}><Calendar className="h-3 w-3" />{new Date(ticket.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {colTickets.length === 0 && <div className="flex items-center justify-center h-16 text-xs text-muted-foreground border border-dashed rounded-md">Drop here</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}


      {/* Create Ticket Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              New Support Ticket
              {isAIConfigured() && <Button variant="outline" size="sm" onClick={aiCategorize} disabled={aiLoading || !form.subject}><Sparkles className="h-3 w-3 mr-1" />{aiLoading ? 'Thinking...' : 'AI Categorize'}</Button>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Subject *</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. VPN not connecting" /></div>
            <div className="space-y-2"><Label>Description</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the issue..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Category</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Priority</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Assign To</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={createTicket}>Submit Ticket</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailTicket} onOpenChange={() => setDetailTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg">{detailTicket.subject}</DialogTitle>
                  {canManage(detailTicket) && (
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { deleteTicket(detailTicket.id); setDetailTicket(null) }}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={CATEGORY_CONFIG[detailTicket.category]?.color}>{CATEGORY_CONFIG[detailTicket.category]?.label}</Badge>
                  <Badge className={PRIORITY_CONFIG[detailTicket.priority]?.color}>{detailTicket.priority}</Badge>
                  <Badge variant="secondary">{COLUMNS.find(c => c.id === detailTicket.status)?.title}</Badge>
                </div>
                {detailTicket.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailTicket.description}</p>}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Requester:</span> <span className="font-medium">{detailTicket.requester_name}</span></div>
                  <div><span className="text-muted-foreground">Assignee:</span> <span className="font-medium">{detailTicket.assignee || 'Unassigned'}</span></div>
                </div>

                {/* Admin/assignee controls */}
                {canManage(detailTicket) ? (
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40">
                    <div className="space-y-1"><Label className="text-xs">Status</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={detailTicket.status} onChange={e => { updateTicket(detailTicket.id, { status: e.target.value }); setDetailTicket({ ...detailTicket, status: e.target.value }) }}>
                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Assignee</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={detailTicket.assignee} onChange={e => { updateTicket(detailTicket.id, { assignee: e.target.value }); setDetailTicket({ ...detailTicket, assignee: e.target.value }) }}>
                        <option value="">Unassigned</option>
                        {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded bg-muted/40"><Lock className="h-3 w-3" />Only the assignee or a workspace admin can change status.</div>
                )}

                {/* AI assist */}
                {isAIConfigured() && canManage(detailTicket) && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={aiDraftReply} disabled={aiLoading}><Sparkles className="h-3 w-3 mr-1" />Draft Reply</Button>
                    <Button variant="outline" size="sm" onClick={aiSummarize} disabled={aiLoading}><Sparkles className="h-3 w-3 mr-1" />Summarize</Button>
                  </div>
                )}

                {/* Thread */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1"><MessageSquare className="h-4 w-4" />Conversation ({ticketReplies.length})</p>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {ticketReplies.map(r => (
                      <div key={r.id} className="flex gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[9px] text-white font-medium shrink-0">{r.author_name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2"><span className="text-xs font-medium">{r.author_name}</span><span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span></div>
                          <p className="text-sm mt-0.5 whitespace-pre-wrap">{r.content}</p>
                        </div>
                      </div>
                    ))}
                    {ticketReplies.length === 0 && <p className="text-xs text-muted-foreground">No replies yet. Start the conversation.</p>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Input placeholder="Write a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }} />
                    <Button size="sm" onClick={sendReply} disabled={!replyText.trim()}><Send className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
