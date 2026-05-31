import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { FileText, Plus, Sparkles, DollarSign, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAI } from '@/lib/ai'

type InvoiceStatus = 'paid' | 'pending' | 'overdue'

interface Invoice {
  id: string
  invoiceNumber: string
  client: string
  amount: number
  status: InvoiceStatus
  dueDate: string
  issuedDate: string
  remark: string
  referenceId: string
}


const initialInvoices: Invoice[] = [
  { id: '1', invoiceNumber: 'INV-001', client: 'Acme Corp', amount: 12500, status: 'paid', dueDate: '2025-02-28', issuedDate: '2025-02-01', remark: 'Q1 retainer', referenceId: 'PO-4521' },
  { id: '2', invoiceNumber: 'INV-002', client: 'TechFlow Inc', amount: 8750, status: 'paid', dueDate: '2025-03-05', issuedDate: '2025-02-05', remark: 'Consulting phase 1', referenceId: 'PO-4533' },
  { id: '3', invoiceNumber: 'INV-003', client: 'DataVault Systems', amount: 24000, status: 'pending', dueDate: '2025-04-20', issuedDate: '2025-03-20', remark: 'Platform license (annual)', referenceId: 'PO-4601' },
  { id: '4', invoiceNumber: 'INV-004', client: 'CloudNine Solutions', amount: 15800, status: 'pending', dueDate: '2025-04-25', issuedDate: '2025-03-25', remark: '', referenceId: 'PO-4612' },
  { id: '5', invoiceNumber: 'INV-005', client: 'Quantum Analytics', amount: 6200, status: 'overdue', dueDate: '2025-02-15', issuedDate: '2025-01-15', remark: 'Follow up sent', referenceId: '' },
  { id: '6', invoiceNumber: 'INV-006', client: 'NovaTech Labs', amount: 31000, status: 'paid', dueDate: '2025-03-01', issuedDate: '2025-02-01', remark: 'Enterprise plan', referenceId: 'PO-4480' },
  { id: '7', invoiceNumber: 'INV-007', client: 'Meridian Health', amount: 18500, status: 'overdue', dueDate: '2025-02-20', issuedDate: '2025-01-20', remark: 'Dispute in progress', referenceId: 'PO-4445' },
  { id: '8', invoiceNumber: 'INV-008', client: 'Synapse Digital', amount: 9400, status: 'pending', dueDate: '2025-04-30', issuedDate: '2025-03-30', remark: 'Monthly subscription', referenceId: 'PO-4650' },
  { id: '9', invoiceNumber: 'INV-009', client: 'Apex Ventures', amount: 42000, status: 'paid', dueDate: '2025-03-10', issuedDate: '2025-02-10', remark: 'Integration project', referenceId: 'PO-4501' },
  { id: '10', invoiceNumber: 'INV-010', client: 'Horizon Labs', amount: 7800, status: 'pending', dueDate: '2025-05-01', issuedDate: '2025-04-01', remark: '', referenceId: 'PO-4670' },
]


export function InvoiceTracker() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [showForm, setShowForm] = useState(false)
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [newInvoice, setNewInvoice] = useState({
    client: '', amount: '', dueDate: '', status: 'pending' as InvoiceStatus, remark: '', referenceId: '',
  })

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)

  const addInvoice = () => {
    if (!newInvoice.client || !newInvoice.amount || !newInvoice.dueDate) {
      toast.error('Please fill in client, amount, and due date')
      return
    }
    const invoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
      client: newInvoice.client,
      amount: parseFloat(newInvoice.amount),
      status: newInvoice.status,
      dueDate: newInvoice.dueDate,
      issuedDate: new Date().toISOString().split('T')[0],
      remark: newInvoice.remark,
      referenceId: newInvoice.referenceId,
    }
    setInvoices(prev => [...prev, invoice])
    setNewInvoice({ client: '', amount: '', dueDate: '', status: 'pending', remark: '', referenceId: '' })
    setShowForm(false)
    toast.success(`Invoice ${invoice.invoiceNumber} created`)
  }


  const forecastRevenue = async () => {
    setAiLoading(true)
    const prompt = `You are a financial analyst. Based on this invoice data, forecast revenue for the next 3 months:

Paid invoices total: $${totalRevenue.toLocaleString()}
Pending invoices: $${pendingAmount.toLocaleString()}
Overdue invoices: $${overdueAmount.toLocaleString()}
Total invoices: ${invoices.length}
Average invoice value: $${Math.round(invoices.reduce((s, i) => s + i.amount, 0) / invoices.length).toLocaleString()}

Recent clients: ${invoices.map(i => i.client).join(', ')}

Provide a 3-month revenue forecast with assumptions. Include:
1. Expected collections from pending/overdue
2. Projected new revenue based on trends
3. Risk factors
4. Total projected revenue per month

Keep it concise and actionable.`

    const result = await askAI(prompt)
    setAiLoading(false)
    if (result.success) {
      setAiInsight(result.content)
      toast.success('Revenue forecast generated')
    } else {
      toast.error(result.error || 'AI forecast failed')
    }
  }

  const statusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200'
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10">
            <FileText className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoice Tracker</h1>
            <p className="text-muted-foreground">Manage invoices, track payments, and monitor revenue</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAIConfigured() && (
            <Button variant="outline" onClick={forecastRevenue} disabled={aiLoading}>
              <Sparkles className="h-4 w-4 mr-2" />
              {aiLoading ? 'Forecasting...' : 'AI Forecast Revenue'}
            </Button>
          )}
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" /> New Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Total Revenue (Paid)</span>
            </div>
            <p className="text-2xl font-bold text-green-700">${totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-muted-foreground">Pending Amount</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700">${pendingAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Overdue Amount</span>
            </div>
            <p className="text-2xl font-bold text-red-700">${overdueAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>


      {/* Add Invoice Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input placeholder="Company name" value={newInvoice.client} onChange={e => setNewInvoice(p => ({ ...p, client: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input type="number" placeholder="10000" value={newInvoice.amount} onChange={e => setNewInvoice(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={newInvoice.dueDate} onChange={e => setNewInvoice(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Reference ID</Label>
                <Input placeholder="PO-12345" value={newInvoice.referenceId} onChange={e => setNewInvoice(p => ({ ...p, referenceId: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Remark</Label>
                <Input placeholder="Optional note..." value={newInvoice.remark} onChange={e => setNewInvoice(p => ({ ...p, remark: e.target.value }))} />
              </div>
              <div className="flex items-end">
                <Button onClick={addInvoice} className="w-full">Create Invoice</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>{invoices.length} total invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground">Invoice #</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Issued</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-mono text-foreground">{invoice.invoiceNumber}</td>
                    <td className="p-3 text-foreground">{invoice.client}</td>
                    <td className="p-3 text-right font-medium text-foreground">${invoice.amount.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <Badge className={statusColor(invoice.status)}>{invoice.status}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{invoice.issuedDate}</td>
                    <td className="p-3 text-muted-foreground">{invoice.dueDate}</td>
                    <td className="p-3 text-right">
                      {invoice.status !== 'paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setInvoices(prev => prev.map(i => i.id === invoice.id ? { ...i, status: 'paid' } : i))
                            toast.success(`${invoice.invoiceNumber} marked as paid`)
                          }}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>


      {/* AI Forecast */}
      {aiInsight && (
        <Card className="border-purple-200 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Revenue Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{aiInsight}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
