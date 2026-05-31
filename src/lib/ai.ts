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

// ─── User-Friendly Error Messages ────────────────────────────────────────────
// Maps technical errors to clean messages for end users
function userFriendlyError(technicalError: string, statusCode?: number): string {
  // Log technical error for admin debugging (console only)
  console.error('[AI Error]', technicalError)

  // Rate limiting
  if (technicalError.includes('rate') || technicalError.includes('429') || statusCode === 429) {
    return 'AI is busy right now. Please try again in a moment.'
  }
  // Auth errors
  if (technicalError.includes('401') || technicalError.includes('auth') || technicalError.includes('invalid_api_key') || statusCode === 401) {
    return 'AI connection issue. Please check your settings.'
  }
  // Model not found
  if (technicalError.includes('model') && (technicalError.includes('not found') || technicalError.includes('does not exist'))) {
    return 'AI model unavailable. Please try a different model in Settings.'
  }
  // Timeout
  if (technicalError.includes('timeout') || technicalError.includes('timed out')) {
    return 'AI took too long to respond. Please try again.'
  }
  // Network / CORS
  if (technicalError.includes('fetch') || technicalError.includes('Network') || technicalError.includes('CORS')) {
    return 'Unable to reach AI service. Please check your connection.'
  }
  // Provider errors (OpenRouter, Groq)
  if (technicalError.includes('provider') || technicalError.includes('upstream')) {
    return 'AI service temporarily unavailable. Please try again shortly.'
  }
  // Quota / billing
  if (technicalError.includes('quota') || technicalError.includes('insufficient') || technicalError.includes('billing')) {
    return 'AI usage limit reached. Please check your AI provider account.'
  }
  // Generic fallback — don't expose raw error to user
  return 'Something went wrong with AI. Please try again.'
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
    return { success: false, content: '', error: 'AI is not configured yet. Ask your admin to set it up in Settings.' }
  }

  if (!checkAIRateLimit()) {
    return { success: false, content: '', error: 'AI is busy right now. Please try again in a moment.' }
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
      const technicalMsg = err?.error?.message
        || err?.error?.metadata?.raw
        || (typeof err?.error === 'string' ? err.error : null)
        || `HTTP ${response.status}`
      return { success: false, content: '', error: userFriendlyError(technicalMsg, response.status) }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    trackAIUsage()
    return { success: true, content: cleanAIText(content) }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, content: '', error: 'AI took too long to respond. Please try again.' }
    }
    const message = error instanceof Error ? error.message : 'Connection failed'
    return { success: false, content: '', error: userFriendlyError(message) }
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
    return { success: false, data: null, error: 'AI returned an unexpected format. Please try again.' }
  }
}
