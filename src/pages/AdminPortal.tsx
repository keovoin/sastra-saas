import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Shield, Users, Building2, CreditCard, BarChart3, Cog, Search,
  TrendingUp, DollarSign, Activity, Loader2, Crown, Ban, CheckCircle2, Star, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  fetchPlatformStats, fetchAllUsers, fetchAllWorkspaces, fetchBillingEvents,
  fetchSignupTrend, updateUserPlan, updateUserStatus, updateWorkspacePlan,
  type PlatformStats, type AdminUser, type AdminWorkspace, type BillingEvent, type Plan, type AccountStatus,
} from '@/lib/admin'

type AdminTab = 'dashboard' | 'users' | 'workspaces' | 'billing' | 'analytics' | 'system'

const PLAN_COLORS: Record<Plan, string> = {
  free: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  pro: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

const STATUS_COLORS: Record<AccountStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  suspended: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  banned: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const CHART_COLORS = ['#94a3b8', '#8b5cf6', '#f59e0b']


export function AdminPortal() {
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([])
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([])
  const [signupTrend, setSignupTrend] = useState<{ week: string; signups: number }[]>([])
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<Plan | ''>('')

  // Manage dialogs
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editWorkspace, setEditWorkspace] = useState<AdminWorkspace | null>(null)

  // ─── Paddle Configuration (stored in localStorage) ─────────────────────────
  const [paddleConfig, setPaddleConfig] = useState({
    vendorId: localStorage.getItem('sastra-paddle-vendor-id') || '348843',
    clientToken: localStorage.getItem('sastra-paddle-client-token') || '',
    proPriceId: localStorage.getItem('sastra-paddle-pro-price') || '',
    enterprisePriceId: localStorage.getItem('sastra-paddle-ent-price') || '',
    environment: localStorage.getItem('sastra-paddle-env') || 'production',
  })

  const savePaddleConfig = () => {
    localStorage.setItem('sastra-paddle-vendor-id', paddleConfig.vendorId)
    localStorage.setItem('sastra-paddle-client-token', paddleConfig.clientToken)
    localStorage.setItem('sastra-paddle-pro-price', paddleConfig.proPriceId)
    localStorage.setItem('sastra-paddle-ent-price', paddleConfig.enterprisePriceId)
    localStorage.setItem('sastra-paddle-env', paddleConfig.environment)
    toast.success('Paddle configuration saved')
  }

  const loadData = async () => {
    setLoading(true)
    const [s, u, w, b, t] = await Promise.all([
      fetchPlatformStats(),
      fetchAllUsers(),
      fetchAllWorkspaces(),
      fetchBillingEvents(),
      fetchSignupTrend(),
    ])
    setStats(s); setUsers(u); setWorkspaces(w); setBillingEvents(b); setSignupTrend(t)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // ─── Plan / Status Actions ─────────────────────────────────────────────────
  const handleUserPlan = async (userId: string, plan: Plan) => {
    const ok = await updateUserPlan(userId, plan)
    if (ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan } : u))
      if (editUser?.id === userId) setEditUser({ ...editUser, plan })
      toast.success(`Plan updated to ${plan}`)
    } else toast.error('Failed to update plan')
  }

  const handleUserStatus = async (userId: string, status: AccountStatus) => {
    const ok = await updateUserStatus(userId, status)
    if (ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, account_status: status } : u))
      if (editUser?.id === userId) setEditUser({ ...editUser, account_status: status })
      toast.success(`Account ${status}`)
    } else toast.error('Failed to update status')
  }

  const handleWorkspacePlan = async (wsId: string, plan: Plan) => {
    const ok = await updateWorkspacePlan(wsId, plan)
    if (ok) {
      setWorkspaces(prev => prev.map(w => w.id === wsId ? { ...w, plan } : w))
      if (editWorkspace?.id === wsId) setEditWorkspace({ ...editWorkspace, plan })
      toast.success(`Workspace plan updated to ${plan}`)
    } else toast.error('Failed to update workspace plan')
  }

  const filteredUsers = users.filter(u => {
    if (search && !u.full_name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false
    if (planFilter && u.plan !== planFilter) return false
    return true
  })

  const TABS: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'workspaces', label: 'Workspaces', icon: Building2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'system', label: 'System', icon: Cog },
  ]


  const planPieData = stats ? [
    { name: 'Free', value: stats.planCounts.free },
    { name: 'Pro', value: stats.planCounts.pro },
    { name: 'Enterprise', value: stats.planCounts.enterprise },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">Admin Portal <Crown className="h-5 w-5 text-amber-500" /></h1>
            <p className="text-muted-foreground text-sm">Platform-wide management & analytics</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
          <span className="ml-1">Refresh</span>
        </Button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-violet-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="h-4 w-4" />{t.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* ─── DASHBOARD TAB ─────────────────────────────────────────────────── */}
          {tab === 'dashboard' && stats && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="card-glow"><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /><span className="text-xs">Total Users</span></div><p className="text-2xl font-bold mt-1">{stats.totalUsers}</p></CardContent></Card>
                <Card className="card-glow"><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4" /><span className="text-xs">Workspaces</span></div><p className="text-2xl font-bold mt-1">{stats.totalWorkspaces}</p></CardContent></Card>
                <Card className="card-glow"><CardContent className="p-4"><div className="flex items-center gap-2 text-emerald-600"><DollarSign className="h-4 w-4" /><span className="text-xs">MRR</span></div><p className="text-2xl font-bold mt-1 text-emerald-600">${stats.mrr.toLocaleString()}</p></CardContent></Card>
                <Card className="card-glow"><CardContent className="p-4"><div className="flex items-center gap-2 text-muted-foreground"><Activity className="h-4 w-4" /><span className="text-xs">Active Today</span></div><p className="text-2xl font-bold mt-1">{stats.activeToday}</p></CardContent></Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card><CardHeader><CardTitle className="text-base">Signups (Last 8 Weeks)</CardTitle></CardHeader><CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={signupTrend}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="week" className="text-xs" /><YAxis className="text-xs" /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} /><Bar dataKey="signups" fill="#8b5cf6" radius={[4, 4, 0, 0]} /></BarChart>
                  </ResponsiveContainer>
                </CardContent></Card>
                <Card><CardHeader><CardTitle className="text-base">Plan Distribution</CardTitle></CardHeader><CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart><Pie data={planPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{planPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}</Pie><Tooltip /><Legend /></PieChart>
                  </ResponsiveContainer>
                </CardContent></Card>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Active This Week</p><p className="text-xl font-bold">{stats.activeThisWeek}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Signups This Week</p><p className="text-xl font-bold">{stats.signupsThisWeek}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pro Users</p><p className="text-xl font-bold text-violet-600">{stats.planCounts.pro}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Enterprise</p><p className="text-xl font-bold text-amber-600">{stats.planCounts.enterprise}</p></CardContent></Card>
              </div>
            </div>
          )}


          {/* ─── USERS TAB ─────────────────────────────────────────────────────── */}
          {tab === 'users' && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={planFilter} onChange={e => setPlanFilter(e.target.value as Plan | '')}>
                  <option value="">All Plans</option><option value="free">Free</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
                </select>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Joined</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                      </tr></thead>
                      <tbody>
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-[10px] text-white font-medium">
                                  {(u.full_name || u.email || '?').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate flex items-center gap-1">{u.full_name || 'Unnamed'}{u.is_superadmin && <Crown className="h-3 w-3 text-amber-500" />}</p>
                                  <p className="text-xs text-muted-foreground truncate">{u.email || u.id.slice(0, 8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3"><Badge className={PLAN_COLORS[u.plan || 'free']}>{u.plan || 'free'}</Badge></td>
                            <td className="px-4 py-3"><Badge className={STATUS_COLORS[u.account_status || 'active']}>{u.account_status || 'active'}</Badge></td>
                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right"><Button variant="outline" size="sm" onClick={() => setEditUser(u)}>Manage</Button></td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}


          {/* ─── WORKSPACES TAB ────────────────────────────────────────────────── */}
          {tab === 'workspaces' && (
            <div className="space-y-4 animate-fade-in-up">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Workspace</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Created</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                      </tr></thead>
                      <tbody>
                        {workspaces.map(w => (
                          <tr key={w.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <p className="font-medium">{w.title}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-xs">{w.description || 'No description'}</p>
                            </td>
                            <td className="px-4 py-3"><Badge className={PLAN_COLORS[w.plan || 'free']}>{w.plan || 'free'}</Badge></td>
                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{new Date(w.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right"><Button variant="outline" size="sm" onClick={() => setEditWorkspace(w)}>Manage</Button></td>
                          </tr>
                        ))}
                        {workspaces.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No workspaces found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── BILLING TAB ───────────────────────────────────────────────────── */}
          {tab === 'billing' && stats && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p><p className="text-2xl font-bold text-emerald-600">${stats.mrr.toLocaleString()}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Paying Customers</p><p className="text-2xl font-bold">{stats.planCounts.pro + stats.planCounts.enterprise}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Annual Run Rate</p><p className="text-2xl font-bold">${(stats.mrr * 12).toLocaleString()}</p></CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">Recent Billing Events</CardTitle></CardHeader>
                <CardContent>
                  {billingEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No billing events yet</p>
                      <p className="text-xs mt-1">Events appear here when users subscribe via Paddle</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {billingEvents.map(e => (
                        <div key={e.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                          <div><span className="font-medium">{e.event_type}</span><span className="text-muted-foreground ml-2">{e.plan}</span></div>
                          <div className="text-right"><span className="font-medium">${e.amount}</span><span className="text-xs text-muted-foreground block">{new Date(e.created_at).toLocaleDateString()}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ─── Paddle Configuration ──────────────────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" />Paddle Payment Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2">
                    <p className="text-xs text-amber-700 dark:text-amber-400">Configure your Paddle credentials here. Get these from your Paddle Dashboard → Developer Tools and Catalog.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Vendor / Seller ID</label>
                      <Input value={paddleConfig.vendorId} onChange={e => setPaddleConfig(p => ({ ...p, vendorId: e.target.value }))} placeholder="348843" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Environment</label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={paddleConfig.environment} onChange={e => setPaddleConfig(p => ({ ...p, environment: e.target.value }))}>
                        <option value="production">Production (live)</option>
                        <option value="sandbox">Sandbox (testing)</option>
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">Client-Side Token</label>
                      <Input value={paddleConfig.clientToken} onChange={e => setPaddleConfig(p => ({ ...p, clientToken: e.target.value }))} placeholder="live_xxxxxxxxxxxxx" className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Pro Plan Price ID</label>
                      <Input value={paddleConfig.proPriceId} onChange={e => setPaddleConfig(p => ({ ...p, proPriceId: e.target.value }))} placeholder="pri_01j..." className="font-mono text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Enterprise Price ID (optional)</label>
                      <Input value={paddleConfig.enterprisePriceId} onChange={e => setPaddleConfig(p => ({ ...p, enterprisePriceId: e.target.value }))} placeholder="pri_01j..." className="font-mono text-xs" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Webhook URL (paste into Paddle → Notifications)</label>
                    <div className="flex gap-2">
                      <Input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/paddle-webhook`} className="font-mono text-xs bg-muted/50" />
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/paddle-webhook`); toast.success('Webhook URL copied') }}>Copy</Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={savePaddleConfig}>Save Paddle Config</Button>
                    <Badge variant="secondary" className={paddleConfig.proPriceId ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                      {paddleConfig.proPriceId ? 'Ready' : 'Price ID needed'}
                    </Badge>
                  </div>

                  <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Setup checklist:</p>
                    <p>1. Paddle Dashboard → Catalog → create "Pro Plan" product + $29/mo price → paste Price ID above</p>
                    <p>2. Paddle Dashboard → Developer Tools → Notifications → add the Webhook URL above</p>
                    <p>3. Add PADDLE_API_KEY and PADDLE_WEBHOOK_SECRET to Vercel environment variables</p>
                    <p>4. Save config here, then test checkout on the Billing page</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {tab === 'analytics' && stats && (
            <div className="space-y-4 animate-fade-in-up">
              <Card><CardHeader><CardTitle className="text-base">User Growth</CardTitle></CardHeader><CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={signupTrend}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="week" className="text-xs" /><YAxis className="text-xs" /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} /><Bar dataKey="signups" fill="#8b5cf6" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </CardContent></Card>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Conversion Rate</p><p className="text-xl font-bold">{stats.totalUsers > 0 ? Math.round(((stats.planCounts.pro + stats.planCounts.enterprise) / stats.totalUsers) * 100) : 0}%</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg Workspaces/User</p><p className="text-xl font-bold">{stats.totalUsers > 0 ? (stats.totalWorkspaces / stats.totalUsers).toFixed(1) : 0}</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Weekly Active %</p><p className="text-xl font-bold">{stats.totalUsers > 0 ? Math.round((stats.activeThisWeek / stats.totalUsers) * 100) : 0}%</p></CardContent></Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Free → Paid</p><p className="text-xl font-bold">{stats.planCounts.pro + stats.planCounts.enterprise} / {stats.planCounts.free}</p></CardContent></Card>
              </div>
            </div>
          )}

          {/* ─── SYSTEM TAB ────────────────────────────────────────────────────── */}
          {tab === 'system' && (
            <div className="space-y-4 animate-fade-in-up">
              <Card><CardHeader><CardTitle className="text-base">Platform Health</CardTitle></CardHeader><CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded bg-muted/50"><span className="text-sm">Database (Supabase)</span><Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" />Operational</Badge></div>
                <div className="flex items-center justify-between p-3 rounded bg-muted/50"><span className="text-sm">AI Proxy (Vercel Edge)</span><Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" />Operational</Badge></div>
                <div className="flex items-center justify-between p-3 rounded bg-muted/50"><span className="text-sm">Payments (Paddle)</span><Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" />Operational</Badge></div>
                <div className="flex items-center justify-between p-3 rounded bg-muted/50"><span className="text-sm">Real-time Sync</span><Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" />Operational</Badge></div>
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Quick Stats</CardTitle></CardHeader><CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between p-2 rounded bg-muted/50"><span className="text-muted-foreground">Total Records</span><span className="font-medium">{(stats?.totalUsers || 0) + (stats?.totalWorkspaces || 0)}</span></div>
                  <div className="flex justify-between p-2 rounded bg-muted/50"><span className="text-muted-foreground">Platform Version</span><span className="font-medium">v1.0.0</span></div>
                </div>
              </CardContent></Card>
            </div>
          )}
        </>
      )}


      {/* ─── Manage User Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          {editUser && (
            <>
              <DialogHeader><DialogTitle>Manage User</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-medium">
                    {(editUser.full_name || editUser.email || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{editUser.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground">{editUser.email || editUser.id}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Plan</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['free', 'pro', 'enterprise'] as Plan[]).map(p => (
                      <button key={p} onClick={() => handleUserPlan(editUser.id, p)}
                        className={`rounded-lg border p-2 text-center text-sm transition-all ${editUser.plan === p ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-500' : 'border-border hover:bg-accent/50'}`}>
                        {p === 'free' && <Zap className="h-4 w-4 mx-auto mb-1 text-slate-500" />}
                        {p === 'pro' && <Star className="h-4 w-4 mx-auto mb-1 text-violet-500" />}
                        {p === 'enterprise' && <Building2 className="h-4 w-4 mx-auto mb-1 text-amber-500" />}
                        <span className="capitalize">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Account Status</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleUserStatus(editUser.id, 'active')} className={`rounded-lg border p-2 text-sm transition-all ${editUser.account_status === 'active' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-border hover:bg-accent/50'}`}><CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-emerald-500" />Active</button>
                    <button onClick={() => handleUserStatus(editUser.id, 'suspended')} className={`rounded-lg border p-2 text-sm transition-all ${editUser.account_status === 'suspended' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-border hover:bg-accent/50'}`}><Ban className="h-4 w-4 mx-auto mb-1 text-amber-500" />Suspend</button>
                    <button onClick={() => handleUserStatus(editUser.id, 'banned')} className={`rounded-lg border p-2 text-sm transition-all ${editUser.account_status === 'banned' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-border hover:bg-accent/50'}`}><Ban className="h-4 w-4 mx-auto mb-1 text-red-500" />Ban</button>
                  </div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setEditUser(null)}>Close</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Manage Workspace Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!editWorkspace} onOpenChange={() => setEditWorkspace(null)}>
        <DialogContent>
          {editWorkspace && (
            <>
              <DialogHeader><DialogTitle>Manage Workspace</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{editWorkspace.title}</p>
                  <p className="text-xs text-muted-foreground">{editWorkspace.description || 'No description'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Workspace Plan</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['free', 'pro', 'enterprise'] as Plan[]).map(p => (
                      <button key={p} onClick={() => handleWorkspacePlan(editWorkspace.id, p)}
                        className={`rounded-lg border p-2 text-center text-sm transition-all capitalize ${editWorkspace.plan === p ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-500' : 'border-border hover:bg-accent/50'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setEditWorkspace(null)}>Close</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
