import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Swords, Globe, DollarSign, Users, Trash2, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAIJson } from '@/lib/ai'

interface Competitor { id: string; name: string; website: string; funding: string; employees: string; threat: 'Low' | 'Medium' | 'High'; strengths: string[]; weaknesses: string[]; scores: Record<string, number> }

const dimensions = ['Product', 'Pricing', 'UX/Design', 'Market Reach', 'Support', 'Innovation']
const defaultCompetitors: Competitor[] = [
  { id: '1', name: 'StrategyHub', website: 'strategyhub.io', funding: '$25M Series B', employees: '120', threat: 'High', strengths: ['Strong enterprise brand', 'ISO 27001 certified'], weaknesses: ['Slow iteration', 'No AI features'], scores: { Product: 7, Pricing: 5, 'UX/Design': 6, 'Market Reach': 8, Support: 7, Innovation: 4 } },
  { id: '2', name: 'RiskMatrix Pro', website: 'riskmatrix.com', funding: '$8M Series A', employees: '45', threat: 'Medium', strengths: ['Best risk module', 'SOC 2 compliant'], weaknesses: ['No strategy tools', 'Dated UI'], scores: { Product: 6, Pricing: 7, 'UX/Design': 4, 'Market Reach': 5, Support: 6, Innovation: 5 } },
  { id: '3', name: 'OKRBoard', website: 'okrboard.app', funding: '$3M Seed', employees: '18', threat: 'Low', strengths: ['Beautiful UI', 'Free tier'], weaknesses: ['OKR-only scope', 'No enterprise'], scores: { Product: 5, Pricing: 9, 'UX/Design': 9, 'Market Reach': 4, Support: 5, Innovation: 7 } },
]
const threatColors: Record<string, string> = { Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', High: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' }

