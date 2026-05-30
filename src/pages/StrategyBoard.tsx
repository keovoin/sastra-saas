import React, { useState } from 'react'
import { useBusinessOS, SwotItem, SwotCategory, Priority } from '@/context/BusinessContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Lightbulb, AlertTriangle } from 'lucide-react'

const quadrantConfig: Record<SwotCategory, { title: string; color: string; borderColor: string; icon: React.ElementType; bgColor: string }> = {
  strengths: { title: 'Strengths', color: 'text-emerald-700', borderColor: 'border-l-emerald-500', icon: TrendingUp, bgColor: 'bg-emerald-50' },
  weaknesses: { title: 'Weaknesses', color: 'text-red-700', borderColor: 'border-l-red-500', icon: TrendingDown, bgColor: 'bg-red-50' },
  opportunities: { title: 'Opportunities', color: 'text-blue-700', borderColor: 'border-l-blue-500', icon: Lightbulb, bgColor: 'bg-blue-50' },
  threats: { title: 'Threats', color: 'text-orange-700', borderColor: 'border-l-orange-500', icon: AlertTriangle, bgColor: 'bg-orange-50' },
}

const priorityColors: Record<Priority, string> = {
  Low: 'bg-slate-100 text-slate-700',
  Medium: 'bg-amber-100 text-amber-800',
  High: 'bg-red-100 text-red-800',
}

export function StrategyBoard() {
  const { swotItems, addSwotItem, updateSwotItem, deleteSwotItem, isAdmin } = useBusinessOS()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SwotItem | null>(null)
  const [newText, setNewText] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('Medium')
  const [newCategory, setNewCategory] = useState<SwotCategory>('strengths')

  const openAddModal = (category: SwotCategory) => {
    if (!isAdmin) return
    setEditingItem(null)
    setNewText('')
    setNewPriority('Medium')
    setNewCategory(category)
    setModalOpen(true)
  }

  const openEditModal = (item: SwotItem) => {
    if (!isAdmin) return
    setEditingItem(item)
    setNewText(item.text)
    setNewPriority(item.priority)
    setNewCategory(item.category)
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!isAdmin) return
    if (!newText.trim()) return

    if (editingItem) {
      updateSwotItem(editingItem.id, { text: newText, priority: newPriority, category: newCategory })
    } else {
      addSwotItem({ text: newText, priority: newPriority, category: newCategory })
    }
    setModalOpen(false)
  }

  const handleDelete = (id: string) => {
    if (!isAdmin) return
    deleteSwotItem(id)
  }

  const getItemsByCategory = (category: SwotCategory) =>
    swotItems.filter((item) => item.category === category)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Strategy Board</h1>
        <p className="mt-1 text-sm text-slate-500">
          Analyze your business position with an interactive SWOT framework.{' '}
          {isAdmin ? 'Click items to edit or vote on priority.' : 'You have read-only access.'}
        </p>
      </div>

      {/* Viewer Banner */}
      {!isAdmin && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800 font-medium">
            You are viewing as a <span className="font-bold">Viewer</span>. Editing is disabled.
          </p>
        </div>
      )}

      {/* SWOT Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(Object.keys(quadrantConfig) as SwotCategory[]).map((category) => {
          const config = quadrantConfig[category]
          const Icon = config.icon
          const items = getItemsByCategory(category)

          return (
            <Card key={category} className={`border-l-4 ${config.borderColor}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-md p-1.5 ${config.bgColor}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <CardTitle className={`text-base ${config.color}`}>{config.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {items.length}
                    </Badge>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAddModal(category)}
                      className="h-8 gap-1 text-xs"
                    >
                      <Plus className="h-3 w-3" />
                      Add Item
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className={`rounded-full p-3 ${config.bgColor} mb-3`}>
                      <Icon className={`h-6 w-6 ${config.color} opacity-50`} />
                    </div>
                    <p className="text-sm text-slate-500">No items yet</p>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddModal(category)}
                        className="mt-2 gap-1 text-xs"
                      >
                        <Plus className="h-3 w-3" />
                        Add First Item
                      </Button>
                    )}
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-start gap-3 rounded-md border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-slate-200 hover:shadow"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-relaxed">{item.text}</p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[item.priority]}`}>
                            {item.priority}
                          </span>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(item)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add/Edit Modal (Admin only) */}
      {isAdmin && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update the text and priority of this strategy item.' : 'Add a new item to your SWOT analysis.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="item-text">Description</Label>
                <Input
                  id="item-text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Describe the strategic factor..."
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex gap-2">
                  {(['Low', 'Medium', 'High'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                        newPriority === p
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              {editingItem && (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(quadrantConfig) as SwotCategory[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setNewCategory(cat)}
                        className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                          newCategory === cat
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {quadrantConfig[cat].title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!newText.trim()}>
                {editingItem ? 'Save Changes' : 'Add Item'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
