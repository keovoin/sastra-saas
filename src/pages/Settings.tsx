import React, { useState, useEffect } from 'react'
import { useBusinessOS } from '@/context/BusinessContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Key, Eye, EyeOff, CheckCircle2, Sparkles, AlertTriangle, ExternalLink, ShieldAlert } from 'lucide-react'
import { getAIUsage } from '@/lib/ai'
import { getWorkspaceName, getWorkspaceLogo, setWorkspaceBranding } from '@/lib/workspace'

// ─── API Configuration Storage Helpers ────────────────────────────────────────
const API_KEY_STORAGE = 'sastra-ai-key'
const API_MODEL_STORAGE = 'sastra-ai-model'
const API_URL_STORAGE = 'sastra-ai-url'
const API_PROVIDER_STORAGE = 'sastra-ai-provider'

export function getStoredApiKey(): string {
  try { return localStorage.getItem(API_KEY_STORAGE) || '' } catch { return '' }
}

export function getStoredModel(): string {
  try { return localStorage.getItem(API_MODEL_STORAGE) || 'gpt-4o-mini' } catch { return 'gpt-4o-mini' }
}

export function getStoredBaseUrl(): string {
  try { return localStorage.getItem(API_URL_STORAGE) || 'https://api.openai.com/v1' } catch { return 'https://api.openai.com/v1' }
}

export function getStoredProvider(): string {
  try { return localStorage.getItem(API_PROVIDER_STORAGE) || 'openai' } catch { return 'openai' }
}

