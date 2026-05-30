import { getStoredApiKey, getStoredModel, getStoredBaseUrl } from '@/pages/Settings'
import { sanitizeInput, checkAIRateLimit } from '@/lib/security'

export interface AIResponse {
  success: boolean
  content: string
  error?: string
}

export function isAIConfigured(): boolean {
  return !!getStoredApiKey()
}

// Check if proxy mode is enabled (needed for Groq, Together AI, etc)
// OpenRouter supports direct browser CORS, so proxy is optional for it
function useProxy(): boolean {
  try {
    const setting = localStorage.getItem('sastra-ai-proxy')
    if (setting !== null) return setting === 'true'
    // Default: use proxy unless using OpenRouter (which supports CORS natively)
    const baseUrl = localStorage.getItem('sastra-ai-url') || ''
    if (baseUrl.includes('openrouter')) return false
    return true
  } catch { return true }
}

export async function askAI(prompt: string): Promise<AIResponse> {
  const apiKey = getStoredApiKey()
  const model = getStoredModel()
  const baseUrl = getStoredBaseUrl()

  if (!apiKey) {
    return { success: false, content: '', error: 'No API key configured. Go to Settings to add one.' }
  }

  // Rate limiting: max 20 AI calls per minute
  if (!checkAIRateLimit()) {
    return { success: false, content: '', error: 'Rate limit exceeded. Please wait a moment before trying again.' }
  }

  // Sanitize prompt to prevent injection
  const cleanPrompt = sanitizeInput(prompt)

  const requestBody = JSON.stringify({
    model,
    messages: [{ role: 'user', content: cleanPrompt }],
    temperature: 0.7,
    max_tokens: 1500,
  })

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

    let response: Response

    if (useProxy()) {
      // Route through Vercel Edge Function proxy to avoid CORS
      response = await fetch('/api/ai-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Base-URL': baseUrl,
          'X-AI-Key': apiKey,
        },
        body: requestBody,
        signal: controller.signal,
      })
    } else {
      // Direct request (works with OpenRouter which supports CORS)
      const endpoint = baseUrl.replace(/\/$/, '') + '/chat/completions'
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      }
      // OpenRouter requires HTTP-Referer for attribution
      if (baseUrl.includes('openrouter')) {
        headers['HTTP-Referer'] = window.location.origin
        headers['X-Title'] = 'Sastra Business OS'
      }
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: requestBody,
        signal: controller.signal,
      })
    }

    clearTimeout(timeout)

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return { success: false, content: '', error: err?.error?.message || `API error: ${response.status}` }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    return { success: true, content }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, content: '', error: 'Request timed out after 30 seconds.' }
    }
    const message = error instanceof Error ? error.message : 'Connection failed'
    if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('CORS')) {
      return {
        success: false,
        content: '',
        error: useProxy()
          ? 'Proxy request failed. Make sure you are deployed on Vercel (the proxy only works in production). For local dev, use OpenRouter which supports browser CORS.'
          : 'CORS error — your AI provider blocks browser requests. Enable "Use Proxy" in Settings (requires Vercel deployment) or switch to OpenRouter.',
      }
    }
    return { success: false, content: '', error: message }
  }
}

export async function askAIJson<T>(prompt: string): Promise<{ success: boolean; data: T | null; error?: string }> {
  const result = await askAI(prompt + '\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanation text before or after.')

  if (!result.success) return { success: false, data: null, error: result.error }

  try {
    const jsonStr = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(jsonStr) as T
    return { success: true, data: parsed }
  } catch {
    return { success: false, data: null, error: 'Failed to parse AI response as JSON' }
  }
}
