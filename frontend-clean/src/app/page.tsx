'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/lib/supabase'
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

      // Use content returned from backend (including database record)
      const savedContent = ragResult.savedContent

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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Input & Search</h2>
            <p className="text-sm text-gray-500">Find a product to generate description for</p>
          </div>

          <div className="space-y-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Product Database (CSV)
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
                    setSearchQuery(suggestion.value)
                  }
                }}
                onSearch={(query) => setSearchQuery(query)}
                placeholder="Search by name, brand, or category..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected SKU
              </label>
              <input
                type="text"
                value={productSku}
                onChange={(e) => setProductSku(e.target.value)}
                placeholder="e.g., B00GS8W3T4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
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
                <option value="seo">SEO Optimized Content</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Focus (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Focus on durability and eco-friendly materials..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Generating Content...</span>
                </>
              ) : (
                <>
                  <span>🚀 Run Generation Pipeline</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                Error: {error}
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
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Content Preview</h3>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">

                  <div className="p-6 md:p-8 space-y-6">
                    {/* Enhanced Content Parser */}
                    {(() => {
                      const text = result.generated_text || '';
                      // Split by double newlines to find potential sections
                      const blocks = text.split(/\n\n+/);

                      return blocks.map((block: string, idx: number) => {
                        const trimmedBlock = block.trim();
                        if (!trimmedBlock) return null;

                        // 1. Check for specific headers with icons
                        const lowerBlock = trimmedBlock.toLowerCase();
                        const isFeatureSection = lowerBlock.includes('why this') || lowerBlock.includes('stand out') || lowerBlock.includes('key features');
                        const isBottomLine = lowerBlock.includes('bottom line') || lowerBlock.includes('conclusion');

                        // 2. Headings detection
                        // Matches: "Heading:", "Heading", or line ending with colon
                        const headingMatch = trimmedBlock.match(/^([A-Z][\w\s\W]{3,50}?)(:|\n|$)/);
                        // Reduced false positives for headings
                        const isHeading = headingMatch && (headingMatch[0].length < 60 && (headingMatch[0].includes(':') || isFeatureSection || isBottomLine));

                        if (isFeatureSection || isBottomLine) {
                          // Split section into title and content (often bullets)
                          const firstLineEnd = trimmedBlock.indexOf('\n');
                          const title = firstLineEnd > -1 ? trimmedBlock.substring(0, firstLineEnd) : trimmedBlock;
                          const content = firstLineEnd > -1 ? trimmedBlock.substring(firstLineEnd + 1) : '';

                          return (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 border border-gray-100 dark:border-gray-800">
                              <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-2">
                                {isFeatureSection && '✨'}
                                {isBottomLine && '🏁'}
                                {title}
                              </h4>
                              {content && (
                                <div className="space-y-3">
                                  {content.split(/\n/).map((line, lIdx) => {
                                    const cleanLine = line.trim();
                                    if (!cleanLine) return null;

                                    // Render list items nicely
                                    if (cleanLine.match(/^[•\-*⭐🔑🛠️🎯💰👉]/)) {
                                      // Extract emoji if present as bullet
                                      const emojiMatch = cleanLine.match(/^([⭐🔑🛠️🎯💰👉]+)/);
                                      const emoji = emojiMatch ? emojiMatch[1] : null;
                                      const text = cleanLine.replace(/^[•\-*⭐🔑🛠️🎯💰👉]+\s*/, '');

                                      return (
                                        <div key={lIdx} className="flex gap-3 items-start text-gray-700 dark:text-gray-300 group hover:bg-white dark:hover:bg-gray-800 p-2 rounded transition-colors">
                                          <span className="flex-shrink-0 mt-1 text-lg">
                                            {emoji || <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />}
                                          </span>
                                          <span className="leading-relaxed font-medium">{text}</span>
                                        </div>
                                      );
                                    }

                                    return <p key={lIdx} className="text-gray-700 dark:text-gray-300 leading-relaxed">{cleanLine}</p>
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }

                        // 3. Regular Paragraphs vs Lists
                        // If block contains multiple bullet points, render as list
                        if (trimmedBlock.includes('\n•') || trimmedBlock.includes('\n-') || trimmedBlock.match(/\n[⭐🔑🛠️🎯💰👉]/)) {
                          const lines = trimmedBlock.split('\n');
                          return (
                            <ul key={idx} className="space-y-3 my-4">
                              {lines.map((line, lIdx) => {
                                const cleanLine = line.trim();
                                if (!cleanLine) return null;

                                const emojiMatch = cleanLine.match(/^([⭐🔑🛠️🎯💰👉]+)/);
                                const isBullet = cleanLine.match(/^[•\-*]/);

                                if (emojiMatch || isBullet) {
                                  const emoji = emojiMatch ? emojiMatch[1] : null;
                                  const text = cleanLine.replace(/^[•\-*⭐🔑🛠️🎯💰👉]+\s*/, '');
                                  return (
                                    <li key={lIdx} className="flex gap-3 items-start text-gray-700 dark:text-gray-300">
                                      <span className="flex-shrink-0 mt-1">
                                        {emoji || <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />}
                                      </span>
                                      <span className="leading-relaxed">{text}</span>
                                    </li>
                                  );
                                }
                                // If first line of a "list block" looks like a header (bold)
                                if (lIdx === 0 && cleanLine.length < 100) {
                                  return <h4 key={lIdx} className="font-bold text-gray-900 dark:text-white mb-2">{cleanLine}</h4>
                                }
                                return <p key={lIdx} className="text-gray-700 dark:text-gray-300 mb-1">{cleanLine}</p>
                              })}
                            </ul>
                          );
                        }

                        // Generic Heading Detection
                        if (isHeading) {
                          return <h3 key={idx} className="font-bold text-xl text-gray-900 dark:text-white mt-6 mb-3">{trimmedBlock}</h3>
                        }

                        // Default Paragraph
                        return (
                          <p key={idx} className="text-gray-800 dark:text-gray-200 text-base leading-relaxed mb-4 last:mb-0">
                            {trimmedBlock}
                          </p>
                        );
                      });
                    })()}
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