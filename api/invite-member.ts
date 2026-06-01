// Vercel Edge Function — sends a workspace invitation email via Supabase Admin
// and records a pending row in workspace_invitations.
//
// This runs on Vercel's edge network (NOT in the browser) so it can safely use
// the SUPABASE_SERVICE_ROLE_KEY. Never expose that key to the client.
//
// Required environment variables (set in Vercel project settings):
//   SUPABASE_URL                — e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   — service_role secret (server-side only)
export const config = { runtime: 'edge' }

interface InviteBody {
  email?: string
  workspaceId?: string
  workspaceSlug?: string
  role?: string
  department?: string
  inviterName?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(
      { error: 'Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.' },
      500
    )
  }

  let payload: InviteBody
  try {
    payload = (await req.json()) as InviteBody
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  const email = (payload.email || '').trim().toLowerCase()
  const { workspaceId, workspaceSlug } = payload
  const role = payload.role || 'member'
  const department = payload.department || ''

  if (!email || !workspaceId || !workspaceSlug) {
    return json({ error: 'email, workspaceId and workspaceSlug are required.' }, 400)
  }

  // Pin the redirect base to a server-configured URL when available, so a
  // spoofed Origin header can't turn the invite email / link into a phishing
  // redirect. Falls back to the request origin for local/preview deploys.
  const origin = process.env.APP_URL || req.headers.get('origin') || new URL(req.url).origin
  const redirectTo = `${origin}/accept-invite?ws=${encodeURIComponent(workspaceSlug)}`

  // A token we also store on our invitation row so the accept flow can verify.
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const adminHeaders = {
    'Content-Type': 'application/json',
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  }

  // ─── 0. AUTHENTICATE THE CALLER & VERIFY OWNERSHIP ─────────────────────────
  // This endpoint wields the service-role key (bypasses RLS), so it MUST verify
  // that the caller is signed in and actually owns the target workspace. Without
  // this, anyone could relay invite emails or self-invite into any workspace.
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || ''
  const accessToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
  if (!accessToken) {
    return json({ error: 'Not authenticated. Please sign in again.' }, 401)
  }

  let callerId = ''
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${accessToken}` },
    })
    if (!userRes.ok) return json({ error: 'Invalid or expired session.' }, 401)
    const user: any = await userRes.json()
    callerId = user?.id || ''
  } catch {
    return json({ error: 'Could not verify your session.' }, 401)
  }
  if (!callerId) return json({ error: 'Could not verify your session.' }, 401)

  // The caller must own the workspace they're inviting into.
  try {
    const ownerRes = await fetch(
      `${SUPABASE_URL}/rest/v1/workspaces?id=eq.${encodeURIComponent(workspaceId)}` +
        `&owner_id=eq.${encodeURIComponent(callerId)}&select=id`,
      { headers: adminHeaders }
    )
    const rows: unknown = ownerRes.ok ? await ownerRes.json() : []
    if (!Array.isArray(rows) || rows.length === 0) {
      return json({ error: 'You do not have permission to invite members to this workspace.' }, 403)
    }
  } catch {
    return json({ error: 'Could not verify workspace permissions.' }, 403)
  }

  // ─── 1. Send the Supabase invite email ─────────────────────────────────────
  let inviteEmailFailed = false
  let inviteEmailError = ''
  try {
    const inviteRes = await fetch(`${SUPABASE_URL}/auth/v1/invite`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        email,
        data: {
          workspace_id: workspaceId,
          workspace_slug: workspaceSlug,
          role,
          department,
          invite_token: token,
          inviter_name: payload.inviterName || '',
        },
        redirect_to: redirectTo,
      }),
    })

    if (!inviteRes.ok) {
      inviteEmailFailed = true
      const errText = await inviteRes.text().catch(() => '')
      let parsed: any = null
      try { parsed = JSON.parse(errText) } catch { /* keep raw */ }
      inviteEmailError =
        parsed?.msg || parsed?.error_description || parsed?.message || errText || `HTTP ${inviteRes.status}`
    }
  } catch (err: any) {
    inviteEmailFailed = true
    inviteEmailError = err?.message || 'Failed to reach Supabase invite endpoint.'
  }

  // ─── 2. Record the pending invitation row (REST) ───────────────────────────
  // We do this even if the email failed, so the owner can fall back to a
  // copy-paste invite link.
  let invitationRecorded = false
  let invitationError = ''
  try {
    const restRes = await fetch(`${SUPABASE_URL}/rest/v1/workspace_invitations`, {
      method: 'POST',
      headers: {
        ...adminHeaders,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        email,
        role,
        department,
        token,
        status: 'pending',
        expires_at: expiresAt,
      }),
    })
    if (restRes.ok) {
      invitationRecorded = true
    } else {
      const errText = await restRes.text().catch(() => '')
      invitationError = errText || `HTTP ${restRes.status}`
    }
  } catch (err: any) {
    invitationError = err?.message || 'Failed to record invitation.'
  }

  // Fallback link the client can show/copy if the email did not send.
  const inviteLink = `${redirectTo}&token=${token}`

  // If the email failed AND we couldn't even record the invitation, surface a
  // clean error.
  if (inviteEmailFailed && !invitationRecorded) {
    return json(
      {
        error: `Could not send invite: ${inviteEmailError || invitationError || 'unknown error'}`,
        inviteLink,
      },
      502
    )
  }

  // Email failed but invitation was recorded — let the client offer the link.
  if (inviteEmailFailed) {
    return json({
      success: true,
      emailSent: false,
      warning: `Invitation recorded, but the email could not be sent (${inviteEmailError}). Share the invite link manually.`,
      inviteLink,
      token,
    })
  }

  return json({
    success: true,
    emailSent: true,
    invitationRecorded,
    inviteLink,
    token,
  })
}
