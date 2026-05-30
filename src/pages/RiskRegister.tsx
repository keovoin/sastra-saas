import React, { useState, useMemo } from 'react'
import { useStore, RiskItem, RiskStatus } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Plus, ArrowUpDown, ShieldAlert, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

const statusVariant: Record<RiskStatus, 'danger' | 'success' | 'warning'> = {
  Active: 'danger',
  Mitigated: 'success',
  Watch: 'warning',
}

export function RiskRegister() {
  const { risks, addRisk, updateRisk } = useStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Form state
  const [formDescription, setFormDescription] = useState('')
  const [formProbability, setFormProbability] = useState(3)
  const [formImpact, setFormImpact] = useState(3)
  const [formOwner, setFormOwner] = useState('')
  const [formStatus, setFormStatus] = useState<RiskStatus>('Active')

  const sortedRisks = useMemo(() => {
    return [...risks].sort((a, b) =>
      sortDirection === 'desc' ? b.severity - a.severity : a.severity - b.severity
    )
  }, [risks, sortDirection])

  const openAddModal = () => {
    setEditingRisk(null)
    setFormDescription('')
    setFormProbability(3)
    setFormImpact(3)
    setFormOwner('')
    setFormStatus('Active')
    setModalOpen(true)
  }

  const openEditModal = (risk: RiskItem) => {
    setEditingRisk(risk)
    setFormDescription(risk.description)
    setFormProbability(risk.probability)
    setFormImpact(risk.impact)
    setFormOwner(risk.owner)
    setFormStatus(risk.status)
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!formDescription.trim() || !formOwner.trim()) return

    const severity = formProbability * formImpact
    const initials = formOwner
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()

    if (editingRisk) {
      updateRisk(editingRisk.id, {
        description: formDescription,
        probability: formProbability,
        impact: formImpact,
        severity,
        owner: formOwner,
        ownerAvatar: initials,
        status: formStatus,
      })
      toast.success('Risk updated successfully')
    } else {
      const newId = `RSK-${String(risks.length + 1).padStart(3, '0')}`
      addRisk({
        id: newId,
        description: formDescription,
        probability: formProbability,
        impact: formImpact,
        severity,
        owner: formOwner,
        ownerAvatar: initials,
        status: formStatus,
      })
      toast.success('New risk added to register')
    }
    setModalOpen(false)
  }

  const totalRisks = risks.length
  const activeRisks = risks.filter((r) => r.status === 'Active').length
  const highSeverityRisks = risks.filter((r) => r.severity > 15).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Risk Register</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track, assess, and manage organizational risks. Sorted by severity automatically.
          </p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Risk
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-slate-100 p-2.5">
              <ShieldAlert className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalRisks}</p>
              <p className="text-xs text-slate-500">Total Risks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-red-100 p-2.5">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeRisks}</p>
              <p className="text-xs text-slate-500">Active Risks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-orange-100 p-2.5">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{highSeverityRisks}</p>
              <p className="text-xs text-slate-500">High Severity (&gt;15)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Risk Assessment Matrix</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
              className="gap-1 text-xs"
            >
              <ArrowUpDown className="h-3 w-3" />
              Severity {sortDirection === 'desc' ? '(High → Low)' : '(Low → High)'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Risk Description</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-500">Prob</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-500">Impact</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-500">Severity</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Owner</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500"></th>
                </tr>
              </thead>
              <tbody>
                {sortedRisks.map((risk) => (
                  <tr
                    key={risk.id}
                    className={`border-b border-slate-50 transition-colors hover:bg-slate-50 ${
                      risk.severity > 15 ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{risk.id}</td>
                    <td className="max-w-xs px-4 py-3 text-slate-700">{risk.description}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-xs font-medium">
                        {risk.probability}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-xs font-medium">
                        {risk.impact}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          risk.severity > 15
                            ? 'bg-red-100 text-red-700'
                            : risk.severity > 9
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {risk.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[10px] font-medium text-white">
                          {risk.ownerAvatar}
                        </div>
                        <span className="text-slate-700">{risk.owner}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[risk.status]}>{risk.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(risk)}
                        className="text-xs text-slate-500"
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRisk ? 'Edit Risk' : 'Add New Risk'}</DialogTitle>
            <DialogDescription>
              {editingRisk ? 'Update risk assessment details.' : 'Register a new risk in the system.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="risk-desc">Risk Description</Label>
              <Input
                id="risk-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe the risk scenario..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Probability (1-5)</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setFormProbability(n)}
                      className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                        formProbability === n
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Impact (1-5)</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setFormImpact(n)}
                      className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                        formImpact === n
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">
                Calculated Severity:{' '}
                <span className="font-bold text-slate-900">{formProbability * formImpact}</span>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-owner">Owner</Label>
              <Input
                id="risk-owner"
                value={formOwner}
                onChange={(e) => setFormOwner(e.target.value)}
                placeholder="Full name of risk owner..."
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                {(['Active', 'Watch', 'Mitigated'] as RiskStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFormStatus(s)}
                    className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                      formStatus === s
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formDescription.trim() || !formOwner.trim()}>
              {editingRisk ? 'Save Changes' : 'Add Risk'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
