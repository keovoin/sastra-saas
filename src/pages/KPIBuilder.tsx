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

const defaultKPIs: KPIMetric[] = [
  { id: '1', name: 'Weekly Active Users', unit: 'users', target: 500, values: [{ week: 'W1', value: 320 }, { week: 'W2', value: 345 }, { week: 'W3', value: 380 }, { week: 'W4', value: 410 }, { week: 'W5', value: 435 }, { week: 'W6', value: 460 }, { week: 'W7', value: 478 }, { week: 'W8', value: 495 }] },
  { id: '2', name: 'Customer NPS', unit: 'score', target: 70, values: [{ week: 'W1', value: 52 }, { week: 'W2', value: 55 }, { week: 'W3', value: 53 }, { week: 'W4', value: 58 }, { week: 'W5', value: 62 }, { week: 'W6', value: 60 }, { week: 'W7', value: 65 }, { week: 'W8', value: 63 }] },
  { id: '3', name: 'Monthly Churn Rate', unit: '%', target: 3, values: [{ week: 'W1', value: 5.2 }, { week: 'W2', value: 4.8 }, { week: 'W3', value: 4.5 }, { week: 'W4', value: 4.2 }, { week: 'W5', value: 4.0 }, { week: 'W6', value: 3.8 }, { week: 'W7', value: 3.6 }, { week: 'W8', value: 3.4 }] },
  { id: '4', name: 'Support Resolution Time', unit: 'hours', target: 4, values: [{ week: 'W1', value: 8.5 }, { week: 'W2', value: 7.2 }, { week: 'W3', value: 6.8 }, { week: 'W4', value: 6.1 }, { week: 'W5', value: 5.5 }, { week: 'W6', value: 5.0 }, { week: 'W7', value: 4.8 }, { week: 'W8', value: 4.5 }] },
  { id: '5', name: 'Monthly Revenue Growth', unit: '%', target: 15, values: [{ week: 'W1', value: 8 }, { week: 'W2', value: 9.5 }, { week: 'W3', value: 11 }, { week: 'W4', value: 10.2 }, { week: 'W5', value: 12 }, { week: 'W6', value: 13.5 }, { week: 'W7', value: 14 }, { week: 'W8', value: 14.8 }] },
  { id: '6', name: 'Feature Adoption Rate', unit: '%', target: 60, values: [{ week: 'W1', value: 32 }, { week: 'W2', value: 35 }, { week: 'W3', value: 38 }, { week: 'W4', value: 42 }, { week: 'W5', value: 45 }, { week: 'W6', value: 48 }, { week: 'W7', value: 51 }, { week: 'W8', value: 54 }] },
]

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