export function CompetitorTracker() {
  const [competitors, setCompetitors] = useState<Competitor[]>(defaultCompetitors)
  const [selected, setSelected] = useState<Competitor | null>(null)
  const [addModal, setAddModal] = useState(false)
  const [newName, setNewName] = useState(''); const [newWebsite, setNewWebsite] = useState(''); const [newFunding, setNewFunding] = useState(''); const [newEmployees, setNewEmployees] = useState(''); const [newThreat, setNewThreat] = useState<'Low'|'Medium'|'High'>('Medium')
  const [isAILoading, setIsAILoading] = useState(false)
  const myScores: Record<string, number> = { Product: 8, Pricing: 7, 'UX/Design': 9, 'Market Reach': 5, Support: 7, Innovation: 9 }

  const handleAIAnalyze = async (comp: Competitor) => {
    setIsAILoading(true)
    const result = await askAIJson<{ strengths: string[]; weaknesses: string[]; scores: Record<string, number> }>(
      `Analyze the competitor "${comp.name}" (${comp.website}) in the SaaS/business tools space.
Their funding: ${comp.funding}, team size: ${comp.employees}.
Provide 2-3 strengths, 2-3 weaknesses, and rate them 1-10 on: Product, Pricing, UX/Design, Market Reach, Support, Innovation.
Format: {"strengths": ["..."], "weaknesses": ["..."], "scores": {"Product": 7, "Pricing": 5, ...}}`
    )
    setIsAILoading(false)
    if (result.success && result.data) {
      setCompetitors((prev) => prev.map((c) => c.id === comp.id ? { ...c, strengths: result.data!.strengths || c.strengths, weaknesses: result.data!.weaknesses || c.weaknesses, scores: result.data!.scores || c.scores } : c))
      if (selected?.id === comp.id) setSelected((prev) => prev ? { ...prev, strengths: result.data!.strengths || prev.strengths, weaknesses: result.data!.weaknesses || prev.weaknesses, scores: result.data!.scores || prev.scores } : null)
      toast.success(`AI analysis complete for ${comp.name}`)
    } else { toast.error('AI analysis failed', { description: result.error }) }
  }

  const handleAdd = () => { if (!newName.trim()) return; setCompetitors((prev) => [...prev, { id: Date.now().toString(), name: newName, website: newWebsite, funding: newFunding || 'Unknown', employees: newEmployees || 'Unknown', threat: newThreat, strengths: [], weaknesses: [], scores: { Product: 5, Pricing: 5, 'UX/Design': 5, 'Market Reach': 5, Support: 5, Innovation: 5 } }]); setAddModal(false); setNewName(''); toast.success(`${newName} added`) }
  const updateScore = (compId: string, dim: string, value: number) => { setCompetitors((prev) => prev.map((c) => c.id === compId ? { ...c, scores: { ...c.scores, [dim]: value } } : c)); if (selected?.id === compId) setSelected((prev) => prev ? { ...prev, scores: { ...prev.scores, [dim]: value } } : null) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Swords className="h-6 w-6 text-rose-600" /> Competitor Tracker</h1><p className="mt-1 text-sm text-muted-foreground">Monitor competitors and compare capabilities.</p></div><Button onClick={() => setAddModal(true)} className="gap-2"><Plus className="h-4 w-4" /> Add</Button></div>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Feature Comparison (1-10)</CardTitle></CardHeader><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/30"><th className="px-4 py-3 text-left">Dimension</th><th className="px-4 py-3 text-center text-indigo-600 font-bold">Sastra</th>{competitors.map((c) => (<th key={c.id} className="px-4 py-3 text-center">{c.name}</th>))}</tr></thead><tbody>{dimensions.map((dim) => (<tr key={dim} className="border-b border-border"><td className="px-4 py-3 font-medium">{dim}</td><td className="px-4 py-3 text-center"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">{myScores[dim]}</span></td>{competitors.map((c) => (<td key={c.id} className="px-4 py-3 text-center"><span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${c.scores[dim] >= myScores[dim] ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'}`}>{c.scores[dim]}</span></td>))}</tr>))}</tbody></table></CardContent></Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{competitors.map((comp) => (<Card key={comp.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(comp)}><CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base">{comp.name}</CardTitle><Badge className={`text-[10px] ${threatColors[comp.threat]}`}>{comp.threat}</Badge></div><CardDescription><Globe className="inline h-3 w-3 mr-1" />{comp.website}</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span><DollarSign className="inline h-3 w-3" />{comp.funding}</span><span><Users className="inline h-3 w-3" />{comp.employees}</span></div>{isAIConfigured() && (<Button variant="outline" size="sm" className="w-full mt-3 gap-1 text-xs" onClick={(e) => { e.stopPropagation(); handleAIAnalyze(comp) }} disabled={isAILoading}>{isAILoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-amber-500" />}AI Analyze</Button>)}</CardContent></Card>))}</div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{selected?.name}</DialogTitle><DialogDescription>{selected?.website} • {selected?.funding}</DialogDescription></DialogHeader>{selected && (<div className="space-y-3 py-2"><p className="text-xs font-semibold uppercase text-muted-foreground">Scores (click to update)</p>{dimensions.map((dim) => (<div key={dim} className="flex items-center gap-3"><span className="text-sm w-24">{dim}</span><div className="flex gap-1">{[1,2,3,4,5,6,7,8,9,10].map((n) => (<button key={n} onClick={() => updateScore(selected.id, dim, n)} className={`h-6 w-6 rounded text-[10px] font-medium ${selected.scores[dim] >= n ? 'bg-indigo-500 text-white' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>{n}</button>))}</div></div>))}{selected.strengths.length > 0 && (<div><p className="text-xs font-semibold uppercase text-muted-foreground mt-2">Strengths</p>{selected.strengths.map((s,i) => (<p key={i} className="text-sm text-emerald-600">+ {s}</p>))}</div>)}{selected.weaknesses.length > 0 && (<div><p className="text-xs font-semibold uppercase text-muted-foreground mt-2">Weaknesses</p>{selected.weaknesses.map((w,i) => (<p key={i} className="text-sm text-red-600">- {w}</p>))}</div>)}</div>)}<DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Close</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={addModal} onOpenChange={setAddModal}><DialogContent><DialogHeader><DialogTitle>Add Competitor</DialogTitle><DialogDescription>Track a new competitor.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label>Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Acme Corp" /></div><div className="space-y-2"><Label>Website</Label><Input value={newWebsite} onChange={(e) => setNewWebsite(e.target.value)} placeholder="acme.com" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Funding</Label><Input value={newFunding} onChange={(e) => setNewFunding(e.target.value)} placeholder="$10M" /></div><div className="space-y-2"><Label>Team Size</Label><Input value={newEmployees} onChange={(e) => setNewEmployees(e.target.value)} placeholder="50" /></div></div><div className="space-y-2"><Label>Threat</Label><div className="flex gap-2">{(['Low','Medium','High'] as const).map((t) => (<button key={t} onClick={() => setNewThreat(t)} className={`rounded-md border px-4 py-2 text-sm font-medium ${newThreat === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'}`}>{t}</button>))}</div></div></div><DialogFooter><Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button><Button onClick={handleAdd} disabled={!newName.trim()}>Add</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
