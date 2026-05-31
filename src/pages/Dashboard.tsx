import React from 'react'
import { useBusinessOS } from '@/context/BusinessContext'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts'
import { TrendingUp, TrendingDown, Target, ShieldAlert, FileText, Activity, ListChecks, Pipette, KanbanSquare } from 'lucide-react'

const HEATMAP_COLORS = ['#10b981', '#f59e0b', '#ef4444']
const SWOT_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f97316']
const STAGE_COLORS: Record<string, string> = {
  lead: '#3b82f6', qualified: '#8b5cf6', proposal: '#f59e0b',
  negotiation: '#f97316', 'closed-won': '#10b981', 'closed-lost': '#ef4444',
}

export function Dashboard() {
  const { swotItems, risks, charters, profile } = useBusinessOS()
  const { invoices, deals, tasks } = useData()

  // ─── Real Revenue from Invoices ────────────────────────────────────────────
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const paidInvoices = invoices.filter((i) => i.status === 'paid')

  const monthRevenue = (m: number, y: number) =>
    paidInvoices
      .filter((i) => {
        const d = i.issued_date ? new Date(i.issued_date) : new Date(i.created_at)
        return d.getMonth() === m && d.getFullYear() === y
      })
      .reduce((sum, i) => sum + Number(i.amount || 0), 0)

  const currentRevenue = monthRevenue(thisMonth, thisYear)
  const lastMonthDate = new Date(thisYear, thisMonth - 1, 1)
  const lastRevenue = monthRevenue(lastMonthDate.getMonth(), lastMonthDate.getFullYear())
  const revenueChange = lastRevenue > 0 ? (((currentRevenue - lastRevenue) / lastRevenue) * 100) : 0

  // Revenue chart — last 6 months from real invoices
  const revenueData = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(thisYear, thisMonth - (5 - idx), 1)
    const rev = monthRevenue(d.getMonth(), d.getFullYear())
    return { month: d.toLocaleString('default', { month: 'short' }), revenue: rev }
  })
  const hasRevenueData = paidInvoices.length > 0

  // ─── Pipeline by Stage (real deals) ────────────────────────────────────────
  const pipelineStages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won']
  const pipelineData = pipelineStages.map((stage) => ({
    name: stage.charAt(0).toUpperCase() + stage.slice(1).replace('-', ' '),
    value: deals.filter((d) => d.stage === stage).reduce((s, d) => s + Number(d.value || 0), 0),
    count: deals.filter((d) => d.stage === stage).length,
    color: STAGE_COLORS[stage],
  }))
  const activePipelineValue = deals.filter((d) => !['closed-won', 'closed-lost'].includes(d.stage)).reduce((s, d) => s + Number(d.value || 0), 0)

  // ─── Tasks by Column (real project board) ──────────────────────────────────
  const taskColumns = ['backlog', 'todo', 'in-progress', 'review', 'done']
  const taskStatusData = taskColumns.map((col) => ({
    name: col === 'in-progress' ? 'In Progress' : col.charAt(0).toUpperCase() + col.slice(1),
    count: tasks.filter((t) => t.column_id === col).length,
  }))
  const doneTasks = tasks.filter((t) => t.column_id === 'done').length
  const taskCompletion = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0

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
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">Monthly Revenue</p><p className="mt-1 text-2xl font-bold">${currentRevenue.toLocaleString()}</p><div className={`mt-1 flex items-center gap-1 text-xs ${revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{revenueChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}<span>{hasRevenueData ? `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}% vs last month` : 'No paid invoices yet'}</span></div></div><div className="rounded-lg bg-emerald-500/10 p-2.5"><Activity className="h-5 w-5 text-emerald-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">Strategic Items</p><p className="mt-1 text-2xl font-bold">{swotItems.length}</p><div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Target className="h-3 w-3" /><span>Across 4 quadrants</span></div></div><div className="rounded-lg bg-blue-500/10 p-2.5"><Target className="h-5 w-5 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">Active Risks</p><p className="mt-1 text-2xl font-bold">{activeRisks}</p><div className="mt-1 flex items-center gap-1 text-xs text-red-600"><TrendingDown className="h-3 w-3" /><span>{highSeverity} high severity</span></div></div><div className="rounded-lg bg-red-500/10 p-2.5"><ShieldAlert className="h-5 w-5 text-red-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">Active Projects</p><p className="mt-1 text-2xl font-bold">{charters.length}</p><div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-3 w-3" /><span>Chartered & tracked</span></div></div><div className="rounded-lg bg-violet-500/10 p-2.5"><FileText className="h-5 w-5 text-violet-600" /></div></div></CardContent></Card>
      </div>

      {/* Charts Row 1: Revenue + Risk Heatmap */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card><CardHeader className="pb-2"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Revenue (Paid Invoices)</CardTitle><CardDescription>Last 6 months from Invoices module</CardDescription></div><Badge variant="secondary" className="text-[10px]">LIVE</Badge></div></CardHeader><CardContent><div className="h-64">{hasRevenueData ? (<ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" /><YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => `$${v / 1000}k`} /><Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} /><Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} /></AreaChart></ResponsiveContainer>) : (<div className="flex flex-col items-center justify-center h-full text-center"><Activity className="h-10 w-10 text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">No revenue data yet</p><p className="text-xs text-muted-foreground mt-1">Mark invoices as paid in the Invoices module to see revenue here</p></div>)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Risk Severity Heatmap</CardTitle><CardDescription>Distribution by severity tier</CardDescription></div><Badge variant="secondary" className="text-[10px]">LIVE</Badge></div></CardHeader><CardContent><div className="h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={riskHeatmapData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">{riskHeatmapData.map((_, i) => (<Cell key={i} fill={HEATMAP_COLORS[i]} />))}</Pie><Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} /></PieChart></ResponsiveContainer></div><div className="flex flex-wrap justify-center gap-4 mt-2">{riskHeatmapData.map((e, i) => (<div key={e.name} className="flex items-center gap-1.5 text-xs"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: HEATMAP_COLORS[i] }} /><span className="text-muted-foreground">{e.name}: <span className="font-bold text-foreground">{e.value}</span></span></div>))}</div></CardContent></Card>
      </div>

      {/* Charts Row 2: Task Status (Project Board) + Sales Pipeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Tasks by Status — real Project Board data */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Tasks by Status</CardTitle>
                <CardDescription>From the Project Board module</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{taskCompletion}% done</Badge>
                <KanbanSquare className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {tasks.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskStatusData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#8b5cf6" name="Tasks" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <KanbanSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No tasks yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create tasks in the Project Board to see status breakdown</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales Pipeline by Stage — real deals */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Sales Pipeline</CardTitle>
                <CardDescription>Active value: ${activePipelineValue.toLocaleString()}</CardDescription>
              </div>
              <Pipette className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {deals.length > 0 ? (
              <div className="space-y-3 pt-2">
                {pipelineData.map((stage) => {
                  const maxVal = Math.max(...pipelineData.map((s) => s.value), 1)
                  return (
                    <div key={stage.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{stage.name}</span>
                        <span className="text-xs text-muted-foreground">{stage.count} deal{stage.count !== 1 ? 's' : ''} • ${stage.value.toLocaleString()}</span>
                      </div>
                      <div className="relative h-6 w-full rounded-md bg-muted/50 overflow-hidden">
                        <div className="absolute top-0 bottom-0 left-0 rounded-md flex items-center px-2" style={{ width: `${Math.max((stage.value / maxVal) * 100, stage.count > 0 ? 8 : 0)}%`, backgroundColor: stage.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-56 text-center">
                <Pipette className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No deals yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add deals in the Sales Pipeline to see your funnel</p>
              </div>
            )}
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
