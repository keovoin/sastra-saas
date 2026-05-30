import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Key, Eye, EyeOff, CheckCircle2, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react'

// ─── API Key Storage Helpers ──────────────────────────────────────────────────
const API_KEY_STORAGE = 'sastra-openai-key'
const API_MODEL_STORAGE = 'sastra-openai-model'

export function getStoredApiKey(): string {
  try { return localStorage.getItem(API_KEY_STORAGE) || '' } catch { return '' }
}

export function getStoredModel(): string {
  try { return localStorage.getItem(API_MODEL_STORAGE) || 'gpt-4o-mini' } catch { return 'gpt-4o-mini' }
}

export function Settings() {
  // ─── API Key State ──────────────────────────────────────────────────────────
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null)
  const [isTestingKey, setIsTestingKey] = useState(false)

  useEffect(() => {
    setApiKey(getStoredApiKey())
    setSelectedModel(getStoredModel())
    if (getStoredApiKey()) setIsKeyValid(true)
  }, [])

  const handleSaveApiKey = () => {
    localStorage.setItem(API_KEY_STORAGE, apiKey.trim())
    localStorage.setItem(API_MODEL_STORAGE, selectedModel)
    if (apiKey.trim()) {
      setIsKeyValid(true)
      toast.success('API key saved', { description: 'The AI Assistant will now use your OpenAI key.' })
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
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey.trim()}` },
      })
      if (response.ok) {
        setIsKeyValid(true)
        toast.success('API key is valid!', { description: 'Connection to OpenAI verified.' })
      } else {
        setIsKeyValid(false)
        toast.error('Invalid API key', { description: 'Please check your key and try again.' })
      }
    } catch {
      setIsKeyValid(false)
      toast.error('Connection failed', { description: 'Could not reach OpenAI. Check your network.' })
    }
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
        {/* ─── AI / OpenAI API Key ──────────────────────────────────────────────── */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">AI Strategy Assistant</CardTitle>
                <CardDescription>Bring your own OpenAI key for AI-powered SWOT generation.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="api-key">OpenAI API Key</Label>
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

            {/* Model Selection */}
            <div className="space-y-2">
              <Label>Model</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & cheap' },
                  { id: 'gpt-4o', label: 'GPT-4o', description: 'Best quality' },
                  { id: 'gpt-3.5-turbo', label: 'GPT-3.5', description: 'Legacy' },
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
                <Button onClick={() => { setApiKey(''); localStorage.removeItem(API_KEY_STORAGE); setIsKeyValid(null); toast.success('API key removed') }} variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  Remove Key
                </Button>
              )}
            </div>

            {/* Help Link */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Don't have a key?</span> Get one from{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">
                  OpenAI Platform <ExternalLink className="h-3 w-3" />
                </a>
                . Usage costs depend on your chosen model ($0.15 - $5.00 per 1M tokens).
              </p>
            </div>
          </CardContent>
        </Card>

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
