/**
 * Security utilities for Sastra Business OS
 * - Input sanitization (XSS prevention)
 * - Rate limiting for AI calls
 * - Secure localStorage wrapper
 * - Content Security Policy helpers
 */

// ─── Input Sanitization (XSS Prevention) ─────────────────────────────────────

const DANGEROUS_PATTERNS = [
  /<script[\s>]/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<link/gi,
  /data:text\/html/gi,
]

/**
 * Sanitize user input to prevent XSS attacks.
 * Strips HTML tags and dangerous patterns while preserving safe text content.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''

  // Strip HTML tags
  let clean = input.replace(/<[^>]*>/g, '')

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    clean = clean.replace(pattern, '')
  }

  // Trim and limit length
  return clean.trim().slice(0, 10000)
}

/**
 * Sanitize an object's string values recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj }
  for (const key of Object.keys(result)) {
    const value = result[key]
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeInput(value)
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = value.map((v) =>
        typeof v === 'string' ? sanitizeInput(v) : v
      )
    }
  }
  return result
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number
  firstRequest: number
}

const rateLimits = new Map<string, RateLimitEntry>()

/**
 * Simple client-side rate limiter.
 * Returns true if the action is allowed, false if rate-limited.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const entry = rateLimits.get(key)

  if (!entry || now - entry.firstRequest > windowMs) {
    rateLimits.set(key, { count: 1, firstRequest: now })
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count++
  return true
}

/**
 * Rate limit specifically for AI API calls.
 * Default: 20 requests per minute per user.
 */
export function checkAIRateLimit(): boolean {
  return checkRateLimit('ai-api', 20, 60000)
}

// ─── Secure localStorage Wrapper ──────────────────────────────────────────────

const STORAGE_PREFIX = 'sastra-'

/**
 * Safely get item from localStorage with error handling.
 * Never throws — returns defaultValue on any error.
 */
export function secureGetItem(key: string, defaultValue: string = ''): string {
  try {
    const value = localStorage.getItem(STORAGE_PREFIX + key)
    return value ?? defaultValue
  } catch {
    // localStorage unavailable (private browsing, storage full, etc.)
    return defaultValue
  }
}

/**
 * Safely set item in localStorage with error handling and size limit.
 * Never throws — silently fails on error.
 */
export function secureSetItem(key: string, value: string, maxSizeKB: number = 100): boolean {
  try {
    // Check size limit (prevent localStorage bloat)
    if (value.length > maxSizeKB * 1024) {
      console.warn(`[Security] Attempted to store ${(value.length / 1024).toFixed(1)}KB in "${key}" (limit: ${maxSizeKB}KB)`)
      return false
    }

    localStorage.setItem(STORAGE_PREFIX + key, value)
    return true
  } catch {
    // Storage full or unavailable
    return false
  }
}

/**
 * Safely remove item from localStorage.
 */
export function secureRemoveItem(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key)
  } catch {
    // Silently fail
  }
}

// ─── API Key Validation ───────────────────────────────────────────────────────

/**
 * Basic validation that an API key looks legitimate.
 * Does NOT verify the key works — just checks format.
 */
export function validateApiKeyFormat(key: string): boolean {
  if (!key || key.length < 10) return false
  // OpenAI keys start with sk-
  // Groq keys start with gsk_
  // Together keys start with various prefixes
  // Accept any key that's at least 20 chars and alphanumeric-ish
  return key.length >= 20 && /^[a-zA-Z0-9_\-]+$/.test(key)
}

// ─── Environment Validation ───────────────────────────────────────────────────

/**
 * Validate that required environment variables are present.
 * Called on app initialization.
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
  const missing = required.filter((key) => !import.meta.env[key])
  return { valid: missing.length === 0, missing }
}

// ─── Content Security ─────────────────────────────────────────────────────────

/**
 * Escape HTML entities to prevent injection when rendering dynamic content.
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char] || char)
}
