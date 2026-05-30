import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Users2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'


interface Stakeholder { id: string; name: string; role: string; power: number; interest: number; strategy: string }

const quadrantLabel = (power: number, interest: number): string => {
  if (power >= 5 && interest >= 5) return 'Manage Closely'
  if (power >= 5 && interest < 5) return 'Keep Satisfied'
  if (power < 5 && interest >= 5) return 'Keep Informed'
  return 'Monitor'
}
const quadrantColor = (power: number, interest: number): string => {
  if (power >= 5 && interest >= 5) return 'bg-red-500'
  if (power >= 5 && interest < 5) return 'bg-amber-500'
  if (power < 5 && interest >= 5) return 'bg-blue-500'
  return 'bg-slate-400'
}

const defaultStakeholders: Stakeholder[] = [
  { id: '1', name: 'Board of Directors', role: 'Governance', power: 9, interest: 8, strategy: 'Monthly reports, quarterly board meetings' },
  { id: '2', name: 'Key Investors (VC)', role: 'Funding', power: 8, interest: 9, strategy: 'Bi-weekly updates, involve in strategic decisions' },
  { id: '3', name: 'Enterprise Customers', role: 'Revenue', power: 7, interest: 7, strategy: 'Dedicated CSM, quarterly business reviews' },
  { id: '4', name: 'Engineering Team', role: 'Delivery', power: 6, interest: 8, strategy: 'Sprint demos, architecture decision involvement' },
  { id: '5', name: 'Regulators', role: 'Compliance', power: 8, interest: 3, strategy: 'Proactive compliance reports, annual audits' },
  { id: '6', name: 'Media/Analysts', role: 'Perception', power: 4, interest: 5, strategy: 'Press releases, analyst briefings quarterly' },
  { id: '7', name: 'Competitors', role: 'Market', power: 3, interest: 4, strategy: 'Monitor product launches, pricing changes' },
  { id: '8', name: 'Community/Users', role: 'Feedback', power: 3, interest: 7, strategy: 'Public roadmap, community forum engagement' },
]


