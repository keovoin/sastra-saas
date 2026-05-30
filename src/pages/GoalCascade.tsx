import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, GitBranch, ChevronDown, ChevronRight, Target, Layers, Zap } from 'lucide-react'
import { toast } from 'sonner'


interface GoalNode { id: string; title: string; level: 'vision' | 'goal' | 'initiative' | 'task'; parentId: string | null; progress: number }

const defaultNodes: GoalNode[] = [
  { id: 'v1', title: 'Become the #1 Business OS for mid-market companies', level: 'vision', parentId: null, progress: 45 },
  { id: 'g1', title: 'Achieve $1M ARR by Q4 2025', level: 'goal', parentId: 'v1', progress: 62 },
  { id: 'g2', title: 'Launch AI-powered strategy features', level: 'goal', parentId: 'v1', progress: 75 },
  { id: 'g3', title: 'Expand to 3 new markets', level: 'goal', parentId: 'v1', progress: 20 },
  { id: 'i1', title: 'Close 15 enterprise deals', level: 'initiative', parentId: 'g1', progress: 60 },
  { id: 'i2', title: 'Launch self-serve pricing page', level: 'initiative', parentId: 'g1', progress: 80 },
  { id: 'i3', title: 'Build SWOT AI generator', level: 'initiative', parentId: 'g2', progress: 100 },
  { id: 'i4', title: 'Implement predictive risk scoring', level: 'initiative', parentId: 'g2', progress: 40 },
  { id: 'i5', title: 'APAC market research', level: 'initiative', parentId: 'g3', progress: 30 },
  { id: 'i6', title: 'EU compliance certification', level: 'initiative', parentId: 'g3', progress: 15 },
  { id: 't1', title: 'Build demo environment', level: 'task', parentId: 'i1', progress: 100 },
  { id: 't2', title: 'Create case studies (3x)', level: 'task', parentId: 'i1', progress: 33 },
  { id: 't3', title: 'Design pricing page UI', level: 'task', parentId: 'i2', progress: 100 },
  { id: 't4', title: 'Integrate Stripe billing', level: 'task', parentId: 'i2', progress: 60 },
]

const levelConfig: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  vision: { color: 'text-violet-600', bg: 'bg-violet-500/10', icon: Target, label: 'Vision' },
  goal: { color: 'text-blue-600', bg: 'bg-blue-500/10', icon: Layers, label: 'Goal' },
  initiative: { color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: Zap, label: 'Initiative' },
  task: { color: 'text-slate-600', bg: 'bg-slate-500/10', icon: GitBranch, label: 'Task' },
}

export function GoalCascade() {
  const [nodes, setNodes] = useState<GoalNode[]>(defaultNodes)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(defaultNodes.map((n) => n.id)))

  const toggle = (id: string) => setExpanded((prev) => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s })
  const getChildren = (parentId: string) => nodes.filter((n) => n.parentId === parentId)
  const hasChildren = (id: string) => nodes.some((n) => n.parentId === id)

  const handleAdd = (parentId: string, level: string) => {
    const title = prompt(`New ${level} title:`); if (!title?.trim()) return
    setNodes((prev) => [...prev, { id: Date.now().toString(), title, level: level as GoalNode['level'], parentId, progress: 0 }])
    setExpanded((prev) => new Set([...prev, parentId]))
    toast.success(`${level.charAt(0).toUpperCase() + level.slice(1)} added`)
  }

  const renderNode = (node: GoalNode, depth: number = 0): React.ReactNode => {
    const config = levelConfig[node.level]
    const Icon = config.icon
    const children = getChildren(node.id)
    const isExpanded = expanded.has(node.id)
    const progressColor = node.progress >= 80 ? 'bg-emerald-500' : node.progress >= 40 ? 'bg-amber-500' : 'bg-red-500'
    const nextLevel = node.level === 'vision' ? 'goal' : node.level === 'goal' ? 'initiative' : 'task'

    return (
      <div key={node.id} style={{ marginLeft: depth * 24 }}>
        <div className="flex items-center gap-2 rounded-md border border-border p-3 mb-2 hover:bg-accent/30 transition-colors">
          {hasChildren(node.id) ? (
            <button onClick={() => toggle(node.id)} className="text-muted-foreground hover:text-foreground shrink-0">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : <div className="w-4" />}
          <div className={`rounded-md p-1.5 ${config.bg} shrink-0`}><Icon className={`h-4 w-4 ${config.color}`} /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2"><p className="text-sm font-medium truncate">{node.title}</p><Badge variant="secondary" className="text-[9px] shrink-0">{config.label}</Badge></div>
            <div className="flex items-center gap-2 mt-1"><div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${progressColor}`} style={{ width: `${node.progress}%` }} /></div><span className="text-[10px] text-muted-foreground w-8">{node.progress}%</span></div>
          </div>
          {node.level !== 'task' && (<Button variant="ghost" size="sm" onClick={() => handleAdd(node.id, nextLevel)} className="shrink-0 h-7 text-[10px] gap-0.5"><Plus className="h-3 w-3" /></Button>)}
        </div>
        {isExpanded && children.map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  const roots = nodes.filter((n) => n.parentId === null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><GitBranch className="h-6 w-6 text-violet-600" /> Goal Cascade</h1><p className="mt-1 text-sm text-muted-foreground">Visualize how Vision connects to Goals, Initiatives, and Tasks.</p></div><Button onClick={() => handleAdd('', 'vision')} className="gap-2"><Plus className="h-4 w-4" /> Add Vision</Button></div>

      <div className="grid grid-cols-4 gap-3">{(['vision', 'goal', 'initiative', 'task'] as const).map((level) => { const config = levelConfig[level]; const Icon = config.icon; const count = nodes.filter((n) => n.level === level).length; return (<Card key={level}><CardContent className="p-3 flex items-center gap-3"><div className={`rounded-lg p-2 ${config.bg}`}><Icon className={`h-4 w-4 ${config.color}`} /></div><div><p className="text-lg font-bold">{count}</p><p className="text-[10px] text-muted-foreground">{config.label}s</p></div></CardContent></Card>) })}</div>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Strategy Map</CardTitle></CardHeader><CardContent>{roots.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-8">Add a Vision to start building your strategy cascade.</p>) : roots.map((root) => renderNode(root))}</CardContent></Card>
    </div>
  )
}
