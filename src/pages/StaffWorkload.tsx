import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, AlertTriangle, Sparkles, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAI } from '@/lib/ai'

export function StaffWorkload() {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')

  // This would aggregate data from all modules in production
  // For now show empty state with explanation
  const workloadData: { name: string; tasks: number; risks: number; deals: number; projects: number }[] = []
  const OVERLOAD_THRESHOLD = 10

  const aiRebalance = async () => {
    if (workloadData.length === 0) { toast.info('Add team members with assigned items first'); return }
    setAiLoading(true)
    const summary = workloadData.map(m => `${m.name}: ${m.tasks + m.risks + m.deals + m.projects} total items`).join('\n')
    const result = await askAI(`Given this team workload:\n${summary}\nThreshold is ${OVERLOAD_THRESHOLD} items. Suggest rebalancing in 2-3 sentences.`)
    setAiLoading(false)
    if (result.success) { setAiSuggestion(result.content); toast.success('AI suggestion ready') }
    else toast.error(result.error || 'Failed')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10"><BarChart3 className="h-6 w-6 text-orange-600" /></div>
          <div><h1 className="text-2xl font-bold">Staff Workload</h1><p className="text-muted-foreground text-sm">Visualize team capacity across all modules</p></div>
        </div>
        {isAIConfigured() && (
          <Button variant="outline" onClick={aiRebalance} disabled={aiLoading}>
            <Sparkles className="h-4 w-4 mr-1" />{aiLoading ? 'Thinking...' : 'AI Rebalance'}
          </Button>
        )}
      </div>


      {aiSuggestion && (
        <Card className="border-violet-200 dark:border-violet-800 animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
              <div><p className="text-sm font-medium mb-1">AI Rebalancing Suggestion</p><p className="text-sm text-muted-foreground">{aiSuggestion}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {workloadData.length === 0 ? (
        <div className="text-center py-16 animate-fade-in-up">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No workload data yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            As you assign tasks, risks, deals, and projects to team members, their workload will appear here as a visual chart.
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto">
            <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-center">
              <p className="text-2xl font-bold text-violet-600">0</p><p className="text-xs text-muted-foreground">Tasks</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
              <p className="text-2xl font-bold text-red-600">0</p><p className="text-xs text-muted-foreground">Risks</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
              <p className="text-2xl font-bold text-green-600">0</p><p className="text-xs text-muted-foreground">Deals</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
              <p className="text-2xl font-bold text-blue-600">0</p><p className="text-xs text-muted-foreground">Projects</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Card className="card-glow">
            <CardHeader><CardTitle className="text-base">Workload by Team Member</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={workloadData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Bar dataKey="tasks" fill="#8b5cf6" name="Tasks" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="risks" fill="#ef4444" name="Risks" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deals" fill="#10b981" name="Deals" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="projects" fill="#3b82f6" name="Projects" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Overload Alerts */}
          {workloadData.filter(m => (m.tasks + m.risks + m.deals + m.projects) > OVERLOAD_THRESHOLD).length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-amber-500" /><span className="font-medium text-sm">Overloaded Members</span></div>
                <div className="space-y-1">
                  {workloadData.filter(m => (m.tasks + m.risks + m.deals + m.projects) > OVERLOAD_THRESHOLD).map(m => (
                    <div key={m.name} className="flex items-center justify-between text-sm">
                      <span>{m.name}</span>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">{m.tasks + m.risks + m.deals + m.projects} items</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
