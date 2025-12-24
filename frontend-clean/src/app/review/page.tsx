'use client'

import { useEffect, useState } from 'react'
import { GeneratedContent } from '@/lib/supabase'
import {
  RefreshCw, CheckCircle, XCircle, Clock,
  BarChart3, AlertTriangle, Target, Trophy, Sparkles, FileText, AlertCircle,
  ChevronDown, ChevronUp, Copy, ExternalLink
} from 'lucide-react'

export default function ReviewPage() {
  const [content, setContent] = useState<GeneratedContent[]>([])
  const [selectedItem, setSelectedItem] = useState<GeneratedContent | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false)

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      const backendUrl = '/api/proxy'
      const response = await fetch(`${backendUrl}/content`)

      if (!response.ok) {
        throw new Error('Failed to fetch content')
      }

      const data = await response.json()
      setContent(data || [])
    } catch (error) {
      console.error('Error loading content:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const backendUrl = '/api/proxy'
      const response = await fetch(`${backendUrl}/content/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      setContent(prev => prev.map(item =>
        item.id === id ? { ...item, status } : item
      ))

      if (selectedItem?.id === id) {
        setSelectedItem(prev => prev ? { ...prev, status } : null)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const startEditing = () => {
    if (selectedItem) {
      setEditedText(selectedItem.edited_text || selectedItem.generated_text)
      setIsEditing(true)
    }
  }

  const saveEdit = async () => {
    if (!selectedItem) return

    try {
      const backendUrl = '/api/proxy'
      const response = await fetch(`${backendUrl}/content/${selectedItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ edited_text: editedText })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to save edit')
      }

      setContent(prev => prev.map(item =>
        item.id === selectedItem.id ? { ...item, edited_text: editedText } : item
      ))
      setSelectedItem({ ...selectedItem, edited_text: editedText })
      setIsEditing(false)

      alert('Changes saved successfully!')
    } catch (error: any) {
      console.error('Error saving edit:', error)
      alert('Error saving changes: ' + error.message)
    }
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditedText('')
  }

  const filteredItems = content.filter(item =>
    filter === 'all' || item.status === filter
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
      default: return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">

        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-200 tracking-tight">
              Review <span className="text-blue-600 dark:text-blue-400">Dashboard</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
              Manage and refine your AI-generated product content
            </p>
          </div>
          <button
            onClick={loadContent}
            className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all flex items-center font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Queue
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* LEFT COLUMN: Queue List */}
          <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 flex flex-col gap-6 h-[calc(100vh-12rem)]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full">

              {/* Filters */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                <div className="flex p-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-xl">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => (
                    <button
                      key={filterOption}
                      onClick={() => setFilter(filterOption)}
                      className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${filter === filterOption
                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                      {filterOption}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500 p-6">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p>No items found</p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${selectedItem?.id === item.id
                          ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm ring-1 ring-blue-500/20'
                          : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          {item.status}
                        </span>
                        {item.quality_score && (
                          <span className={`text-xs font-mono font-medium ${item.quality_score > 0.8 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {Math.round(item.quality_score * 100)}%
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 leading-snug">
                        {item.products?.name || 'Unknown Product'}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                        <span>{item.products?.sku}</span>
                        <span>•</span>
                        <span className="capitalize">{item.content_type}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Detail View */}
          <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 min-h-[600px] overflow-hidden flex flex-col">
            {selectedItem ? (
              <>
                {/* Detail Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-black/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                        {selectedItem.products?.name}
                      </h2>
                      <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${getStatusColor(selectedItem.status)}`}>
                        {getStatusIcon(selectedItem.status)} {selectedItem.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-4 h-4" />
                        <span className="font-mono">{selectedItem.products?.sku}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(selectedItem.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    {selectedItem.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(selectedItem.id, 'approved')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => updateStatus(selectedItem.id, 'rejected')}
                          className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </>
                    )}
                    {selectedItem.status === 'approved' && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedItem.edited_text || selectedItem.generated_text)
                          alert('Copied to clipboard!')
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" /> Copy Content
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-8 space-y-8">

                  {/* Content Area */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        Content
                      </h3>
                      {!isEditing && (
                        <button
                          onClick={startEditing}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          Edit Text
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-1 shadow-inner">
                        <textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="w-full h-96 p-4 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-200 leading-relaxed resize-none text-base"
                          placeholder="Edit content here..."
                        />
                        <div className="flex justify-end gap-2 p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-lg">
                          <button onClick={cancelEdit} className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Cancel</button>
                          <button onClick={saveEdit} className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 p-6 relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedItem.edited_text || selectedItem.generated_text)
                            }}
                            className="p-2 bg-white dark:bg-gray-800 text-gray-500 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:text-blue-600"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                          {selectedItem.edited_text || selectedItem.generated_text}
                        </div>
                        {selectedItem.edited_text && (
                          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 italic border-t border-gray-200 dark:border-gray-700 pt-3">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Edited by user
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metrics & Analysis Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Keywords */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Target className="w-4 h-4" /> SEO Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.seo_keywords?.map((k, i) => (
                          <span key={i} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 rounded-lg text-sm font-medium">
                            #{k}
                          </span>
                        ))}
                        {(!selectedItem.seo_keywords || selectedItem.seo_keywords.length === 0) && (
                          <span className="text-sm text-gray-400 italic">No keywords detected</span>
                        )}
                      </div>
                    </div>

                    {/* Quality Score */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <Trophy className="w-4 h-4" /> Quality Score
                        </h3>
                        <button
                          onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {showScoreBreakdown ? 'Hide details' : 'View breakdown'}
                          {showScoreBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {Math.round((selectedItem.quality_score || 0) * 100)}%
                          </div>
                          <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${(selectedItem.quality_score || 0) > 0.8 ? 'bg-green-500' :
                                  (selectedItem.quality_score || 0) > 0.6 ? 'bg-blue-500' : 'bg-amber-500'
                                }`}
                              style={{ width: `${(selectedItem.quality_score || 0) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Animated Breakdown */}
                        {showScoreBreakdown && selectedItem.metadata?.score_breakdown && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            {/* Clarity */}
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500 dark:text-gray-400">Clarity</span>
                                <span className="font-mono">{selectedItem.metadata.score_breakdown.clarity}/2</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(selectedItem.metadata.score_breakdown.clarity || 0) / 2 * 100}%` }}></div>
                              </div>
                            </div>
                            {/* Tone */}
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500 dark:text-gray-400">Tone</span>
                                <span className="font-mono">{selectedItem.metadata.score_breakdown.professionalTone}/2</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(selectedItem.metadata.score_breakdown.professionalTone || 0) / 2 * 100}%` }}></div>
                              </div>
                            </div>
                            {/* Engagement */}
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500 dark:text-gray-400">Engagement</span>
                                <span className="font-mono">{selectedItem.metadata.score_breakdown.seoEngagement}/2</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full">
                                <div className="h-full bg-pink-500 rounded-full" style={{ width: `${(selectedItem.metadata.score_breakdown.seoEngagement || 0) / 2 * 100}%` }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400 dark:text-gray-500">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Select an item to review</h3>
                <p className="max-w-xs mx-auto">Click on any item from the queue on the left to see details, score breakdown, and editing options.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}