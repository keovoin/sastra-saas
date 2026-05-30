import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Check, Star, Zap, Building2, Receipt } from 'lucide-react'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'free', name: 'Free', price: '$0', period: '/forever',
    description: 'For individuals exploring the platform',
    features: ['1 project', '5 modules', '1 team member', 'Basic AI (5 calls/day)', 'Community support'],
    limits: { projects: 1, modules: 5, members: 1 },
    cta: 'Current Plan', disabled: true,
  },
  {
    id: 'pro', name: 'Pro', price: '$29', period: '/month',
    description: 'For growing teams that need more power',
    features: ['Unlimited projects', 'All 21+ modules', 'Up to 25 team members', 'Unlimited AI calls', 'Priority support', 'Custom branding', 'API access', 'Advanced analytics'],
    limits: { projects: -1, modules: -1, members: 25 },
    cta: 'Upgrade to Pro', disabled: false, popular: true,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 'Custom', period: '',
    description: 'For large organizations with specific needs',
    features: ['Everything in Pro', 'Unlimited team members', 'SSO / SAML', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'On-premise option', 'Audit logs', 'Data residency'],
    limits: { projects: -1, modules: -1, members: -1 },
    cta: 'Contact Sales', disabled: false,
  },
]


export function BillingPlans() {
  const [currentPlan] = useState('free')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10"><CreditCard className="h-6 w-6 text-amber-600" /></div>
        <div><h1 className="text-2xl font-bold">Billing & Plans</h1><p className="text-muted-foreground text-sm">Manage your subscription and billing</p></div>
      </div>

      {/* Current Usage */}
      <Card className="card-glow border-violet-200 dark:border-violet-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-xl font-bold">Free Plan</p>
            </div>
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">Active</Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div><p className="text-xs text-muted-foreground">Projects</p><p className="font-medium">1 / 1</p><div className="w-full bg-muted h-1.5 rounded mt-1"><div className="bg-violet-500 h-1.5 rounded w-full" /></div></div>
            <div><p className="text-xs text-muted-foreground">Modules</p><p className="font-medium">5 / 5</p><div className="w-full bg-muted h-1.5 rounded mt-1"><div className="bg-amber-500 h-1.5 rounded w-full" /></div></div>
            <div><p className="text-xs text-muted-foreground">Members</p><p className="font-medium">1 / 1</p><div className="w-full bg-muted h-1.5 rounded mt-1"><div className="bg-emerald-500 h-1.5 rounded w-full" /></div></div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => (
          <Card key={plan.id} className={`relative card-glow ${plan.popular ? 'border-violet-400 dark:border-violet-600 ring-2 ring-violet-200 dark:ring-violet-800' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white"><Star className="h-3 w-3 mr-1" />Most Popular</Badge>
              </div>
            )}
            <CardHeader className="pt-6">
              <CardTitle className="flex items-center gap-2">
                {plan.id === 'free' && <Zap className="h-5 w-5 text-emerald-500" />}
                {plan.id === 'pro' && <Star className="h-5 w-5 text-violet-500" />}
                {plan.id === 'enterprise' && <Building2 className="h-5 w-5 text-indigo-500" />}
                {plan.name}
              </CardTitle>
              <div className="mt-2"><span className="text-3xl font-bold">{plan.price}</span><span className="text-muted-foreground">{plan.period}</span></div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-emerald-500 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button className={`w-full ${plan.popular ? 'bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600' : ''}`}
                variant={plan.disabled ? 'secondary' : plan.popular ? 'default' : 'outline'}
                disabled={plan.disabled}
                onClick={() => toast.info('Payment integration coming soon!')}>
                {currentPlan === plan.id ? '✓ Current Plan' : plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Payment Method */}
      <Card>
        <CardHeader><CardTitle className="text-base">Payment Method</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-border text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground/30" />
            <div className="text-left">
              <p className="text-sm font-medium">Coming Soon — Stripe Integration</p>
              <p className="text-xs text-muted-foreground">Payment processing will be available in a future update</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" />Invoice History</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Receipt className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No invoices yet</p>
            <p className="text-xs text-muted-foreground mt-1">Invoices will appear here once you upgrade</p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Comparison */}
      <Card>
        <CardHeader><CardTitle className="text-base">Feature Comparison</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2 px-2">Feature</th><th className="text-center py-2 px-2">Free</th><th className="text-center py-2 px-2">Pro</th><th className="text-center py-2 px-2">Enterprise</th></tr></thead>
              <tbody>
                {[
                  ['Projects', '1', 'Unlimited', 'Unlimited'],
                  ['Modules', '5', '21+', '21+'],
                  ['Team Members', '1', '25', 'Unlimited'],
                  ['AI Calls', '5/day', 'Unlimited', 'Unlimited'],
                  ['File Storage', '100 MB', '10 GB', '100 GB'],
                  ['API Access', '—', '✓', '✓'],
                  ['SSO/SAML', '—', '—', '✓'],
                  ['Priority Support', '—', '✓', '✓'],
                  ['Custom Branding', '—', '✓', '✓'],
                  ['SLA Guarantee', '—', '—', '✓'],
                ].map(([feature, ...values], i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 px-2 font-medium">{feature}</td>
                    {values.map((v, j) => <td key={j} className="text-center py-2 px-2 text-muted-foreground">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
