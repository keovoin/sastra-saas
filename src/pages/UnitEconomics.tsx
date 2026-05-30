import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calculator, Sparkles, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'
import { toast } from 'sonner'
import { isAIConfigured, askAI } from '@/lib/ai'

interface Metrics {
  arpu: number
  cac: number
  churnRate: number
  grossMargin: number
  expansionRevenue: number
}

export function UnitEconomics() {
  const [metrics, setMetrics] = useState<Metrics>({
    arpu: 0,
    cac: 0,
    churnRate: 0,
    grossMargin: 0,
    expansionRevenue: 0,
  })
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Calculations
  const monthlyChurn = metrics.churnRate / 100
  const ltv = monthlyChurn > 0 ? (metrics.arpu * (metrics.grossMargin / 100)) / monthlyChurn : 0
  const ltvCacRatio = metrics.cac > 0 ? ltv / metrics.cac : 0
  const paybackMonths = metrics.arpu > 0 ? metrics.cac / (metrics.arpu * (metrics.grossMargin / 100)) : 0
  const monthlyExpansion = metrics.arpu * (metrics.expansionRevenue / 100)

  const isLtvHealthy = ltvCacRatio >= 3
  const isPaybackHealthy = paybackMonths <= 12
  const isChurnHealthy = metrics.churnRate <= 5
  const isMarginHealthy = metrics.grossMargin >= 70

  const analyzeHealth = async () => {
    setAiLoading(true)
    const prompt = `You are a SaaS finance expert. Analyze these unit economics and provide 3-4 specific recommendations:

Metrics:
- ARPU: $${metrics.arpu}/month
- CAC: $${metrics.cac}
- Monthly Churn Rate: ${metrics.churnRate}%
- Gross Margin: ${metrics.grossMargin}%
- LTV: $${ltv.toFixed(0)}
- LTV:CAC Ratio: ${ltvCacRatio.toFixed(1)}x
- Payback Period: ${paybackMonths.toFixed(1)} months
- Monthly Expansion Revenue: $${monthlyExpansion.toFixed(0)}

Industry benchmarks: LTV:CAC > 3x is good, payback < 12 months is healthy, churn < 5% monthly is acceptable for SMB SaaS.

Give specific, actionable recommendations. Format as numbered list.`

    const result = await askAI(prompt)
    setAiLoading(false)
    if (result.success) {
      setAiInsight(result.content)
      toast.success('Health analysis complete')
    } else {
      toast.error(result.error || 'AI analysis failed')
    }
  }

  const updateMetric = (key: keyof Metrics, value: string) => {
    const num = parseFloat(value) || 0
    setMetrics(prev => ({ ...prev, [key]: num }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Calculator className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Unit Economics</h1>
            <p className="text-muted-foreground">Monitor customer lifetime value, acquisition costs, and payback metrics</p>
          </div>
        </div>
        {isAIConfigured() && (
          <Button onClick={analyzeHealth} disabled={aiLoading}>
            <Sparkles className="h-4 w-4 mr-2" />
            {aiLoading ? 'Analyzing...' : 'AI Analyze Health'}
          </Button>
        )}
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Input Metrics</CardTitle>
          <CardDescription>Enter your current SaaS metrics to calculate unit economics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1" title="Average Revenue Per User — monthly revenue divided by total active users">
                <DollarSign className="h-3 w-3" /> ARPU ($/month)
              </Label>
              <Input
                type="number"
                value={metrics.arpu || ''}
                onChange={e => updateMetric('arpu', e.target.value)}
                placeholder="e.g. 89"
              />
              <p className="text-[10px] text-muted-foreground">Monthly revenue ÷ active users</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1" title="Customer Acquisition Cost — total sales & marketing spend divided by new customers acquired">
                <DollarSign className="h-3 w-3" /> CAC ($)
              </Label>
              <Input
                type="number"
                value={metrics.cac || ''}
                onChange={e => updateMetric('cac', e.target.value)}
                placeholder="e.g. 320"
              />
              <p className="text-[10px] text-muted-foreground">Total S&M spend ÷ new customers</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1" title="Monthly Churn Rate — percentage of customers lost per month. Below 5% is healthy for SMB SaaS.">
                <Percent className="h-3 w-3" /> Monthly Churn (%)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={metrics.churnRate || ''}
                placeholder="e.g. 4.5"
                onChange={e => updateMetric('churnRate', e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">% customers lost monthly (&lt;5% healthy)</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1" title="Gross Margin — revenue minus COGS as a percentage. Above 70% is excellent for SaaS.">
                <Percent className="h-3 w-3" /> Gross Margin (%)
              </Label>
              <Input
                type="number"
                value={metrics.grossMargin || ''}
                placeholder="e.g. 72"
                onChange={e => updateMetric('grossMargin', e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">Revenue minus COGS (≥70% is great)</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1" title="Expansion Revenue — percentage of additional revenue from existing customers through upsells and cross-sells">
                <TrendingUp className="h-3 w-3" /> Expansion Rev (%)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={metrics.expansionRevenue || ''}
                placeholder="e.g. 12"
                onChange={e => updateMetric('expansionRevenue', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`border-2 ${isLtvHealthy ? 'border-green-200 bg-green-500/5' : 'border-red-200 bg-red-500/5'}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Lifetime Value (LTV)</span>
              {isLtvHealthy ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
            </div>
            <p className={`text-3xl font-bold ${isLtvHealthy ? 'text-green-700' : 'text-red-700'}`}>
              ${ltv.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Based on churn & margin</p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${isLtvHealthy ? 'border-green-200 bg-green-500/5' : 'border-red-200 bg-red-500/5'}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">LTV:CAC Ratio</span>
              <Badge variant={isLtvHealthy ? 'default' : 'destructive'} className="text-xs">
                {isLtvHealthy ? 'Healthy' : 'Low'}
              </Badge>
            </div>
            <p className={`text-3xl font-bold ${isLtvHealthy ? 'text-green-700' : 'text-red-700'}`}>
              {ltvCacRatio.toFixed(1)}x
            </p>
            <p className="text-xs text-muted-foreground mt-1">Target: {'>'}3x</p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${isPaybackHealthy ? 'border-green-200 bg-green-500/5' : 'border-red-200 bg-red-500/5'}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Payback Period</span>
              <Badge variant={isPaybackHealthy ? 'default' : 'destructive'} className="text-xs">
                {isPaybackHealthy ? 'Healthy' : 'Slow'}
              </Badge>
            </div>
            <p className={`text-3xl font-bold ${isPaybackHealthy ? 'text-green-700' : 'text-red-700'}`}>
              {paybackMonths.toFixed(1)} mo
            </p>
            <p className="text-xs text-muted-foreground mt-1">Target: {'<'}12 months</p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${isChurnHealthy ? 'border-green-200 bg-green-500/5' : 'border-red-200 bg-red-500/5'}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Monthly Expansion</span>
              {isMarginHealthy ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
            </div>
            <p className={`text-3xl font-bold ${isMarginHealthy ? 'text-green-700' : 'text-red-700'}`}>
              ${monthlyExpansion.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Per customer upsell</p>
          </CardContent>
        </Card>
      </div>

      {/* Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Health Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className={`w-3 h-3 rounded-full ${isLtvHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-foreground">LTV:CAC Ratio ({ltvCacRatio.toFixed(1)}x) — {isLtvHealthy ? 'Above 3x benchmark' : 'Below 3x benchmark'}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className={`w-3 h-3 rounded-full ${isPaybackHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-foreground">Payback ({paybackMonths.toFixed(1)} mo) — {isPaybackHealthy ? 'Within 12-month target' : 'Exceeds 12-month target'}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className={`w-3 h-3 rounded-full ${isChurnHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-foreground">Monthly Churn ({metrics.churnRate}%) — {isChurnHealthy ? 'Acceptable for SMB' : 'High churn risk'}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className={`w-3 h-3 rounded-full ${isMarginHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-foreground">Gross Margin ({metrics.grossMargin}%) — {isMarginHealthy ? 'Strong SaaS margins' : 'Below 70% target'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insight */}
      {aiInsight && (
        <Card className="border-purple-200 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Health Analysis
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
