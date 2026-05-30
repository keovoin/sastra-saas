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

  try {
    const endpoint = baseUrl.replace(/\/$/, '') + '/chat/completions'
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: cleanPrompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    })

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
