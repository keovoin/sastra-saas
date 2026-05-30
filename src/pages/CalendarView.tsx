import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Calendar as CalIcon, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'custom' | 'milestone' | 'risk-review' | 'deal-followup' | 'task-due' | 'meeting'
  description: string
  color: string
}

const TYPE_COLORS: Record<CalendarEvent['type'], string> = {
  custom: 'bg-violet-500',
  milestone: 'bg-blue-500',
  'risk-review': 'bg-red-500',
  'deal-followup': 'bg-green-500',
  'task-due': 'bg-amber-500',
  meeting: 'bg-indigo-500',
}

const TYPE_LABELS: Record<CalendarEvent['type'], string> = {
  custom: 'Custom', milestone: 'Milestone', 'risk-review': 'Risk Review',
  'deal-followup': 'Deal Follow-up', 'task-due': 'Task Due', meeting: 'Meeting',
}


export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', date: '', type: 'custom' as CalendarEvent['type'], description: '' })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const createEvent = () => {
    if (!form.title.trim() || !form.date) { toast.error('Title and date required'); return }
    const ev: CalendarEvent = { id: crypto.randomUUID(), ...form, color: TYPE_COLORS[form.type] }
    setEvents(prev => [...prev, ev])
    setShowCreate(false)
    setForm({ title: '', date: '', type: 'custom', description: '' })
    toast.success('Event added')
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  const getDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : []


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10"><CalIcon className="h-6 w-6 text-indigo-600" /></div>
          <div><h1 className="text-2xl font-bold">Calendar</h1><p className="text-muted-foreground text-sm">Events from across all modules</p></div>
        </div>
        <Button onClick={() => { setForm(p => ({ ...p, date: today })); setShowCreate(true) }}><Plus className="h-4 w-4 mr-1" />Add Event</Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5"><div className={`h-2.5 w-2.5 rounded-full ${TYPE_COLORS[type as CalendarEvent['type']]}`} /><span className="text-xs text-muted-foreground">{label}</span></div>
        ))}
      </div>

      {/* Calendar Grid */}
      <Card className="card-glow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-lg font-semibold">{monthName}</h2>
            <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-px">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {days.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="min-h-[80px]" />
              const dateStr = getDateStr(day)
              const dayEvents = getEventsForDate(day)
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate
              return (
                <div key={i}
                  onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                  className={`min-h-[80px] p-1 border border-border/50 rounded cursor-pointer transition-colors hover:bg-accent/50 ${isToday ? 'bg-primary/5 border-primary/30' : ''} ${isSelected ? 'ring-2 ring-violet-400 bg-violet-50/50 dark:bg-violet-900/10' : ''}`}
                >
                  <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{day}</span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id} className={`text-[9px] px-1 py-0.5 rounded truncate text-white ${ev.color}`}>{ev.title}</div>
                    ))}
                    {dayEvents.length > 3 && <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 3} more</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>


      {/* Selected Date Events */}
      {selectedDate && (
        <Card className="animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Events on {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
              <Button variant="outline" size="sm" onClick={() => { setForm(p => ({ ...p, date: selectedDate })); setShowCreate(true) }}><Plus className="h-3 w-3 mr-1" />Add</Button>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events on this date</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                    <div className={`h-3 w-3 rounded-full ${ev.color}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ev.title}</p>
                      {ev.description && <p className="text-xs text-muted-foreground">{ev.description}</p>}
                    </div>
                    <Badge variant="secondary" className="text-xs">{TYPE_LABELS[ev.type]}</Badge>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEvents(prev => prev.filter(e => e.id !== ev.id)); toast.success('Event removed') }}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as CalendarEvent['type'] }))}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={createEvent}>Add Event</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
