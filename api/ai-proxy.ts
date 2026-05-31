// Vercel Edge Function — proxies AI requests to avoid CORS issues
// This runs on Vercel's edge network, NOT in the browser
export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-AI-Base-URL, X-AI-Key',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const baseUrl = req.headers.get('X-AI-Base-URL') || 'https://api.groq.com/openai/v1'
    const apiKey = req.headers.get('X-AI-Key')

    if (!apiKey) {
      return new Response(JSON.stringify({ error: { message: 'No API key provided' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const body = await req.text()
    const endpoint = baseUrl.replace(/\/$/, '') + '/chat/completions'

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }

    // OpenRouter requires HTTP-Referer
    if (baseUrl.includes('openrouter')) {
      headers['HTTP-Referer'] = req.headers.get('origin') || 'https://sastratech.vercel.app'
      headers['X-Title'] = 'Sastra Business OS'
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
    })

    const data = await response.text()

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: { message: error?.message || 'Proxy error' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
