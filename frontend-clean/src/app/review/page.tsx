'use client'

import { useEffect, useState } from 'react'
import { supabase, GeneratedContent } from '@/lib/supabase'
import { 
  Lock, RefreshCw, CheckCircle, XCircle, Clock, 
  BarChart3, AlertTriangle, Target, Trophy, Sparkles, FileText, AlertCircle
} from 'lucide-react'

export default function ReviewPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [content, setContent] = useState<GeneratedContent[]>([])
  const [selectedItem, setSelectedItem] = useState<GeneratedContent | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false)

  useEffect(() => {
    // Check if already authenticated
    const savedAuth = localStorage.getItem('review-auth')
    if (savedAuth === 'atdb-465@') {
      setIsAuthenticated(true)
      loadContent()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = () => {
    if (password === 'atdb-465@') {
      setIsAuthenticated(true)
      localStorage.setItem('review-auth', password)
      loadContent()
    } else {
      alert('Incorrect password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('review-auth')
    setPassword('')
  }

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_content')
        .select(`
          *,
          products (sku, name, brand, category)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading content:', error)
        return
      }

      setContent(data || [])
    } catch (error) {
      console.error('Error loading content:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('generated_content')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating status:', error)
        return
      }

      // Update local state
      setContent(prev => prev.map(item => 
        item.id === id ? { ...item, status } : item
      ))

      // Clear selection if this item was selected
      if (selectedItem?.id === id) {
        setSelectedItem(null)
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
      const { error } = await supabase
        .from('generated_content')
        .update({ 
          edited_text: editedText,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id)

      if (error) {
        console.error('Error saving edit:', error)
        alert('Error saving changes: ' + error.message)
        return
      }

      // Update local state
      setContent(prev => prev.map(item => 
        item.id === selectedItem.id ? { ...item, edited_text: editedText } : item
      ))
      setSelectedItem({ ...selectedItem, edited_text: editedText })
      setIsEditing(false)
      
      // Show success message
      alert('Changes saved successfully!')
    } catch (error) {
      console.error('Error saving edit:', error)
      alert('Error saving changes. Please try again.')
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
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />
      default: return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-600 mr-3" />
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Content Review Access
              </h2>
            </div>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter password to access the review dashboard
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter password"
              />
            </div>
            <div>
              <button
                onClick={handleLogin}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                🔓 Access Review Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AutoDescribe Review Dashboard</h1>
            <p className="text-gray-600 mt-2">Review, edit, and approve AI-generated descriptions</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadContent}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2 inline" />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Lock className="w-4 h-4 mr-2 inline" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Review Queue */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Queue</h2>
            
            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === filterOption
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {filter === 'pending' ? 'No pending items' : `No ${filter} items`}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedItem?.id === item.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)} {item.status}
                    </span>
                    {item.quality_score && (
                      <span className="text-xs text-gray-500">
                        Score: {Math.round(item.quality_score * 100)}%
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-sm text-gray-900 mb-1">
                    {item.products?.name || 'Unknown Product'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    SKU: {item.products?.sku} • {item.content_type}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Review Detail */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          {selectedItem ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedItem.products?.name || 'Unknown Product'}
                  </h2>
                  <p className="text-gray-600">
                    SKU: {selectedItem.products?.sku} • {selectedItem.content_type}
                  </p>
                </div>
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedItem.status)}`}>
                  {getStatusIcon(selectedItem.status)} {selectedItem.status}
                </span>
              </div>

              {/* Content */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    {selectedItem.edited_text ? 'Edited Content' : 'Generated Content'}
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={startEditing}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="w-full h-64 p-4 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Edit the content..."
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={saveEdit}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        💾 Save Changes
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-md border">
                    <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {selectedItem.edited_text || selectedItem.generated_text}
                    </div>
                    {selectedItem.edited_text && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-blue-600 font-medium">✏️ This content has been edited</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SEO Keywords */}
              {selectedItem.seo_keywords && selectedItem.seo_keywords.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">SEO Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.seo_keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality Score */}
              {selectedItem.quality_score && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Quality Score</h3>
                    <button
                      onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {showScoreBreakdown ? '🔼 Hide Details' : '🔽 Show Details'}
                    </button>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          selectedItem.quality_score >= 0.9 ? 'bg-green-500' :
                          selectedItem.quality_score >= 0.7 ? 'bg-blue-500' :
                          selectedItem.quality_score >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedItem.quality_score * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm font-semibold text-gray-900">
                      {Math.round(selectedItem.quality_score * 100)}%
                    </span>
                  </div>

                  {showScoreBreakdown && selectedItem.metadata?.score_breakdown && (
                    <div className="bg-gray-50 rounded-md p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        📊 5-Dimensional Scoring System
                      </h4>
                      
                      {/* Score Dimensions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">🔍 Clarity</span>
                            <span className="text-xs font-medium">{selectedItem.metadata.score_breakdown.clarity || 0}/2</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${((selectedItem.metadata.score_breakdown.clarity || 0) / 2) * 100}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">✂️ Conciseness</span>
                            <span className="text-xs font-medium">{selectedItem.metadata.score_breakdown.conciseness || 0}/2</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${((selectedItem.metadata.score_breakdown.conciseness || 0) / 2) * 100}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">⚠️ Accuracy</span>
                            <span className="text-xs font-medium">{selectedItem.metadata.score_breakdown.technicalAccuracy || 0}/2</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${((selectedItem.metadata.score_breakdown.technicalAccuracy || 0) / 2) * 100}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">👔 Professional Tone</span>
                            <span className="text-xs font-medium">{selectedItem.metadata.score_breakdown.professionalTone || 0}/2</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${((selectedItem.metadata.score_breakdown.professionalTone || 0) / 2) * 100}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">🎯 SEO & Engagement</span>
                            <span className="text-xs font-medium">{selectedItem.metadata.score_breakdown.seoEngagement || 0}/2</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${((selectedItem.metadata.score_breakdown.seoEngagement || 0) / 2) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Quality Level */}
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Overall Quality Level:</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            selectedItem.quality_score >= 0.9 ? 'bg-green-100 text-green-800' :
                            selectedItem.quality_score >= 0.7 ? 'bg-blue-100 text-blue-800' :
                            selectedItem.quality_score >= 0.4 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedItem.quality_score >= 0.9 ? '🏆 Excellent' :
                             selectedItem.quality_score >= 0.7 ? '✨ Good' :
                             selectedItem.quality_score >= 0.4 ? '📝 Fair' : '🚨 Poor'}
                          </span>
                        </div>
                      </div>

                      {/* Readability Metrics */}
                      {selectedItem.metadata.score_breakdown.breakdown && (
                        <div className="pt-2 border-t border-gray-200">
                          <h5 className="text-xs font-medium text-gray-700 mb-2">📖 Readability Metrics</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Flesch Score:</span>
                              <span className="ml-1 font-medium">{Math.round(selectedItem.metadata.score_breakdown.breakdown.fleschScore || 0)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Avg Words/Sentence:</span>
                              <span className="ml-1 font-medium">{Math.round(selectedItem.metadata.score_breakdown.breakdown.avgWordsPerSentence || 0)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {selectedItem.status === 'pending' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => updateStatus(selectedItem.id, 'approved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => updateStatus(selectedItem.id, 'rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    ❌ Reject
                  </button>
                </div>
              )}

              {/* Metadata */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Details</h3>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Created: {new Date(selectedItem.created_at).toLocaleString()}</p>
                  <p>Updated: {new Date(selectedItem.updated_at).toLocaleString()}</p>
                  <p>ID: {selectedItem.id}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <p className="text-gray-500">Select an item from the queue to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}