export function StakeholderMap() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(defaultStakeholders)
  const [addModal, setAddModal] = useState(false)
  const [newName, setNewName] = useState(''); const [newRole, setNewRole] = useState(''); const [newPower, setNewPower] = useState(5); const [newInterest, setNewInterest] = useState(5); const [newStrategy, setNewStrategy] = useState('')

  const handleAdd = () => { if (!newName.trim()) return; setStakeholders((prev) => [...prev, { id: Date.now().toString(), name: newName, role: newRole, power: newPower, interest: newInterest, strategy: newStrategy }]); setAddModal(false); setNewName(''); setNewRole(''); setNewPower(5); setNewInterest(5); setNewStrategy(''); toast.success('Stakeholder added') }
  const handleDelete = (id: string) => { setStakeholders((prev) => prev.filter((s) => s.id !== id)); toast.success('Removed') }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Users2 className="h-6 w-6 text-purple-600" /> Stakeholder Map</h1><p className="mt-1 text-sm text-muted-foreground">Map stakeholders by power and interest to define engagement strategy.</p></div><Button onClick={() => setAddModal(true)} className="gap-2"><Plus className="h-4 w-4" /> Add</Button></div>

      {/* Power/Interest Grid */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Power / Interest Grid</CardTitle></CardHeader>
        <CardContent>
          <div className="relative w-full aspect-square max-w-lg mx-auto border border-border rounded-lg overflow-hidden">
            {/* Quadrant backgrounds */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="bg-amber-500/5 border-r border-b border-border flex items-center justify-center"><span className="text-xs font-medium text-amber-600 opacity-60">Keep Satisfied</span></div>
              <div className="bg-red-500/5 border-b border-border flex items-center justify-center"><span className="text-xs font-medium text-red-600 opacity-60">Manage Closely</span></div>
              <div className="bg-slate-500/5 border-r border-border flex items-center justify-center"><span className="text-xs font-medium text-muted-foreground opacity-60">Monitor</span></div>
              <div className="bg-blue-500/5 flex items-center justify-center"><span className="text-xs font-medium text-blue-600 opacity-60">Keep Informed</span></div>
            </div>
            {/* Axis labels */}
            <div className="absolute -left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-muted-foreground">POWER →</div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground">INTEREST →</div>
            {/* Dots */}
            {stakeholders.map((s) => (
              <div key={s.id} className="absolute group" style={{ left: `${(s.interest / 10) * 100}%`, bottom: `${(s.power / 10) * 100}%`, transform: 'translate(-50%, 50%)' }}>
                <div className={`h-4 w-4 rounded-full ${quadrantColor(s.power, s.interest)} ring-2 ring-background shadow-sm cursor-pointer`} title={s.name} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-card border border-border rounded px-2 py-1 shadow-lg whitespace-nowrap z-10">
                  <p className="text-xs font-medium">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.role}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Stakeholder List */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">All Stakeholders</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">{stakeholders.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${quadrantColor(s.power, s.interest)}`} />
                <div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.role} • Power: {s.power}/10 • Interest: {s.interest}/10</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{quadrantLabel(s.power, s.interest)}</Badge>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}</div>
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Dialog open={addModal} onOpenChange={setAddModal}><DialogContent><DialogHeader><DialogTitle>Add Stakeholder</DialogTitle><DialogDescription>Map a new stakeholder on the power/interest grid.</DialogDescription></DialogHeader><div className="space-y-4 py-4">
        <div className="space-y-2"><Label>Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Board of Directors" /></div>
        <div className="space-y-2"><Label>Role/Category</Label><Input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="e.g., Governance" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Power (1-10): {newPower}</Label><input type="range" min={1} max={10} value={newPower} onChange={(e) => setNewPower(Number(e.target.value))} className="w-full" /></div>
          <div className="space-y-2"><Label>Interest (1-10): {newInterest}</Label><input type="range" min={1} max={10} value={newInterest} onChange={(e) => setNewInterest(Number(e.target.value))} className="w-full" /></div>
        </div>
        <div className="space-y-2"><Label>Engagement Strategy</Label><Input value={newStrategy} onChange={(e) => setNewStrategy(e.target.value)} placeholder="How to engage this stakeholder..." /></div>
      </div><DialogFooter><Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button><Button onClick={handleAdd} disabled={!newName.trim()}>Add</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}


export function StakeholderMap() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(defaultStakeholders)
  const [addModal, setAddModal] = useState(false)
  const [newName, setNewName] = useState(''); const [newRole, setNewRole] = useState(''); const [newPower, setNewPower] = useState(5); const [newInterest, setNewInterest] = useState(5); const [newStrategy, setNewStrategy] = useState('')

  const handleAdd = () => { if (!newName.trim()) return; setStakeholders((prev) => [...prev, { id: Date.now().toString(), name: newName, role: newRole, power: newPower, interest: newInterest, strategy: newStrategy }]); setAddModal(false); setNewName(''); setNewRole(''); setNewPower(5); setNewInterest(5); setNewStrategy(''); toast.success('Stakeholder added') }
  const handleDelete = (id: string) => { setStakeholders((prev) => prev.filter((s) => s.id !== id)); toast.success('Removed') }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Users2 className="h-6 w-6 text-purple-600" /> Stakeholder Map</h1><p className="mt-1 text-sm text-muted-foreground">Map stakeholders by power and interest.</p></div><Button onClick={() => setAddModal(true)} className="gap-2"><Plus className="h-4 w-4" /> Add</Button></div>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Power / Interest Grid</CardTitle></CardHeader><CardContent>
        <div className="relative w-full aspect-square max-w-lg mx-auto border border-border rounded-lg overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2"><div className="bg-amber-500/5 border-r border-b border-border flex items-center justify-center"><span className="text-[10px] font-medium text-amber-600/60">Keep Satisfied</span></div><div className="bg-red-500/5 border-b border-border flex items-center justify-center"><span className="text-[10px] font-medium text-red-600/60">Manage Closely</span></div><div className="bg-slate-500/5 border-r border-border flex items-center justify-center"><span className="text-[10px] font-medium text-muted-foreground/60">Monitor</span></div><div className="bg-blue-500/5 flex items-center justify-center"><span className="text-[10px] font-medium text-blue-600/60">Keep Informed</span></div></div>
          {stakeholders.map((s) => (<div key={s.id} className="absolute group" style={{ left: `${(s.interest/10)*100}%`, bottom: `${(s.power/10)*100}%`, transform: 'translate(-50%, 50%)' }}><div className={`h-4 w-4 rounded-full ${quadrantColor(s.power, s.interest)} ring-2 ring-background shadow-sm`} title={s.name} /><div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-card border border-border rounded px-2 py-1 shadow-lg whitespace-nowrap z-10"><p className="text-xs font-medium">{s.name}</p><p className="text-[10px] text-muted-foreground">{s.role}</p></div></div>))}
        </div>
      </CardContent></Card>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base">All Stakeholders</CardTitle></CardHeader><CardContent className="p-0"><div className="divide-y divide-border">{stakeholders.map((s) => (<div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30"><div className="flex items-center gap-3"><div className={`h-3 w-3 rounded-full ${quadrantColor(s.power, s.interest)}`} /><div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.role} • P:{s.power} I:{s.interest}</p></div></div><div className="flex items-center gap-2"><Badge variant="secondary" className="text-[10px]">{quadrantLabel(s.power, s.interest)}</Badge><Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button></div></div>))}</div></CardContent></Card>

      <Dialog open={addModal} onOpenChange={setAddModal}><DialogContent><DialogHeader><DialogTitle>Add Stakeholder</DialogTitle><DialogDescription>Map on the power/interest grid.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label>Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Board of Directors" /></div><div className="space-y-2"><Label>Role</Label><Input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Governance" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Power: {newPower}</Label><input type="range" min={1} max={10} value={newPower} onChange={(e) => setNewPower(Number(e.target.value))} className="w-full" /></div><div className="space-y-2"><Label>Interest: {newInterest}</Label><input type="range" min={1} max={10} value={newInterest} onChange={(e) => setNewInterest(Number(e.target.value))} className="w-full" /></div></div></div><DialogFooter><Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button><Button onClick={handleAdd} disabled={!newName.trim()}>Add</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
