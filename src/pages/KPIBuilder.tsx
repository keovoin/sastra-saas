import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Plus, BarChart3, TrendingUp, TrendingDown, Trash2 } from 'lucide-react'
import { toast } from 'sonner'


interface KPIMetric { id: string; name: string; unit: string; target: number; values: Array<{ week: string; value: number }> }

const defaultKPIs: KPIMetric[] = []

export function KPIBuilder() {
  const [kpis, setKPIs] = useState<KPIMetric[]>(defaultKPIs)
  const [newValue, setNewValue] = useState<Record<string, string>>({})

  const handleAddValue = (kpiId: string) => {
    const val = parseFloat(newValue[kpiId] || '')
    if (isNaN(val)) return
    setKPIs((prev) => prev.map((k) => k.id === kpiId ? { ...k, values: [...k.values, { week: `W${k.values.length + 1}`, value: val }] } : k))
    setNewValue((prev) => ({ ...prev, [kpiId]: '' }))
    toast.success('Value recorded')
  }

  const handleAddKPI = () => {
    const name = prompt('KPI Name:'); if (!name?.trim()) return
    const unit = prompt('Unit (e.g., %, users, hours):') || ''
    const target = parseFloat(prompt('Target value:') || '0')
    setKPIs((prev) => [...prev, { id: Date.now().toString(), name, unit, target, values: [] }])
    toast.success('KPI created')
  }

  const handleDelete = (id: string) => { setKPIs((prev) => prev.filter((k) => k.id !== id)); toast.success('KPI removed') }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><BarChart3 className="h-6 w-6 text-cyan-600" /> KPI Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Define custom metrics, track weekly values, and visualize trends.</p></div><Button onClick={handleAddKPI} className="gap-2"><Plus className="h-4 w-4" /> New KPI</Button></div>

      <div className="grid gap-4 md:grid-cols-2">
        {kpis.length === 0 && (
          <div className="col-span-2 text-center py-12 animate-fade-in-up">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium">No KPIs tracked yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first KPI to start tracking metrics</p>
            <Button onClick={handleAddKPI}><Plus className="h-4 w-4 mr-1" />Create First KPI</Button>
          </div>
        )}
        {kpis.map((kpi) => {
          const latest = kpi.values[kpi.values.length - 1]?.value || 0
          const prev = kpi.values[kpi.values.length - 2]?.value || latest
          const change = prev !== 0 ? ((latest - prev) / prev * 100).toFixed(1) : '0'
          const isImproving = kpi.name.includes('Churn') || kpi.name.includes('Resolution') ? latest < prev : latest > prev
          const atTarget = kpi.name.includes('Churn') || kpi.name.includes('Resolution') ? latest <= kpi.target : latest >= kpi.target
          return (
            <Card key={kpi.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{kpi.name}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(kpi.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{latest} {kpi.unit}</span>
                  <Badge variant={atTarget ? 'success' : 'warning'} className="text-[10px]">{atTarget ? 'On Target' : `Target: ${kpi.target}`}</Badge>
                  <span className={`text-xs flex items-center gap-0.5 ${isImproving ? 'text-emerald-600' : 'text-red-600'}`}>{isImproving ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{change}%</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-32 mb-3"><ResponsiveContainer width="100%" height="100%"><LineChart data={kpi.values}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="week" tick={{ fontSize: 10 }} className="fill-muted-foreground" /><YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" /><Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} /><Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} /></LineChart></ResponsiveContainer></div>
                <div className="flex gap-2"><Input type="number" value={newValue[kpi.id] || ''} onChange={(e) => setNewValue((prev) => ({ ...prev, [kpi.id]: e.target.value }))} placeholder={`Add ${kpi.unit}...`} className="h-8 text-xs" onKeyDown={(e) => { if (e.key === 'Enter') handleAddValue(kpi.id) }} /><Button size="sm" className="h-8 text-xs" onClick={() => handleAddValue(kpi.id)}>Log</Button></div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
