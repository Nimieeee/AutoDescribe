'use client'

import { useState, useEffect } from 'react'
import { supabase, Product } from '@/lib/supabase'
import { csvRAGService } from '@/lib/csv-rag'
import { useKPITracking } from '@/lib/kpi-client'
import SearchSuggestions from '@/components/SearchSuggestions'

export default function GeneratePage() {
  const [productSku, setProductSku] = useState('')
  const [contentType, setContentType] = useState('description')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  
  const { trackPageView, trackSearch, trackGenerationRequest, trackUserInteraction } = useKPITracking()

  useEffect(() => {
    trackPageView()
  }, [])

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    const startTime = Date.now()
    
    try {
      const products = await csvRAGService.searchProducts(query, 10)
      setSearchResults(products)
      
      // Track search event
      const responseTime = Date.now() - startTime
      trackSearch(query, products.length, responseTime)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const selectProduct = (product: any) => {
    setProductSku(product.sku)
    setSearchResults([])
    setSearchQuery('')
    
    // Track product selection
    trackUserInteraction('select', 'product_search_result', {
      sku: product.sku,
      product_name: product.name
    })
  }

  const handleGenerate = async () => {
    if (!productSku.trim()) {
      setError('Please enter a product SKU')
      return
    }

    setGenerating(true)
    setError(null)
    setResult(null)
    
    // Track generation request
    trackGenerationRequest(productSku, contentType)

    try {
      // Use CSV RAG service to generate content
      const ragResult = await csvRAGService.generateContentWithRAG(
        productSku,
        contentType,
        customPrompt
      )

      if (!ragResult.success) {
        throw new Error(ragResult.error || 'Failed to generate content')
      }

      // Get the saved content from database
      const { data: savedContent } = await supabase
        .from('generated_content')
        .select(`
          *,
          products (sku, name, brand)
        `)
        .eq('generated_text', ragResult.content)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setResult({
        ...savedContent,
        rag_context: ragResult.ragContext
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const generateMockContent = (product: Product, type: string, prompt?: string) => {
    const baseContent = `Discover the ${product.name} - a premium ${product.category?.toLowerCase() || 'product'} from ${product.brand}. 

This exceptional product combines quality craftsmanship with innovative design, delivering outstanding performance and value. Perfect for customers who demand excellence and reliability.

Key features:
• Premium materials and construction
• Innovative design for optimal performance  
• Excellent value for money
• Trusted brand quality
• Customer satisfaction guaranteed

${prompt ? `\nCustom requirements: ${prompt}` : ''}

Experience the difference with ${product.name} - your satisfaction is our priority.`

    return baseContent
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Generate Descriptions</h1>
        <p className="text-gray-600 mt-2">Create AI-powered product descriptions with AutoDescribe</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Content Generation</h2>
          
          <div className="space-y-4">
            {/* Product Search with Suggestions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products (CSV Data)
              </label>
              <SearchSuggestions
                query={searchQuery}
                onSelect={(suggestion) => {
                  if (suggestion.type === 'product') {
                    setProductSku(suggestion.value)
                    setSearchQuery('')
                    trackUserInteraction('select', 'search_suggestion', {
                      type: suggestion.type,
                      value: suggestion.value
                    })
                  } else {
                    // For category/brand selections, perform search
                    setSearchQuery(suggestion.value)
                    handleSearch(suggestion.value)
                  }
                }}
                onSearch={(query) => {
                  setSearchQuery(query)
                  if (query.trim()) {
                    handleSearch(query)
                  }
                }}
                placeholder="Search by product name, SKU, brand, or category..."
                className="mb-4"
              />
              
              {/* Search Results (for category/brand searches) */}
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                  {searchResults.map((product, index) => (
                    <div
                      key={index}
                      onClick={() => selectProduct(product)}
                      className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-gray-500">
                        SKU: {product.sku} | Brand: {product.brandName} | Category: {product.primary_category}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product SKU
              </label>
              <input
                type="text"
                value={productSku}
                onChange={(e) => setProductSku(e.target.value)}
                placeholder="Enter SKU or search above (e.g., B00GS8W3T4)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="description">Product Description</option>
                <option value="features">Feature List</option>
                <option value="benefits">Benefits Summary</option>
                <option value="seo">SEO Content</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Instructions (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Add specific requirements or focus areas..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating with CSV Context...' : 'Generate Content with RAG'}
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Output */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Generated Content</h2>
          
          {result ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 text-sm font-medium">
                  ✅ Content generated successfully and saved to review queue!
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Product</h3>
                <p className="text-sm text-gray-600">
                  {result.products?.name} (SKU: {result.products?.sku})
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Generated Text</h3>
                <div className="p-4 bg-gray-50 rounded-md border">
                  <div className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">
                    {result.generated_text}
                  </div>
                </div>
              </div>

              {result.seo_keywords && result.seo_keywords.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">SEO Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.seo_keywords.map((keyword: string, index: number) => (
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

              {/* RAG Context Info */}
              {result.rag_context && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="text-sm font-medium text-green-800 mb-2">🧠 CSV RAG Context Used</h3>
                  <div className="text-xs text-green-700 space-y-1">
                    <p>✅ Target Product: {result.rag_context.targetProduct.name}</p>
                    <p>📊 Similar Products: {result.rag_context.similarProducts.length} found</p>
                    <p>🏷️ Category Products: {result.rag_context.categoryProducts.length} found</p>
                    <p>🔍 Brand Products: {result.rag_context.brandProducts.length} found</p>
                    <p>📝 Context generated from your CSV product database</p>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <a
                  href="/review"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                  📋 Go to Review Queue
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">✨</div>
              <p className="text-gray-500">Generated content will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}