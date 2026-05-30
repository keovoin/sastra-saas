import React from 'react'
import { useBusinessOS } from '@/context/BusinessContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart, LineChart, Line, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Target, ShieldAlert, FileText, Activity, ListChecks, CalendarDays } from 'lucide-react'

const revenueData = [
  { month: 'Jan', revenue: 42000, target: 40000 },
  { month: 'Feb', revenue: 45000, target: 42000 },
  { month: 'Mar', revenue: 48000, target: 44000 },
  { month: 'Apr', revenue: 51000, target: 46000 },
  { month: 'May', revenue: 47000, target: 48000 },
  { month: 'Jun', revenue: 54000, target: 50000 },
  { month: 'Jul', revenue: 58000, target: 52000 },
  { month: 'Aug', revenue: 62000, target: 55000 },
]

// Burn-down chart data (sprint simulation)
const burndownData = [
  { day: 'Day 1', ideal: 40, actual: 40 },
  { day: 'Day 2', ideal: 36, actual: 38 },
  { day: 'Day 3', ideal: 32, actual: 35 },
  { day: 'Day 4', ideal: 28, actual: 30 },
  { day: 'Day 5', ideal: 24, actual: 28 },
  { day: 'Day 6', ideal: 20, actual: 24 },
  { day: 'Day 7', ideal: 16, actual: 20 },
  { day: 'Day 8', ideal: 12, actual: 16 },
  { day: 'Day 9', ideal: 8, actual: 12 },
  { day: 'Day 10', ideal: 4, actual: 8 },
  { day: 'Day 11', ideal: 0, actual: 4 },
]

// Timeline / Gantt-style data
const timelineData = [
  { name: 'Research', start: 0, duration: 3, color: '#6366f1' },
  { name: 'Design', start: 2, duration: 4, color: '#8b5cf6' },
  { name: 'Development', start: 4, duration: 6, color: '#3b82f6' },
  { name: 'Testing', start: 8, duration: 3, color: '#10b981' },
  { name: 'Deployment', start: 10, duration: 2, color: '#f59e0b' },
]

const HEATMAP_COLORS = ['#10b981', '#f59e0b', '#ef4444']
const SWOT_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f97316']

