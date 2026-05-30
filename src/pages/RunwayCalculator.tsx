import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { DollarSign, TrendingDown, Calendar, AlertTriangle, Calculator, RefreshCw } from 'lucide-react'

export function RunwayCalculator() {
  const [cashBalance, setCashBalance] = useState(850000)
  const [monthlyRevenue, setMonthlyRevenue] = useState(62000)
  const [monthlyBurn, setMonthlyBurn] = useState(95000)
  const [revenueGrowth, setRevenueGrowth] = useState(8)
  const [burnGrowth, setBurnGrowth] = useState(3)

  const analysis = useMemo(() => {
    const netBurn = monthlyBurn - monthlyRevenue
    const projections: Array<{ month: string; cash: number; revenue: number; burn: number; net: number }> = []
    let cash = cashBalance; let rev = monthlyRevenue; let burn = monthlyBurn; let runwayMonth = -1
    for (let i = 0; i < 24; i++) {
      const monthName = new Date(2025, i, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      rev = i === 0 ? rev : rev * (1 + revenueGrowth / 100)
      burn = i === 0 ? burn : burn * (1 + burnGrowth / 100)
      const net = rev - burn; cash = cash + net
      projections.push({ month: monthName, cash: Math.round(cash), revenue: Math.round(rev), burn: Math.round(burn), net: Math.round(net) })
      if (cash <= 0 && runwayMonth === -1) runwayMonth = i
    }
    const breakEvenMonth = projections.findIndex((p) => p.net >= 0)
    return { netBurn, projections, actualRunway: runwayMonth === -1 ? 24 : runwayMonth, breakEvenMonth }
  }, [cashBalance, monthlyRevenue, monthlyBurn, revenueGrowth, burnGrowth])

  const runwayColor = analysis.actualRunway < 6 ? 'text-red-600' : analysis.actualRunway < 12 ? 'text-amber-600' : 'text-emerald-600'
  const runwayBg = analysis.actualRunway < 6 ? 'bg-red-500/10' : analysis.actualRunway < 12 ? 'bg-amber-500/10' : 'bg-emerald-500/10'

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Calculator className="h-6 w-6 text-emerald-600" /> Financial Runway</h1><p className="mt-1 text-sm text-muted-foreground">Calculate how long your cash will last.</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Runway</p><p className={`text-3xl font-bold ${runwayColor}`}>{analysis.actualRunway < 24 ? `${analysis.actualRunway}mo` : '24+'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Net Burn/mo</p><p className="text-2xl font-bold">${Math.abs(analysis.netBurn).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Cash</p><p className="text-2xl font-bold">${(cashBalance/1000).toFixed(0)}k</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Break-even</p><p className="text-2xl font-bold">{analysis.breakEvenMonth >= 0 ? `Mo ${analysis.breakEvenMonth+1}` : 'N/A'}</p></CardContent></Card>
      </div>

      {analysis.actualRunway < 6 && (<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-4 py-3"><AlertTriangle className="h-5 w-5 text-red-600 shrink-0" /><p className="text-sm text-red-800 dark:text-red-200"><b>Critical:</b> Less than 6 months runway. Reduce burn or raise capital.</p></div>)}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Parameters</CardTitle></CardHeader><CardContent className="space-y-3">
          <div className="space-y-1"><Label className="text-xs">Cash Balance ($)</Label><Input type="number" value={cashBalance} onChange={(e) => setCashBalance(Number(e.target.value))} step={10000} /></div>
          <div className="space-y-1"><Label className="text-xs">Monthly Revenue ($)</Label><Input type="number" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(Number(e.target.value))} step={1000} /></div>
          <div className="space-y-1"><Label className="text-xs">Monthly Burn ($)</Label><Input type="number" value={monthlyBurn} onChange={(e) => setMonthlyBurn(Number(e.target.value))} step={1000} /></div>
          <div className="space-y-1"><Label className="text-xs">Revenue Growth (%/mo)</Label><Input type="number" value={revenueGrowth} onChange={(e) => setRevenueGrowth(Number(e.target.value))} step={1} /></div>
          <div className="space-y-1"><Label className="text-xs">Burn Growth (%/mo)</Label><Input type="number" value={burnGrowth} onChange={(e) => setBurnGrowth(Number(e.target.value))} step={1} /></div>
        </CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader className="pb-2"><CardTitle className="text-base">24-Month Projection</CardTitle></CardHeader><CardContent><div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={analysis.projections}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-muted-foreground" interval={2} /><YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} /><Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} formatter={(value: number) => [`$${value.toLocaleString()}`, '']} /><ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" /><Area type="monotone" dataKey="cash" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} name="Cash" /><Area type="monotone" dataKey="revenue" stroke="#10b981" fill="transparent" strokeDasharray="4 4" strokeWidth={1.5} name="Revenue" /><Area type="monotone" dataKey="burn" stroke="#ef4444" fill="transparent" strokeDasharray="4 4" strokeWidth={1.5} name="Burn" /></AreaChart></ResponsiveContainer></div></CardContent></Card>
      </div>
    </div>
  )
}
