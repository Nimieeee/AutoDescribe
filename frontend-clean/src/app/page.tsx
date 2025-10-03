'use client'

import { useEffect, useState } from 'react'
import { supabase, GeneratedContent } from '@/lib/supabase'
import Link from 'next/link'
import { useKPITracking } from '@/lib/kpi-client'

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })
  const [recentContent, setRecentContent] = useState<GeneratedContent[]>([])
  const [loading, setLoading] = useState(true)
  
  const { trackPageView, trackUserInteraction } = useKPITracking()

  useEffect(() => {
    // Track page view
    trackPageView()
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Check if environment is configured
      if (typeof window !== 'undefined') {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
          console.log('Supabase not configured, using demo data');
          setStats({ total: 5, pending: 2, approved: 2, rejected: 1 });
          setRecentContent([]);
          setLoading(false);
          return;
        }
      }

      // Get stats
      const { data: allContent } = await supabase
        .from('generated_content')
        .select('status')

      if (allContent) {
        const stats = {
          total: allContent.length,
          pending: allContent.filter(c => c.status === 'pending').length,
          approved: allContent.filter(c => c.status === 'approved').length,
          rejected: allContent.filter(c => c.status === 'rejected').length,
        }
        setStats(stats)
      }

      // Get recent content
      const { data: recent } = await supabase
        .from('generated_content')
        .select(`
          *,
          products (sku, name, brand)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recent) {
        setRecentContent(recent)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AutoDescribe Dashboard</h1>
        <p className="text-gray-600 mt-2">AI-powered product description generation and review</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">📊</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">⏳</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">✅</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">❌</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link 
          href="/generate" 
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 block transition-colors"
          onClick={() => trackUserInteraction('click', 'generate_content_card', { source: 'dashboard' })}
        >
          <div className="flex items-center">
            <div className="text-3xl mr-4">✨</div>
            <div>
              <h3 className="text-xl font-semibold">Generate Content</h3>
              <p className="text-blue-100">Create new product descriptions with AI</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/review" 
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-6 block transition-colors"
          onClick={() => trackUserInteraction('click', 'review_content_card', { source: 'dashboard' })}
        >
          <div className="flex items-center">
            <div className="text-3xl mr-4">📋</div>
            <div>
              <h3 className="text-xl font-semibold">Review Content</h3>
              <p className="text-green-100">Review and approve generated content</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Content</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentContent.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No content generated yet. <Link href="/generate" className="text-blue-600 hover:underline">Generate your first content</Link>
            </div>
          ) : (
            recentContent.map((content) => (
              <div key={content.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {content.products?.name || 'Unknown Product'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      SKU: {content.products?.sku} • {content.content_type}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      content.status === 'approved' ? 'bg-green-100 text-green-800' :
                      content.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {content.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(content.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}