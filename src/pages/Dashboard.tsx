import React from 'react'
import { useStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'
import { TrendingUp, TrendingDown, Target, ShieldAlert, FileText, Activity } from 'lucide-react'

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

const riskTrendData = [
  { week: 'W1', active: 5, mitigated: 2 },
  { week: 'W2', active: 6, mitigated: 3 },
  { week: 'W3', active: 4, mitigated: 4 },
  { week: 'W4', active: 5, mitigated: 5 },
  { week: 'W5', active: 4, mitigated: 6 },
  { week: 'W6', active: 3, mitigated: 7 },
]

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1']

export function Dashboard() {
  const { swotItems, risks, charters } = useStore()

  const swotDistribution = [
    { name: 'Strengths', value: swotItems.filter((i) => i.category === 'strengths').length },
    { name: 'Weaknesses', value: swotItems.filter((i) => i.category === 'weaknesses').length },
    { name: 'Opportunities', value: swotItems.filter((i) => i.category === 'opportunities').length },
    { name: 'Threats', value: swotItems.filter((i) => i.category === 'threats').length },
  ]

  const activeRisks = risks.filter((r) => r.status === 'Active').length
  const highSeverityRisks = risks.filter((r) => r.severity > 15).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Business Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back, Jennifer. Here's an overview of your business operations.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Monthly Revenue</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">$62,400</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12.5% vs last month</span>
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2.5">
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Strategic Items</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{swotItems.length}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Target className="h-3 w-3" />
                  <span>Across 4 quadrants</span>
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 p-2.5">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Active Risks</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{activeRisks}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <TrendingDown className="h-3 w-3" />
                  <span>{highSeverityRisks} high severity</span>
                </div>
              </div>
              <div className="rounded-lg bg-red-50 p-2.5">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Active Projects</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{charters.length}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <FileText className="h-3 w-3" />
                  <span>Chartered & tracked</span>
                </div>
              </div>
              <div className="rounded-lg bg-violet-50 p-2.5">
                <FileText className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue vs Target</CardTitle>
            <CardDescription>Monthly performance tracking (2024)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} />
                  <Area type="monotone" dataKey="target" stroke="#94a3b8" fill="transparent" strokeDasharray="4 4" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risk Trend</CardTitle>
            <CardDescription>Active vs mitigated risks over 6 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="active" fill="#ef4444" radius={[4, 4, 0, 0]} name="Active" />
                  <Bar dataKey="mitigated" fill="#10b981" radius={[4, 4, 0, 0]} name="Mitigated" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* SWOT Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">SWOT Distribution</CardTitle>
            <CardDescription>Items per quadrant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={swotDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {swotDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {swotDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-slate-600">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Risks */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Risks by Severity</CardTitle>
            <CardDescription>Highest impact items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {risks
                .sort((a, b) => b.severity - a.severity)
                .slice(0, 4)
                .map((risk) => (
                  <div
                    key={risk.id}
                    className="flex items-center justify-between rounded-md border border-slate-100 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-slate-400">{risk.id}</span>
                      <p className="text-sm text-slate-700 truncate">{risk.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={risk.status === 'Active' ? 'danger' : risk.status === 'Watch' ? 'warning' : 'success'}
                      >
                        {risk.status}
                      </Badge>
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          risk.severity > 15
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {risk.severity}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
