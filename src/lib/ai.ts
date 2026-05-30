import { getStoredApiKey, getStoredModel, getStoredBaseUrl } from '@/pages/Settings'

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

  try {
    const endpoint = baseUrl.replace(/\/$/, '') + '/chat/completions'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return { success: false, content: '', error: err?.error?.message || `API error: ${response.status}` }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    return { success: true, content }
  } catch (error: any) {
    return { success: false, content: '', error: error.message || 'Connection failed' }
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
