// Vercel Serverless Function — receives Paddle webhook events
// Paddle sends: subscription.created, subscription.updated, subscription.canceled, transaction.completed
export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.text()
    const event = JSON.parse(body)

    // TODO: Verify webhook signature with PADDLE_WEBHOOK_SECRET
    // const signature = req.headers.get('paddle-signature')
    // For now, process events directly

    const eventType = event.event_type || event.alert_name
    const data = event.data || event

    console.log(`[Paddle Webhook] ${eventType}`, JSON.stringify(data).slice(0, 200))

    // Handle different event types
    switch (eventType) {
      case 'subscription.created':
      case 'subscription_created': {
        // User subscribed to Pro plan
        const customerId = data.customer_id || data.user_id
        const status = data.status || 'active'
        console.log(`[Paddle] Subscription created for customer: ${customerId}, status: ${status}`)
        // TODO: Update Supabase profiles table with plan = 'pro'
        // await supabase.from('profiles').update({ plan: 'pro' }).eq('paddle_customer_id', customerId)
        break
      }
      case 'subscription.updated':
      case 'subscription_updated': {
        const customerId = data.customer_id || data.user_id
        const status = data.status
        console.log(`[Paddle] Subscription updated for customer: ${customerId}, status: ${status}`)
        break
      }
      case 'subscription.canceled':
      case 'subscription_cancelled': {
        const customerId = data.customer_id || data.user_id
        console.log(`[Paddle] Subscription cancelled for customer: ${customerId}`)
        // TODO: Downgrade to free in Supabase
        // await supabase.from('profiles').update({ plan: 'free' }).eq('paddle_customer_id', customerId)
        break
      }
      case 'transaction.completed':
      case 'subscription_payment_succeeded': {
        const customerId = data.customer_id || data.user_id
        console.log(`[Paddle] Payment received from customer: ${customerId}`)
        break
      }
      default:
        console.log(`[Paddle] Unhandled event: ${eventType}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('[Paddle Webhook Error]', error?.message)
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
