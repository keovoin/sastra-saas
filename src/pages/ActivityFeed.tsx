import React, { useState, useEffect } from 'react'
import { useBusinessOS } from '@/context/BusinessContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Activity, ShieldAlert, Target, FileText, Plus, Edit2, Trash2,
  Clock, User, Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActivityEvent {
  id: string
  type: 'risk_added' | 'risk_updated' | 'risk_deleted' | 'swot_added' | 'swot_updated' | 'swot_deleted' | 'charter_added' | 'charter_updated' | 'project_created'
  description: string
  timestamp: string
  user: string
  metadata?: string
}

const eventConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  risk_added: { icon: Plus, color: 'text-red-600', bg: 'bg-red-500/10', label: 'Risk Added' },
  risk_updated: { icon: Edit2, color: 'text-amber-600', bg: 'bg-amber-500/10', label: 'Risk Updated' },
  risk_deleted: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-500/10', label: 'Risk Removed' },
  swot_added: { icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-500/10', label: 'SWOT Item Added' },
  swot_updated: { icon: Edit2, color: 'text-blue-600', bg: 'bg-blue-500/10', label: 'SWOT Updated' },
  swot_deleted: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-500/10', label: 'SWOT Removed' },
  charter_added: { icon: FileText, color: 'text-violet-600', bg: 'bg-violet-500/10', label: 'Charter Created' },
  charter_updated: { icon: Edit2, color: 'text-violet-600', bg: 'bg-violet-500/10', label: 'Charter Updated' },
  project_created: { icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-500/10', label: 'Project Created' },
}

function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ActivityFeed() {
  const { risks, swotItems, charters, profile, activeProject } = useBusinessOS()
  const [filter, setFilter] = useState<'all' | 'risks' | 'swot' | 'charters'>('all')
  const [activities, setActivities] = useState<ActivityEvent[]>([])

  // Build activity feed from real data timestamps
  useEffect(() => {
    const events: ActivityEvent[] = []
    const userName = profile?.full_name || 'You'

    // Generate events from risks
    risks.forEach((risk) => {
      events.push({
        id: `risk-${risk.id}`,
        type: 'risk_added',
        description: risk.description,
        timestamp: risk.created_at,
        user: userName,
        metadata: `Severity: ${risk.severity} | Status: ${risk.status}`,
      })
      if (risk.updated_at !== risk.created_at) {
        events.push({
          id: `risk-upd-${risk.id}`,
          type: 'risk_updated',
          description: risk.description,
          timestamp: risk.updated_at,
          user: userName,
          metadata: `Severity: ${risk.severity}`,
        })
      }
    })

    // Generate events from SWOT items
    swotItems.forEach((item) => {
      events.push({
        id: `swot-${item.id}`,
        type: 'swot_added',
        description: item.content,
        timestamp: item.created_at,
        user: userName,
        metadata: `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} | ${item.priority} priority`,
      })
    })

    // Generate events from charters
    charters.forEach((charter) => {
      events.push({
        id: `charter-${charter.id}`,
        type: 'charter_added',
        description: charter.name,
        timestamp: charter.created_at,
        user: userName,
        metadata: `Sponsor: ${charter.sponsor}`,
      })
    })

    // Project creation event
    if (activeProject) {
      events.push({
        id: `project-${activeProject.id}`,
        type: 'project_created',
        description: activeProject.title,
        timestamp: activeProject.created_at,
        user: userName,
      })
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setActivities(events)
  }, [risks, swotItems, charters, profile, activeProject])

  // Filter activities
  const filteredActivities = activities.filter((a) => {
    if (filter === 'all') return true
    if (filter === 'risks') return a.type.startsWith('risk')
    if (filter === 'swot') return a.type.startsWith('swot')
    if (filter === 'charters') return a.type.startsWith('charter')
    return true
  })

  const totalRisks = activities.filter((a) => a.type.startsWith('risk')).length
  const totalSwot = activities.filter((a) => a.type.startsWith('swot')).length
  const totalCharters = activities.filter((a) => a.type.startsWith('charter')).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Feed</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time log of all actions across your project.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setFilter('all')}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="rounded-lg bg-slate-500/10 p-2"><Activity className="h-4 w-4 text-slate-600" /></div>
            <div><p className="text-lg font-bold">{activities.length}</p><p className="text-[10px] text-muted-foreground">All Events</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setFilter('risks')}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2"><ShieldAlert className="h-4 w-4 text-red-600" /></div>
            <div><p className="text-lg font-bold">{totalRisks}</p><p className="text-[10px] text-muted-foreground">Risk Events</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setFilter('swot')}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2"><Target className="h-4 w-4 text-emerald-600" /></div>
            <div><p className="text-lg font-bold">{totalSwot}</p><p className="text-[10px] text-muted-foreground">SWOT Events</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setFilter('charters')}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="rounded-lg bg-violet-500/10 p-2"><FileText className="h-4 w-4 text-violet-600" /></div>
            <div><p className="text-lg font-bold">{totalCharters}</p><p className="text-[10px] text-muted-foreground">Charter Events</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(['all', 'risks', 'swot', 'charters'] as const).map((f) => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="text-xs capitalize">
            {f === 'all' ? 'All' : f}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-0">
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4"><Activity className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="text-lg font-semibold">No activity yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Start adding risks, SWOT items, or charters to see activity here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredActivities.map((event) => {
                const config = eventConfig[event.type] || eventConfig.project_created
                const Icon = config.icon
                return (
                  <div key={event.id} className="flex items-start gap-4 px-4 sm:px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className={`rounded-lg p-2 ${config.bg} shrink-0 mt-0.5`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">{config.label}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {getRelativeTime(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm mt-1 truncate">{event.description}</p>
                      {event.metadata && (
                        <p className="text-xs text-muted-foreground mt-0.5">{event.metadata}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <User className="h-3 w-3" /> {event.user}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