export function Settings() {
  const { isAdmin } = useBusinessOS()
  // ─── API Key State ──────────────────────────────────────────────────────────
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1')
  const [provider, setProvider] = useState('openai')
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null)
  const [isTestingKey, setIsTestingKey] = useState(false)
  const [proxyEnabled, setProxyEnabled] = useState(() => {
    try {
      const setting = localStorage.getItem('sastra-ai-proxy')
      if (setting !== null) return setting === 'true'
      const url = localStorage.getItem('sastra-ai-url') || ''
      return !url.includes('openrouter')
    } catch { return true }
  })

  // ─── Workspace Branding State ───────────────────────────────────────────────
  const [workspaceName, setWorkspaceName] = useState(() => getWorkspaceName())
  const [workspaceLogo, setWorkspaceLogo] = useState(() => getWorkspaceLogo())

  // ─── AI Usage (refreshed on mount and after a successful test) ──────────────
  const [usage, setUsage] = useState(() => getAIUsage())

  const saveWorkspace = () => {
    setWorkspaceBranding(workspaceName, workspaceLogo)
    toast.success('Workspace branding updated! Refresh to see changes in sidebar.')
  }

  useEffect(() => {
    setApiKey(getStoredApiKey())
    setSelectedModel(getStoredModel())
    setBaseUrl(getStoredBaseUrl())
    setProvider(getStoredProvider())
    setUsage(getAIUsage())
    if (getStoredApiKey()) setIsKeyValid(true)
  }, [])

  const handleSaveApiKey = () => {
    localStorage.setItem(API_KEY_STORAGE, apiKey.trim())
    localStorage.setItem(API_MODEL_STORAGE, selectedModel)
    localStorage.setItem(API_URL_STORAGE, baseUrl.trim())
    localStorage.setItem(API_PROVIDER_STORAGE, provider)
    if (apiKey.trim()) {
      setIsKeyValid(true)
      toast.success('AI configuration saved', { description: `Provider: ${provider} | Model: ${selectedModel}` })
    } else {
      setIsKeyValid(null)
      toast.success('API key removed', { description: 'The AI Assistant will use built-in suggestions.' })
    }
  }

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key first')
      return
    }
    setIsTestingKey(true)
    try {
      let response: Response

      if (proxyEnabled) {
        response = await fetch('/api/ai-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AI-Base-URL': baseUrl.trim(),
            'X-AI-Key': apiKey.trim(),
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5,
          }),
        })
      } else {
        const testUrl = baseUrl.replace(/\/$/, '') + '/chat/completions'
        response = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5,
          }),
        })
      }

      if (response.ok) {
        setIsKeyValid(true)
        toast.success('Connection successful!', { description: `Model "${selectedModel}" responded${proxyEnabled ? ' via proxy' : ''}.` })
      } else {
        const err = await response.json().catch(() => ({}))
        setIsKeyValid(false)
        const errMsg = err?.error?.message || err?.error?.metadata?.raw || (typeof err?.error === 'string' ? err.error : null) || `HTTP ${response.status}`
        toast.error('Connection failed', { description: errMsg })
      }
    } catch (e: unknown) {
      setIsKeyValid(false)
      const msg = e instanceof Error ? e.message : 'Unknown error'
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        if (proxyEnabled) {
          toast.error('Proxy not reachable', { description: 'The AI proxy is only available after deploying to Vercel. For local dev, disable proxy and use OpenRouter (it supports browser CORS).' })
        } else {
          toast.error('CORS blocked by provider', { description: 'Groq/Together AI block browser requests. Enable "Use Server Proxy" toggle above and deploy to Vercel.' })
        }
      } else {
        toast.error('Connection failed', { description: msg })
      }
    }
    setUsage(getAIUsage())
    setIsTestingKey(false)
  }

  const handleSave = () => {
    toast.success('Settings saved successfully')
  }

  const maskedKey = apiKey ? `sk-...${apiKey.slice(-4)}` : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your workspace preferences, API keys, and team configuration.</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Non-admin notice */}
        {!isAdmin && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Viewer Access</p>
                <p className="text-xs text-muted-foreground">AI configuration and workspace settings are managed by your admin.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Workspace Branding ──────────────────────────────────────────────── */}
        {isAdmin && (<>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace Branding</CardTitle>
            <CardDescription>Customize your workspace name and logo mark</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Workspace Name</Label>
                <Input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} placeholder="My Company" />
              </div>
              <div className="space-y-2">
                <Label>Logo Mark (1-2 chars)</Label>
                <Input value={workspaceLogo} onChange={e => setWorkspaceLogo(e.target.value.slice(0, 2))} placeholder="S" maxLength={2} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">{workspaceLogo || 'S'}</div>
              <span className="text-lg font-bold">{workspaceName || 'Sastra'}</span>
              <span className="text-xs text-muted-foreground ml-auto">Preview</span>
            </div>
            <Button size="sm" onClick={saveWorkspace}>Save Branding</Button>
          </CardContent>
        </Card>

        {/* ─── AI Usage ────────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle className="text-base">AI Usage</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted"><p className="text-xs text-muted-foreground">Today</p><p className="text-2xl font-bold">{usage.today}</p></div>
              <div className="p-3 rounded-lg bg-muted"><p className="text-xs text-muted-foreground">All Time</p><p className="text-2xl font-bold">{usage.total}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* ─── AI / OpenAI API Key ──────────────────────────────────────────────── */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">AI Strategy Assistant</CardTitle>
                <CardDescription>Connect any OpenAI-compatible provider (Groq, Together, OpenRouter, etc). Your key stays in your browser.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Usage summary (also shown in the standalone AI Usage card above) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Requests Today</p>
                <p className="text-xl font-bold">{usage.today}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">All-Time Requests</p>
                <p className="text-xl font-bold">{usage.total}</p>
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
              isKeyValid === true ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' :
              isKeyValid === false ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30' :
              'border-border bg-muted/50'
            }`}>
              {isKeyValid === true && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              {isKeyValid === false && <AlertTriangle className="h-4 w-4 text-red-600" />}
              {isKeyValid === null && <Key className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm">
                {isKeyValid === true && 'API key configured and valid'}
                {isKeyValid === false && 'API key is invalid — please check and re-enter'}
                {isKeyValid === null && 'No API key set — using built-in suggestions'}
              </span>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setIsKeyValid(null) }}
                  placeholder="sk-proj-..."
                  className="pl-10 pr-10 font-mono text-sm"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your key is stored locally in your browser. It's never sent to our servers.
              </p>
            </div>

            {/* Provider Selection */}
            <div className="space-y-2">
              <Label>Provider</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'openai', label: 'OpenAI', url: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
                  { id: 'groq', label: 'Groq', url: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
                  { id: 'together', label: 'Together AI', url: 'https://api.together.xyz/v1', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
                  { id: 'openrouter', label: 'OpenRouter', url: 'https://openrouter.ai/api/v1', model: 'deepseek/deepseek-v4-flash:free' },
                  { id: 'ollama', label: 'Ollama (Local)', url: 'http://localhost:11434/v1', model: 'llama3' },
                  { id: 'custom', label: 'Custom', url: '', model: '' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProvider(p.id)
                      if (p.url) setBaseUrl(p.url)
                      // Default to a model the provider actually serves, so the
                      // Test Connection / first request doesn't fail with
                      // "model not found" (common when switching from OpenAI).
                      if (p.model) setSelectedModel(p.model)
                      // OpenRouter / Ollama support CORS natively — no proxy needed
                      if (p.id === 'openrouter' || p.id === 'ollama') {
                        setProxyEnabled(false)
                        localStorage.setItem('sastra-ai-proxy', 'false')
                      } else if (p.id !== 'custom') {
                        setProxyEnabled(true)
                        localStorage.setItem('sastra-ai-proxy', 'true')
                      }
                    }}
                    className={`rounded-lg border p-2.5 text-left transition-all ${
                      provider === p.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <p className="text-xs font-medium">{p.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Base URL */}
            <div className="space-y-2">
              <Label htmlFor="base-url">API Base URL</Label>
              <Input
                id="base-url"
                value={baseUrl}
                onChange={(e) => { setBaseUrl(e.target.value); setProvider('custom') }}
                placeholder="https://api.openai.com/v1"
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Must be OpenAI-compatible (supports /chat/completions endpoint).
                {provider === 'groq' && <span className="block mt-1 text-amber-600">Heads up: the "/openai/" in <code className="font-mono">https://api.groq.com/openai/v1</code> is just Groq's OpenAI-<em>compatible</em> path. It still uses YOUR Groq API key and Groq models (e.g. Llama 3.3) — nothing is sent to OpenAI. This is the correct URL; keep it as-is.</span>}
              </p>
            </div>

            {/* Proxy Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Use Server Proxy</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Required for Groq, Together AI, and most providers (they block browser CORS requests)</p>
                </div>
                <button
                  onClick={() => {
                    const current = localStorage.getItem('sastra-ai-proxy') !== 'false'
                    localStorage.setItem('sastra-ai-proxy', current ? 'false' : 'true')
                    setProxyEnabled(!current)
                    toast.success(current ? 'Direct mode (only works with OpenRouter/Ollama)' : 'Proxy enabled (works with all providers on Vercel)')
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${proxyEnabled ? 'bg-violet-600' : 'bg-muted'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${proxyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {!proxyEnabled && (
                <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2">
                  <p className="text-xs text-amber-700 dark:text-amber-400">⚠️ Direct mode only works with providers that allow CORS (OpenRouter, Ollama local). Groq and Together AI will fail without proxy.</p>
                </div>
              )}
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label>Model</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & cheap' },
                  { id: 'gpt-4o', label: 'GPT-4o', description: 'OpenAI (paid)' },
                  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', description: 'Groq (free)' },
                  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', description: 'Groq (fast/free)' },
                  { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 70B', description: 'Groq (reasoning)' },
                  { id: 'deepseek/deepseek-v4-flash:free', label: 'DeepSeek V4 Flash', description: 'OpenRouter (free)' },
                  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Google AI (free)' },
                  { id: 'claude-3.5-sonnet', label: 'Claude 3.5', description: 'OpenRouter' },
                ].map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`rounded-lg border p-2.5 text-left transition-all ${
                      selectedModel === model.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <p className="text-xs font-medium">{model.label}</p>
                    <p className="text-[10px] text-muted-foreground">{model.description}</p>
                  </button>
                ))}
              </div>
              <div className="space-y-2 pt-1">
                <Label htmlFor="custom-model" className="text-xs">Or type a custom model ID:</Label>
                <Input
                  id="custom-model"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  placeholder="e.g., meta-llama/Meta-Llama-3-8B"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={handleSaveApiKey} size="sm" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Save Key
              </Button>
              <Button onClick={handleTestKey} variant="outline" size="sm" disabled={!apiKey.trim() || isTestingKey} className="gap-2">
                {isTestingKey ? <span className="h-4 w-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" /> : <Key className="h-4 w-4" />}
                Test Connection
              </Button>
              {apiKey && (
                <Button onClick={() => { setApiKey(''); setBaseUrl('https://api.openai.com/v1'); setProvider('openai'); localStorage.removeItem(API_KEY_STORAGE); localStorage.removeItem(API_URL_STORAGE); localStorage.removeItem(API_PROVIDER_STORAGE); setIsKeyValid(null); toast.success('AI configuration cleared') }} variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  Remove Key
                </Button>
              )}
            </div>

            {/* Help Link */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Supported providers:</span> Any service with an OpenAI-compatible API: {' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI</a>, {' '}
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Groq</a>, {' '}
                <a href="https://api.together.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Together AI</a>, {' '}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenRouter</a>, {' '}
                <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ollama</a>, or any custom endpoint.
              </p>
              <p className="text-xs text-muted-foreground mt-1">Your key is stored <span className="font-medium">only in your browser</span>. Never sent to our servers.</p>
            </div>
          </CardContent>
        </Card>
        </>)}

        {/* ─── Workspace ───────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workspace</CardTitle>
            <CardDescription>General workspace settings and branding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input id="workspace-name" defaultValue="Sastra Technologies" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-url">Workspace URL</Label>
              <Input id="workspace-url" defaultValue="sastra-tech" disabled />
              <p className="text-xs text-muted-foreground">https://sastratech.live</p>
            </div>
            <Button onClick={handleSave} size="sm">Save Changes</Button>
          </CardContent>
        </Card>

        {/* ─── Team Members ────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Members</CardTitle>
            <CardDescription>People with access to this workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Jennifer Walsh', email: 'jennifer@sastra.io', role: 'Owner' },
                { name: 'Sarah Chen', email: 'sarah@sastra.io', role: 'Admin' },
                { name: 'Marcus Johnson', email: 'marcus@sastra.io', role: 'Member' },
                { name: 'Priya Sharma', email: 'priya@sastra.io', role: 'Member' },
              ].map((member) => (
                <div key={member.email} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-medium text-white">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{member.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── Notifications ───────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>Choose what updates you receive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Risk severity changes', description: 'When a risk crosses the high-severity threshold', enabled: true },
              { label: 'New team member joins', description: 'When someone accepts a workspace invitation', enabled: true },
              { label: 'Charter milestones', description: 'When a project reaches a key milestone date', enabled: false },
              { label: 'AI analysis complete', description: 'When AI generates new strategy suggestions', enabled: true },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
                <button
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    pref.enabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      pref.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