export function Dashboard() {
  const { swotItems, risks, charters, profile } = useBusinessOS()

  const lowSeverity = risks.filter((r) => r.severity <= 9).length
  const medSeverity = risks.filter((r) => r.severity > 9 && r.severity <= 15).length
  const highSeverity = risks.filter((r) => r.severity > 15).length
  const riskHeatmapData = [
    { name: 'Low (≤9)', value: lowSeverity },
    { name: 'Medium (10-15)', value: medSeverity },
    { name: 'High (>15)', value: highSeverity },
  ]

  const pendingHigh = swotItems.filter((i) => i.priority === 'High').length
  const pendingMed = swotItems.filter((i) => i.priority === 'Medium').length
  const pendingLow = swotItems.filter((i) => i.priority === 'Low').length
  const totalTasks = swotItems.length

  const swotDist = [
    { name: 'Strengths', value: swotItems.filter((i) => i.type === 'strength').length },
    { name: 'Weaknesses', value: swotItems.filter((i) => i.type === 'weakness').length },
    { name: 'Opportunities', value: swotItems.filter((i) => i.type === 'opportunity').length },
    { name: 'Threats', value: swotItems.filter((i) => i.type === 'threat').length },
  ]

  const riskStatusData = [
    { status: 'Active', count: risks.filter((r) => r.status === 'Active').length },
    { status: 'Watch', count: risks.filter((r) => r.status === 'Watch').length },
    { status: 'Mitigated', count: risks.filter((r) => r.status === 'Mitigated').length },
  ]

  const activeRisks = risks.filter((r) => r.status === 'Active').length
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Business Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Welcome back, {firstName}. Here's an overview of your business operations.</p></div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">Monthly Revenue</p><p className="mt-1 text-2xl font-bold">$62,400</p><div className="mt-1 flex items-center gap-1 text-xs text-emerald-600"><TrendingUp className="h-3 w-3" /><span>+12.5% vs last month</span></div></div><div className="rounded-lg bg-emerald-500/10 p-2.5"><Activity className="h-5 w-5 text-emerald-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">Strategic Items</p><p className="mt-1 text-2xl font-bold">{swotItems.length}</p><div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Target className="h-3 w-3" /><span>Across 4 quadrants</span></div></div><div className="rounded-lg bg-blue-500/10 p-2.5"><Target className="h-5 w-5 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">Active Risks</p><p className="mt-1 text-2xl font-bold">{activeRisks}</p><div className="mt-1 flex items-center gap-1 text-xs text-red-600"><TrendingDown className="h-3 w-3" /><span>{highSeverity} high severity</span></div></div><div className="rounded-lg bg-red-500/10 p-2.5"><ShieldAlert className="h-5 w-5 text-red-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">Active Projects</p><p className="mt-1 text-2xl font-bold">{charters.length}</p><div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-3 w-3" /><span>Chartered & tracked</span></div></div><div className="rounded-lg bg-violet-500/10 p-2.5"><FileText className="h-5 w-5 text-violet-600" /></div></div></CardContent></Card>
      </div>

      {/* Charts Row 1: Revenue + Risk Heatmap */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Revenue vs Target</CardTitle><CardDescription>Monthly performance (2024)</CardDescription></CardHeader><CardContent><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" /><YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => `$${v / 1000}k`} /><Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} /><Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} /><Area type="monotone" dataKey="target" stroke="#94a3b8" fill="transparent" strokeDasharray="4 4" strokeWidth={1.5} /></AreaChart></ResponsiveContainer></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Risk Severity Heatmap</CardTitle><CardDescription>Distribution by severity tier</CardDescription></div><Badge variant="secondary" className="text-[10px]">LIVE</Badge></div></CardHeader><CardContent><div className="h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={riskHeatmapData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">{riskHeatmapData.map((_, i) => (<Cell key={i} fill={HEATMAP_COLORS[i]} />))}</Pie><Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} /></PieChart></ResponsiveContainer></div><div className="flex flex-wrap justify-center gap-4 mt-2">{riskHeatmapData.map((e, i) => (<div key={e.name} className="flex items-center gap-1.5 text-xs"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: HEATMAP_COLORS[i] }} /><span className="text-muted-foreground">{e.name}: <span className="font-bold text-foreground">{e.value}</span></span></div>))}</div></CardContent></Card>
      </div>

      {/* Charts Row 2: Burn-down + Timeline/Gantt */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Burn-down Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Sprint Burn-down</CardTitle>
                <CardDescription>Remaining work vs ideal pace</CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px]">SPRINT 14</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" label={{ value: 'Story Points', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
                  <Legend />
                  <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Ideal" />
                  <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} name="Actual" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Timeline / Gantt Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Project Timeline</CardTitle>
                <CardDescription>Phase progress (weeks)</CardDescription>
              </div>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 pt-2">
              {timelineData.map((phase) => (
                <div key={phase.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{phase.name}</span>
                    <span className="text-xs text-muted-foreground">W{phase.start + 1}-W{phase.start + phase.duration}</span>
                  </div>
                  <div className="relative h-7 w-full rounded-md bg-muted/50 overflow-hidden">
                    <div
                      className="absolute top-0.5 bottom-0.5 rounded-md flex items-center justify-center text-[10px] font-medium text-white"
                      style={{
                        left: `${(phase.start / 12) * 100}%`,
                        width: `${(phase.duration / 12) * 100}%`,
                        backgroundColor: phase.color,
                      }}
                    >
                      {phase.duration}w
                    </div>
                  </div>
                </div>
              ))}
              {/* Week markers */}
              <div className="flex justify-between pt-1 px-0">
                {Array.from({ length: 13 }, (_, i) => (
                  <span key={i} className="text-[9px] text-muted-foreground">W{i + 1}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Task Velocity + Risk Status + SWOT */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card><CardHeader className="pb-2"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Task Velocity</CardTitle><CardDescription>Pending items from SWOT</CardDescription></div><Badge variant="secondary" className="text-[10px]">LIVE</Badge></div></CardHeader><CardContent><div className="flex items-center gap-4 mb-4"><div className="rounded-lg bg-indigo-500/10 p-3"><ListChecks className="h-6 w-6 text-indigo-600" /></div><div><p className="text-3xl font-bold">{totalTasks}</p><p className="text-xs text-muted-foreground">Pending Strategic Tasks</p></div></div><div className="space-y-2"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">High Priority</span><span className="font-bold text-red-600">{pendingHigh}</span></div><div className="h-2 w-full rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-red-500" style={{ width: `${totalTasks ? (pendingHigh / totalTasks) * 100 : 0}%` }} /></div><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Medium</span><span className="font-bold text-amber-600">{pendingMed}</span></div><div className="h-2 w-full rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-amber-500" style={{ width: `${totalTasks ? (pendingMed / totalTasks) * 100 : 0}%` }} /></div><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Low</span><span className="font-bold text-foreground">{pendingLow}</span></div><div className="h-2 w-full rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-slate-400 dark:bg-slate-600" style={{ width: `${totalTasks ? (pendingLow / totalTasks) * 100 : 0}%` }} /></div></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Risk by Status</CardTitle><CardDescription>Current distribution</CardDescription></CardHeader><CardContent><div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={riskStatusData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="status" tick={{ fontSize: 12 }} className="fill-muted-foreground" /><YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} /><Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} /><Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#6366f1" /></BarChart></ResponsiveContainer></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">SWOT Distribution</CardTitle><CardDescription>Items per quadrant</CardDescription></CardHeader><CardContent><div className="h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={swotDist} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">{swotDist.map((_, i) => (<Cell key={i} fill={SWOT_COLORS[i]} />))}</Pie><Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} /></PieChart></ResponsiveContainer></div><div className="flex flex-wrap justify-center gap-3 mt-2">{swotDist.map((e, i) => (<div key={e.name} className="flex items-center gap-1.5 text-xs"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SWOT_COLORS[i] }} /><span className="text-muted-foreground">{e.name} ({e.value})</span></div>))}</div></CardContent></Card>
      </div>

      {/* Top Risks */}
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Top Risks by Severity</CardTitle><CardDescription>Highest impact items</CardDescription></CardHeader><CardContent><div className="space-y-3">{[...risks].sort((a, b) => b.severity - a.severity).slice(0, 5).map((risk) => (<div key={risk.id} className="flex items-center justify-between rounded-md border p-3"><div className="flex items-center gap-3 min-w-0"><p className="text-sm truncate">{risk.description}</p></div><div className="flex items-center gap-2 shrink-0"><Badge variant={risk.status === 'Active' ? 'danger' : risk.status === 'Watch' ? 'warning' : 'success'}>{risk.status}</Badge><span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${risk.severity > 15 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : risk.severity > 9 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'}`}>{risk.severity}</span></div></div>))}</div></CardContent></Card>
    </div>
  )
}
