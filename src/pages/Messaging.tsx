import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MessageCircle, Plus, Send, Hash, Users, AtSign, Reply, Check, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useBusinessOS } from '@/context/BusinessContext'
import { useData } from '@/context/DataContext'
import type { Message as DbMessage, Channel as DbChannel } from '@/context/DataContext'
import { getWorkspaceMembers, initDefaultMembers, type WorkspaceMember } from '@/lib/workspace'

interface Message {
  id: string
  channelId: string
  author: string
  text: string
  timestamp: string
  replyTo?: string
  readBy: string[]
}

interface Channel {
  id: string
  name: string
  type: 'direct' | 'group' | 'forum'
  members: string[]
  description: string
}


export function Messaging() {
  const { profile } = useBusinessOS()
  const { messages: dbMessages, channels: dbChannels, sendMessage: ctxSendMessage, addChannel: ctxAddChannel } = useData()
  const channels: Channel[] = dbChannels.length > 0
    ? dbChannels.map(c => ({ id: c.id, name: c.name, type: c.type as Channel['type'], members: c.members, description: c.description }))
    : [
        { id: 'general', name: 'General', type: 'group', members: [], description: 'Company-wide announcements' },
        { id: 'random', name: 'Random', type: 'group', members: [], description: 'Off-topic conversations' },
      ]
  const messages: Message[] = dbMessages.map(m => ({ id: m.id, channelId: m.channel_id, author: m.author_name, text: m.content, timestamp: m.created_at, replyTo: m.reply_to || undefined, readBy: [] }))
  const [activeChannel, setActiveChannel] = useState<string>('general')
  const [messageText, setMessageText] = useState('')
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [channelForm, setChannelForm] = useState({ name: '', type: 'group' as Channel['type'], description: '', visibility: 'public' as 'public' | 'private', members: [] as string[] })
  const [memberSearch, setMemberSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const allMembers: WorkspaceMember[] = (() => { initDefaultMembers(); return getWorkspaceMembers() })()

  const currentUser = profile?.full_name || 'You'
  const activeChannelData = channels.find(c => c.id === activeChannel)
  const channelMessages = messages.filter(m => m.channelId === activeChannel)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [channelMessages.length])

  const sendMessage = () => {
    if (!messageText.trim()) return
    ctxSendMessage({
      channel_id: activeChannel,
      content: messageText.trim(),
      author_name: currentUser,
      reply_to: replyTo?.id,
    })
    setMessageText('')
    setReplyTo(null)
  }

  const createChannel = () => {
    if (!channelForm.name.trim()) { toast.error('Channel name required'); return }
    const name = channelForm.name.toLowerCase().replace(/\s+/g, '-')
    ctxAddChannel({
      name,
      type: channelForm.type,
      members: channelForm.members,
      description: (channelForm.visibility === 'private' ? '🔒 ' : '') + channelForm.description,
    })
    setShowCreateChannel(false)
    setChannelForm({ name: '', type: 'group', description: '', visibility: 'public', members: [] })
    setMemberSearch('')
  }

  const toggleMember = (identifier: string) => {
    setChannelForm(p => ({
      ...p,
      members: p.members.includes(identifier) ? p.members.filter(m => m !== identifier) : [...p.members, identifier],
    }))
  }

  const filteredMembers = allMembers.filter(m =>
    !memberSearch ||
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10"><MessageCircle className="h-6 w-6 text-blue-600" /></div>
        <div><h1 className="text-2xl font-bold">Messaging</h1><p className="text-muted-foreground text-sm">Team communication & discussions</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-240px)]">
        {/* Channel List */}
        <Card className="lg:col-span-1 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">Channels</span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowCreateChannel(true)}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {channels.map(ch => (
              <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors ${activeChannel === ch.id ? 'bg-accent font-medium' : 'hover:bg-accent/50 text-muted-foreground'}`}>
                {ch.type === 'direct' ? <Users className="h-4 w-4 shrink-0" /> : <Hash className="h-4 w-4 shrink-0" />}
                <span className="truncate">{ch.name}</span>
                {messages.filter(m => m.channelId === ch.id).length > 0 && activeChannel !== ch.id && (
                  <Badge className="ml-auto h-5 px-1.5 text-xs bg-violet-500 text-white">{messages.filter(m => m.channelId === ch.id).length}</Badge>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Message Area */}
        <Card className="lg:col-span-3 overflow-hidden flex flex-col">
          {/* Channel Header */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{activeChannelData?.name}</span>
              {activeChannelData?.description && <span className="text-xs text-muted-foreground ml-2">— {activeChannelData.description}</span>}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {channelMessages.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            )}
            {channelMessages.map(msg => {
              const replyMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null
              return (
                <div key={msg.id} className="group flex gap-3 hover:bg-muted/30 rounded-md p-2 -mx-2 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-xs text-white font-medium shrink-0">
                    {msg.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">{msg.author}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                      <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />
                    </div>
                    {replyMsg && (
                      <div className="text-xs text-muted-foreground border-l-2 border-violet-300 pl-2 mt-1 mb-1">
                        <span className="font-medium">{replyMsg.author}:</span> {replyMsg.text.slice(0, 50)}...
                      </div>
                    )}
                    <p className="text-sm mt-0.5">{msg.text}</p>
                    <button onClick={() => setReplyTo(msg)} className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1 transition-opacity">
                      <Reply className="h-3 w-3" />Reply
                    </button>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>


          {/* Input */}
          <div className="p-3 border-t border-border">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                <Reply className="h-3 w-3" />Replying to {replyTo.author}
                <button onClick={() => setReplyTo(null)} className="ml-auto hover:text-foreground">×</button>
              </div>
            )}
            <div className="flex gap-2">
              <Input placeholder={`Message #${activeChannelData?.name}...`} value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              />
              <Button onClick={sendMessage} disabled={!messageText.trim()}><Send className="h-4 w-4" /></Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Tip: Use @name to mention someone</p>
          </div>
        </Card>
      </div>

      {/* Create Channel Dialog */}
      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Channel</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Channel Name *</Label><Input placeholder="project-updates" value={channelForm.name} onChange={e => setChannelForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={channelForm.type} onChange={e => setChannelForm(p => ({ ...p, type: e.target.value as Channel['type'] }))}>
                  <option value="group">Group Channel</option><option value="direct">Direct Message</option><option value="forum">Forum (Threaded)</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Visibility</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={channelForm.visibility} onChange={e => setChannelForm(p => ({ ...p, visibility: e.target.value as 'public' | 'private' }))}>
                  <option value="public">Public (everyone)</option><option value="private">Private (invite only)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Input value={channelForm.description} onChange={e => setChannelForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Add Members <span className="text-muted-foreground font-normal">({channelForm.members.length} selected)</span></Label>
              <Input placeholder="Search by name or email..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
              <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-md p-1">
                {filteredMembers.length === 0 && <p className="text-xs text-muted-foreground p-2 text-center">No members found</p>}
                {filteredMembers.map(m => {
                  const selected = channelForm.members.includes(m.email)
                  return (
                    <button key={m.id} type="button" onClick={() => toggleMember(m.email)}
                      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-left text-sm transition-colors ${selected ? 'bg-violet-50 dark:bg-violet-900/20' : 'hover:bg-accent/50'}`}>
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-[9px] text-white font-medium shrink-0">{m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                      <div className="flex-1 min-w-0"><p className="truncate font-medium">{m.name}</p><p className="text-[10px] text-muted-foreground truncate">{m.email} • {m.department}</p></div>
                      <div className={`h-4 w-4 rounded flex items-center justify-center shrink-0 ${selected ? 'bg-violet-500' : 'border border-border'}`}>{selected && <Check className="h-3 w-3 text-white" />}</div>
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">Only members in your workspace can be added. To add someone new, invite them first.</p>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCreateChannel(false)}>Cancel</Button><Button onClick={createChannel}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
