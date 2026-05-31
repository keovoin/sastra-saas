import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowRightLeft, Plus, TrendingUp, Building2, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Movement {
  id: string
  date: string
  employeeName: string
  type: 'promotion' | 'transfer' | 'role-change'
  fromRole: string
  fromDept: string
  toRole: string
  toDept: string
  approvedBy: string
  notes: string
}

const TYPE_CONFIG = {
  promotion: { label: 'Promotion', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  transfer: { label: 'Transfer', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  'role-change': { label: 'Role Change', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}


export function EmployeeMovement() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ employeeName: '', type: 'promotion' as Movement['type'], fromRole: '', fromDept: '', toRole: '', toDept: '', approvedBy: '', notes: '', date: '' })

  const create = () => {
    if (!form.employeeName.trim()) { toast.error('Employee name required'); return }
    const m: Movement = { id: crypto.randomUUID(), ...form, date: form.date || new Date().toISOString().split('T')[0] }
    setMovements(prev => [m, ...prev])
    setShowCreate(false)
    setForm({ employeeName: '', type: 'promotion', fromRole: '', fromDept: '', toRole: '', toDept: '', approvedBy: '', notes: '', date: '' })
    toast.success('Movement recorded')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10"><ArrowRightLeft className="h-6 w-6 text-indigo-600" /></div>
          <div><h1 className="text-2xl font-bold">Employee Movements</h1><p className="text-muted-foreground text-sm">Track promotions, transfers, and role changes</p></div>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />Log Movement</Button>
      </div>

      {movements.length === 0 && (
        <div className="text-center py-12 animate-fade-in-up">
          <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No movements recorded</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Log promotions, transfers, and role changes</p>
          <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />Log First Movement</Button>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {movements.length > 0 && <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />}
        <div className="space-y-4">
          {movements.map(m => (
            <div key={m.id} className="flex gap-4 animate-fade-in-up">
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-card border border-border">
                <TrendingUp className="h-5 w-5 text-violet-500" />
              </div>
              <Card className="flex-1 card-glow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{m.employeeName}</p>
                      <Badge className={`mt-1 ${TYPE_CONFIG[m.type].color}`}>{TYPE_CONFIG[m.type].label}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{m.date}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="font-medium">{m.fromRole || '—'}</p>
                      <p className="text-xs text-muted-foreground">{m.fromDept}</p>
                    </div>
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="p-2 rounded bg-primary/5">
                      <p className="text-xs text-muted-foreground">To</p>
                      <p className="font-medium">{m.toRole || '—'}</p>
                      <p className="text-xs text-muted-foreground">{m.toDept}</p>
                    </div>
                  </div>
                  {m.approvedBy && <p className="text-xs text-muted-foreground mt-2">Approved by: {m.approvedBy}</p>}
                  {m.notes && <p className="text-xs text-muted-foreground mt-1 italic">{m.notes}</p>}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>


      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Employee Movement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Employee Name *</Label><Input value={form.employeeName} onChange={e => setForm(p => ({ ...p, employeeName: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Movement['type'] }))}>
                  <option value="promotion">Promotion</option><option value="transfer">Transfer</option><option value="role-change">Role Change</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>From Role</Label><Input value={form.fromRole} onChange={e => setForm(p => ({ ...p, fromRole: e.target.value }))} /></div>
              <div className="space-y-2"><Label>To Role</Label><Input value={form.toRole} onChange={e => setForm(p => ({ ...p, toRole: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>From Department</Label><Input value={form.fromDept} onChange={e => setForm(p => ({ ...p, fromDept: e.target.value }))} /></div>
              <div className="space-y-2"><Label>To Department</Label><Input value={form.toDept} onChange={e => setForm(p => ({ ...p, toDept: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Approved By</Label><Input value={form.approvedBy} onChange={e => setForm(p => ({ ...p, approvedBy: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={create}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
