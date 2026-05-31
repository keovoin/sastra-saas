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

// ─── AI Text Cleanup ─────────────────────────────────────────────────────────
// Strips markdown formatting from AI responses for clean UI display
export function cleanAIText(text: string): string {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── AI Usage Tracking ───────────────────────────────────────────────────────
const AI_USAGE_KEY = 'sastra-ai-usage'

export function getAIUsage(): { total: number; today: number; lastReset: string } {
  try {
    const data = JSON.parse(localStorage.getItem(AI_USAGE_KEY) || '{}')
    const today = new Date().toISOString().split('T')[0]
    if (data.lastReset !== today) return { total: data.total || 0, today: 0, lastReset: today }
    return data
  } catch { return { total: 0, today: 0, lastReset: new Date().toISOString().split('T')[0] } }
}

function trackAIUsage() {
  const usage = getAIUsage()
  const today = new Date().toISOString().split('T')[0]
  const updated = { total: usage.total + 1, today: (usage.lastReset === today ? usage.today : 0) + 1, lastReset: today }
  localStorage.setItem(AI_USAGE_KEY, JSON.stringify(updated))
}

// ─── Proxy Detection ─────────────────────────────────────────────────────────
function useProxy(): boolean {
  try {
    const setting = localStorage.getItem('sastra-ai-proxy')
    if (setting !== null) return setting === 'true'
    const baseUrl = localStorage.getItem('sastra-ai-url') || ''
    if (baseUrl.includes('openrouter') || baseUrl.includes('generativelanguage.googleapis')) return false
    return true
  } catch { return true }
}

// ─── Main AI Call ────────────────────────────────────────────────────────────
export async function askAI(prompt: string): Promise<AIResponse> {
  const apiKey = getStoredApiKey()
  const model = getStoredModel()
  const baseUrl = getStoredBaseUrl()

  if (!apiKey) {
    return { success: false, content: '', error: 'No API key configured. Go to Settings to add one.' }
  }

  if (!checkAIRateLimit()) {
    return { success: false, content: '', error: 'Rate limit exceeded. Please wait a moment before trying again.' }
  }

  const cleanPrompt = sanitizeInput(prompt)

  const requestBody = JSON.stringify({
    model,
    messages: [{ role: 'user', content: cleanPrompt }],
    temperature: 0.7,
    max_tokens: 1500,
  })

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    let response: Response

    if (useProxy()) {
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
      const endpoint = baseUrl.replace(/\/$/, '') + '/chat/completions'
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      }
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
      const errMsg = err?.error?.message
        || err?.error?.metadata?.raw
        || (typeof err?.error === 'string' ? err.error : null)
        || `API error ${response.status}: ${response.statusText}`
      return { success: false, content: '', error: errMsg }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    trackAIUsage()
    return { success: true, content: cleanAIText(content) }
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
          ? 'Proxy request failed. Make sure you are deployed on Vercel. For local dev, use Google AI Studio or OpenRouter (they support browser CORS).'
          : 'CORS error. Enable "Use Proxy" in Settings (requires Vercel deployment) or switch to Google AI Studio / OpenRouter.',
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
