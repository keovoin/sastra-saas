import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  KanbanSquare, Plus, Sparkles, GripVertical, Calendar,
  MessageSquare, Filter, Search, X, Edit2, Trash2, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAIJson } from '@/lib/ai'

// ─── Types ───────────────────────────────────────────────────────────────────
type Priority = 'P1' | 'P2' | 'P3' | 'P4'
type ColumnId = string

interface Comment {
  id: string
  author: string
  text: string
  date: string
}


interface TaskCard {
  id: string
  title: string
  description: string
  assignee: string
  priority: Priority
  labels: string[]
  dueDate: string
  comments: Comment[]
  columnId: ColumnId
  order: number
  createdAt: string
}

interface Column {
  id: ColumnId
  title: string
  color: string
}

const DEFAULT_COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog', color: 'bg-slate-500' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-500' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-amber-500' },
  { id: 'review', title: 'Review', color: 'bg-purple-500' },
  { id: 'done', title: 'Done', color: 'bg-green-500' },
]

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; icon: string }> = {
  P1: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '🔴' },
  P2: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: '🟠' },
  P3: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '🟡' },
  P4: { label: 'Low', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '🟢' },
}

const LABEL_COLORS = [
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
]


export function ProjectBoard() {
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS)
  const [tasks, setTasks] = useState<TaskCard[]>([
    { id: '1', title: 'Design new onboarding flow', description: 'Create wireframes and prototype for the user onboarding experience', assignee: 'Sarah Chen', priority: 'P1', labels: ['design', 'ux'], dueDate: '2025-04-15', comments: [{ id: 'c1', author: 'Marcus', text: 'Should we include social login?', date: '2025-03-20T10:00:00Z' }], columnId: 'in-progress', order: 0, createdAt: '2025-03-10T08:00:00Z' },
    { id: '2', title: 'Implement Stripe integration', description: 'Connect payment processing for Pro plan upgrades', assignee: 'James Park', priority: 'P1', labels: ['backend', 'payments'], dueDate: '2025-04-20', comments: [], columnId: 'todo', order: 0, createdAt: '2025-03-12T09:00:00Z' },
    { id: '3', title: 'Write API documentation', description: 'Document all REST endpoints for external developers', assignee: 'Emily Watson', priority: 'P3', labels: ['docs'], dueDate: '2025-04-30', comments: [], columnId: 'backlog', order: 0, createdAt: '2025-03-08T14:00:00Z' },
    { id: '4', title: 'Fix mobile nav overflow', description: 'Sidebar items overflow on small screens causing horizontal scroll', assignee: 'Alex Kim', priority: 'P2', labels: ['bug', 'frontend'], dueDate: '2025-04-10', comments: [], columnId: 'review', order: 0, createdAt: '2025-03-15T11:00:00Z' },
    { id: '5', title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment', assignee: 'James Park', priority: 'P2', labels: ['devops'], dueDate: '2025-04-18', comments: [], columnId: 'done', order: 0, createdAt: '2025-03-05T10:00:00Z' },
    { id: '6', title: 'Customer feedback survey', description: 'Design and send NPS survey to all active users', assignee: 'Lisa Thompson', priority: 'P3', labels: ['product'], dueDate: '2025-04-25', comments: [], columnId: 'todo', order: 1, createdAt: '2025-03-18T09:00:00Z' },
    { id: '7', title: 'Database optimization', description: 'Add indexes and optimize slow queries on risks/charters tables', assignee: 'Alex Kim', priority: 'P2', labels: ['backend', 'performance'], dueDate: '2025-04-12', comments: [{ id: 'c2', author: 'Sarah', text: 'Query times are 3x slower since last deploy', date: '2025-03-22T14:30:00Z' }], columnId: 'in-progress', order: 1, createdAt: '2025-03-14T16:00:00Z' },
    { id: '8', title: 'Landing page A/B test', description: 'Test two hero variants for conversion rate improvement', assignee: 'Sarah Chen', priority: 'P4', labels: ['marketing'], dueDate: '2025-05-01', comments: [], columnId: 'backlog', order: 1, createdAt: '2025-03-20T10:00:00Z' },
    { id: '9', title: 'Security audit fixes', description: 'Address findings from Q1 penetration test report', assignee: 'Marcus Rivera', priority: 'P1', labels: ['security', 'compliance'], dueDate: '2025-04-08', comments: [], columnId: 'in-progress', order: 2, createdAt: '2025-03-11T08:00:00Z' },
    { id: '10', title: 'Dark mode polish', description: 'Fix contrast issues in charts and cards in dark mode', assignee: 'Emily Watson', priority: 'P4', labels: ['frontend', 'design'], dueDate: '2025-05-10', comments: [], columnId: 'backlog', order: 2, createdAt: '2025-03-22T11:00:00Z' },
    { id: '11', title: 'Email notification system', description: 'Set up transactional emails for invites, risk alerts, and task assignments', assignee: 'James Park', priority: 'P2', labels: ['backend', 'notifications'], dueDate: '2025-04-22', comments: [], columnId: 'todo', order: 2, createdAt: '2025-03-19T13:00:00Z' },
    { id: '12', title: 'Competitor analysis Q2', description: 'Research and document competitor feature updates and pricing changes', assignee: 'Lisa Thompson', priority: 'P3', labels: ['research', 'strategy'], dueDate: '2025-04-28', comments: [], columnId: 'backlog', order: 3, createdAt: '2025-03-21T09:00:00Z' },
  ])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskCard | null>(null)
  const [detailTask, setDetailTask] = useState<TaskCard | null>(null)
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('')
  const [filterLabel, setFilterLabel] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '', description: '', assignee: '', priority: 'P3' as Priority,
    labels: '' , dueDate: '', columnId: 'todo',
  })


  // ─── Drag & Drop Handlers ────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
    const el = e.currentTarget as HTMLElement
    el.style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement
    el.style.opacity = '1'
    setDraggedTaskId(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, columnId } : t
      ))
      const task = tasks.find(t => t.id === taskId)
      if (task && task.columnId !== columnId) {
        const col = columns.find(c => c.id === columnId)
        toast.success(`Moved "${task.title}" to ${col?.title}`)
      }
    }
    setDragOverColumn(null)
    setDraggedTaskId(null)
  }


  // ─── CRUD ──────────────────────────────────────────────────────────────────
  const createTask = () => {
    if (!newTask.title.trim()) { toast.error('Title is required'); return }
    const task: TaskCard = {
      id: crypto.randomUUID(),
      title: newTask.title.trim(),
      description: newTask.description,
      assignee: newTask.assignee,
      priority: newTask.priority,
      labels: newTask.labels ? newTask.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
      dueDate: newTask.dueDate,
      comments: [],
      columnId: newTask.columnId,
      order: tasks.filter(t => t.columnId === newTask.columnId).length,
      createdAt: new Date().toISOString(),
    }
    setTasks(prev => [...prev, task])
    setNewTask({ title: '', description: '', assignee: '', priority: 'P3', labels: '', dueDate: '', columnId: 'todo' })
    setShowCreateDialog(false)
    toast.success(`Task "${task.title}" created`)
  }

  const updateTask = () => {
    if (!editingTask) return
    setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t))
    if (detailTask?.id === editingTask.id) setDetailTask(editingTask)
    setEditingTask(null)
    toast.success('Task updated')
  }

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    setDetailTask(null)
    setEditingTask(null)
    toast.success('Task deleted')
  }

  const addComment = () => {
    if (!detailTask || !newComment.trim()) return
    const comment: Comment = {
      id: crypto.randomUUID(),
      author: 'You',
      text: newComment.trim(),
      date: new Date().toISOString(),
    }
    const updated = { ...detailTask, comments: [...detailTask.comments, comment] }
    setDetailTask(updated)
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    setNewComment('')
  }


  // ─── AI Integration ────────────────────────────────────────────────────────
  const aiBreakdown = async () => {
    if (!detailTask) return
    setAiLoading(true)
    const result = await askAIJson<{ subtasks: string[] }>(
      `Break this task into 3-5 actionable subtasks:\nTitle: ${detailTask.title}\nDescription: ${detailTask.description}\nReturn JSON: {"subtasks": ["subtask 1", "subtask 2", ...]}`
    )
    setAiLoading(false)
    if (result.success && result.data?.subtasks) {
      const newTasks = result.data.subtasks.map((title, i) => ({
        id: crypto.randomUUID(),
        title,
        description: `Subtask of: ${detailTask.title}`,
        assignee: detailTask.assignee,
        priority: detailTask.priority,
        labels: detailTask.labels,
        dueDate: detailTask.dueDate,
        comments: [],
        columnId: detailTask.columnId,
        order: tasks.length + i,
        createdAt: new Date().toISOString(),
      }))
      setTasks(prev => [...prev, ...newTasks])
      toast.success(`Created ${newTasks.length} subtasks`)
    } else {
      toast.error(result.error || 'Failed to generate subtasks')
    }
  }

  const aiSuggestPriority = async () => {
    if (!editingTask && !detailTask) return
    const task = editingTask || detailTask!
    setAiLoading(true)
    const result = await askAIJson<{ priority: Priority; reason: string }>(
      `Suggest priority (P1=Critical, P2=High, P3=Medium, P4=Low) for this task:\nTitle: ${task.title}\nDescription: ${task.description}\nReturn JSON: {"priority": "P1"|"P2"|"P3"|"P4", "reason": "brief explanation"}`
    )
    setAiLoading(false)
    if (result.success && result.data) {
      if (editingTask) setEditingTask({ ...editingTask, priority: result.data.priority })
      toast.success(`AI suggests ${result.data.priority}: ${result.data.reason}`)
    } else {
      toast.error(result.error || 'AI suggestion failed')
    }
  }


  // ─── Filters ───────────────────────────────────────────────────────────────
  const filteredTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterAssignee && t.assignee.toLowerCase() !== filterAssignee.toLowerCase()) return false
    if (filterPriority && t.priority !== filterPriority) return false
    if (filterLabel && !t.labels.some(l => l.toLowerCase().includes(filterLabel.toLowerCase()))) return false
    return true
  })

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const totalTasks = tasks.length
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.columnId !== 'done').length
  const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))]
  const priorityCounts = { P1: tasks.filter(t => t.priority === 'P1').length, P2: tasks.filter(t => t.priority === 'P2').length, P3: tasks.filter(t => t.priority === 'P3').length, P4: tasks.filter(t => t.priority === 'P4').length }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <KanbanSquare className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Project Board</h1>
            <p className="text-muted-foreground text-sm">Manage tasks with drag-and-drop Kanban</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-1" /> Filters
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Task
          </Button>
        </div>
      </div>


      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="card-glow">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Tasks</p>
            <p className="text-2xl font-bold">{totalTasks}</p>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Team Members</p>
            <p className="text-2xl font-bold">{assignees.length}</p>
          </CardContent>
        </Card>
        <Card className="card-glow">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">By Priority</p>
            <div className="flex gap-1 mt-1">
              {Object.entries(priorityCounts).map(([p, c]) => (
                <span key={p} className="text-xs">{PRIORITY_CONFIG[p as Priority].icon}{c}</span>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className={`card-glow ${overdueTasks > 0 ? 'border-red-300 dark:border-red-800' : ''}`}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className={`text-2xl font-bold ${overdueTasks > 0 ? 'text-red-500' : ''}`}>{overdueTasks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="animate-fade-in-up">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <Input placeholder="Filter by assignee" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} />
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={filterPriority} onChange={e => setFilterPriority(e.target.value as Priority | '')}>
                <option value="">All Priorities</option>
                <option value="P1">P1 - Critical</option>
                <option value="P2">P2 - High</option>
                <option value="P3">P3 - Medium</option>
                <option value="P4">P4 - Low</option>
              </select>
              <Input placeholder="Filter by label" value={filterLabel} onChange={e => setFilterLabel(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}


      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[500px]">
        {columns.map(column => {
          const colTasks = filteredTasks.filter(t => t.columnId === column.id)
          const isDragOver = dragOverColumn === column.id
          return (
            <div key={column.id}
              className={`flex flex-col rounded-lg border transition-all duration-200 ${isDragOver ? 'border-violet-400 bg-violet-50/50 dark:bg-violet-900/10 ring-2 ring-violet-200' : 'border-border bg-muted/30'}`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${column.color}`} />
                  <span className="font-medium text-sm">{column.title}</span>
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">{colTasks.length}</Badge>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[600px]">
                {colTasks.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border border-dashed rounded-md">
                    Drop tasks here
                  </div>
                )}
                {colTasks.map(task => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.columnId !== 'done'
                  return (
                    <div key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setDetailTask(task)}
                      className={`group p-3 rounded-md border bg-card hover:shadow-md transition-all cursor-pointer hover-lift ${draggedTaskId === task.id ? 'opacity-50' : ''} ${isOverdue ? 'border-red-300 dark:border-red-800' : 'border-border'}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      )}


                      {/* Labels */}
                      {task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.labels.slice(0, 3).map((label, i) => (
                            <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full ${LABEL_COLORS[i % LABEL_COLORS.length]}`}>{label}</span>
                          ))}
                        </div>
                      )}
                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_CONFIG[task.priority].color}`}>{task.priority}</span>
                          {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        </div>
                        <div className="flex items-center gap-2">
                          {task.dueDate && (
                            <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                              <Calendar className="h-3 w-3" />{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          {task.assignee && (
                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-[9px] text-white font-medium">
                              {task.assignee.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                          )}
                          {task.comments.length > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <MessageSquare className="h-3 w-3" />{task.comments.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>


      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="Task title" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Describe the task..." value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Input placeholder="Name" value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as Priority }))}>
                  <option value="P1">P1 - Critical</option>
                  <option value="P2">P2 - High</option>
                  <option value="P3">P3 - Medium</option>
                  <option value="P4">P4 - Low</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Column</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newTask.columnId} onChange={e => setNewTask(p => ({ ...p, columnId: e.target.value }))}>
                  {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Labels (comma-separated)</Label>
              <Input placeholder="bug, frontend, urgent" value={newTask.labels} onChange={e => setNewTask(p => ({ ...p, labels: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={createTask}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Task Detail Dialog */}
      <Dialog open={!!detailTask} onOpenChange={() => setDetailTask(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {detailTask && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">{detailTask.title}</DialogTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingTask(detailTask); setDetailTask(null) }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => deleteTask(detailTask.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={PRIORITY_CONFIG[detailTask.priority].color}>{detailTask.priority} - {PRIORITY_CONFIG[detailTask.priority].label}</Badge>
                  <Badge variant="secondary">{columns.find(c => c.id === detailTask.columnId)?.title}</Badge>
                  {detailTask.labels.map((l, i) => (
                    <Badge key={i} className={LABEL_COLORS[i % LABEL_COLORS.length]}>{l}</Badge>
                  ))}
                </div>
                {detailTask.description && (
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailTask.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Assignee:</span> <span className="font-medium">{detailTask.assignee || 'Unassigned'}</span></div>
                  <div><span className="text-muted-foreground">Due:</span> <span className="font-medium">{detailTask.dueDate ? new Date(detailTask.dueDate).toLocaleDateString() : 'No date'}</span></div>
                  <div><span className="text-muted-foreground">Created:</span> <span className="font-medium">{new Date(detailTask.createdAt).toLocaleDateString()}</span></div>
                </div>

                {/* AI Actions */}
                {isAIConfigured() && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={aiBreakdown} disabled={aiLoading}>
                      <Sparkles className="h-3 w-3 mr-1" />{aiLoading ? 'Thinking...' : 'Break into Subtasks'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={aiSuggestPriority} disabled={aiLoading}>
                      <Sparkles className="h-3 w-3 mr-1" />Suggest Priority
                    </Button>
                  </div>
                )}


                {/* Comments */}
                <div>
                  <p className="text-sm font-medium mb-2">Comments ({detailTask.comments.length})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {detailTask.comments.map(c => (
                      <div key={c.id} className="p-2 rounded bg-muted/50 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-xs">{c.author}</span>
                          <span className="text-xs text-muted-foreground">{new Date(c.date).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-1 text-muted-foreground">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} />
                    <Button size="sm" onClick={addComment}>Post</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="max-w-lg">
          {editingTask && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editingTask.description} onChange={e => setEditingTask({ ...editingTask, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Input value={editingTask.assignee} onChange={e => setEditingTask({ ...editingTask, assignee: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editingTask.priority} onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as Priority })}>
                      <option value="P1">P1 - Critical</option>
                      <option value="P2">P2 - High</option>
                      <option value="P3">P3 - Medium</option>
                      <option value="P4">P4 - Low</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={editingTask.dueDate} onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Column</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editingTask.columnId} onChange={e => setEditingTask({ ...editingTask, columnId: e.target.value })}>
                      {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Labels (comma-separated)</Label>
                  <Input value={editingTask.labels.join(', ')} onChange={e => setEditingTask({ ...editingTask, labels: e.target.value.split(',').map(l => l.trim()).filter(Boolean) })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
                {isAIConfigured() && <Button variant="outline" onClick={aiSuggestPriority} disabled={aiLoading}><Sparkles className="h-3 w-3 mr-1" />AI Priority</Button>}
                <Button onClick={updateTask}>Save Changes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-12 animate-fade-in-up">
          <KanbanSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No tasks yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first task to get started with the project board</p>
          <Button onClick={() => setShowCreateDialog(true)}><Plus className="h-4 w-4 mr-1" /> Create First Task</Button>
        </div>
      )}
    </div>
  )
}
