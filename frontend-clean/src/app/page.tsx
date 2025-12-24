'use client'

import { useState, useEffect } from 'react'
import { Product } from '@/lib/supabase'
import { csvRAGService } from '@/lib/csv-rag'
import { useKPITracking } from '@/lib/kpi-client'
import SearchSuggestions from '@/components/SearchSuggestions'
import { CheckCircle, AlertCircle, Sparkles } from 'lucide-react'


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
    <div className="min-h-screen bg-transparent p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-200 tracking-tight">
              AutoDescribe <span className="text-blue-600 dark:text-blue-400">Studio</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
              Enterprise-grade AI product content generation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm">
              Model: 2.0 Fast
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Input (Sticky on large screens) */}
          <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
              <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700/50 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    🚀
                  </span>
                  Configuration
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Search */}
                <div className="group relative z-20">
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">
                    Product Search
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
                    placeholder="Search database..."
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">
                    Target SKU
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productSku}
                      onChange={(e) => setProductSku(e.target.value)}
                      placeholder="e.g., B00GS8W3T4"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                    />
                    {productSku && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 animate-in fade-in zoom-in">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">
                    Content Type
                  </label>
                  <div className="relative">
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none text-gray-700 dark:text-gray-200"
                    >
                      <option value="description">Product Description</option>
                      <option value="features">Feature List</option>
                      <option value="benefits">Benefits Summary</option>
                      <option value="seo">SEO Optimized Content</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2">
                    Custom Instructions
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="E.g., 'Make it punchy', 'Focus on durability'..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg px-4 py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generate Content</span>
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm animate-shake">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-8 xl:col-span-9">
            {result ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                {/* Success Banner */}
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    <span>Content generated & saved to database</span>
                  </div>
                  <a href="/review" className="text-sm font-semibold text-green-700 dark:text-green-400 hover:underline">
                    View in Review Queue &rarr;
                  </a>
                </div>

                {/* Main Content Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                  {/* Header */}
                  <div className="border-b border-gray-100 dark:border-gray-700 p-6 md:p-8 bg-gray-50/50 dark:bg-black/20">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {result.products?.name}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                        {result.products?.sku}
                      </span>
                      <span>•</span>
                      <span>{result.products?.brandName || result.products?.brand || ''}</span>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-6 md:p-10 space-y-6">
                    {/* METICULOUS CONTENT PARSER v3 */}
                    {(() => {
                      const rawText = result.generated_text || '';
                      // Clean markdown artifacts
                      const text = rawText;

                      // Split by newlines (handle both \n and missing newlines before emojis)
                      // Insert newlines before emoji bullets that might be inline, BUT skip if preceded by a dash/hyphen (to keep inline ratings like " - ⭐4.5/5" intact)
                      const normalizedText = text
                        .replace(/([^\-–—])\s+(⭐|🔑|🛠️|🎯|💰|👉|✨|🏁)/g, '$1\n$2')
                        .replace(/\s+(Why This|Bottom Line|Key Features|Specifications)/gi, '\n$1');

                      const lines = normalizedText.split(/\n/);

                      // Parse into structured sections
                      type Section = {
                        type: 'intro' | 'header' | 'feature-section' | 'bottom-line' | 'bullet' | 'paragraph' | 'cta';
                        content: string;
                        emoji?: string;
                        bullets?: { emoji: string | null; text: string }[];
                      };

                      const sections: Section[] = [];
                      let currentSection: Section | null = null;

                      lines.forEach((line: string) => {
                        let trimmed = line.trim();
                        if (!trimmed) return;

                        // Remove REDUNDANT TITLE at start if present
                        if (sections.length === 0) {
                          const productName = result.products?.name || '';
                          // Check for exact start match or fuzzy match
                          if (productName && trimmed.toLowerCase().startsWith(productName.toLowerCase())) {
                            trimmed = trimmed.substring(productName.length).trim();
                            // Remove leading formatting characters often left behind
                            trimmed = trimmed.replace(/^[:\-\–\—\s]+/, '');
                          }
                        }
                        if (!trimmed) return;

                        const lower = trimmed.toLowerCase();

                        // Detect section headers
                        const isFeatureHeader = lower.includes('why this') || lower.includes('stands out') || lower.includes('key features') || lower.includes('specifications');
                        const isBottomLine = lower.includes('bottom line');
                        const isCTA = trimmed.startsWith('👉');

                        // Detect emoji bullets
                        const emojiBulletMatch = trimmed.match(/^(⭐|🔑|🛠️|🎯|💰)\s*/);
                        const regularBulletMatch = trimmed.match(/^[•\-]\s*/);

                        if (isFeatureHeader) {
                          // Save previous section
                          if (currentSection) sections.push(currentSection);
                          currentSection = {
                            type: 'feature-section',
                            content: trimmed.replace(/:$/, ''),
                            bullets: []
                          };
                        } else if (isBottomLine) {
                          if (currentSection) sections.push(currentSection);
                          currentSection = {
                            type: 'bottom-line',
                            content: trimmed.replace(/:$/, ''),
                            bullets: []
                          };
                        } else if (isCTA) {
                          if (currentSection) sections.push(currentSection);
                          sections.push({
                            type: 'cta',
                            content: trimmed.replace(/^👉\s*/, '')
                          });
                          currentSection = null;
                        } else if (emojiBulletMatch) {
                          const emoji = emojiBulletMatch[1];
                          const bulletText = trimmed.replace(emojiBulletMatch[0], '');
                          // Prevent empty bullets (fixes lone star issue)
                          if (!bulletText.trim()) return;

                          if (currentSection && (currentSection.type === 'feature-section' || currentSection.type === 'bottom-line')) {
                            currentSection.bullets!.push({ emoji, text: bulletText });
                          } else {
                            // Standalone bullet
                            if (currentSection) sections.push(currentSection);
                            sections.push({
                              type: 'bullet',
                              content: bulletText,
                              emoji: emoji
                            });
                            currentSection = null;
                          }
                        } else if (regularBulletMatch) {
                          const bulletText = trimmed.replace(regularBulletMatch[0], '');
                          if (currentSection && currentSection.bullets) {
                            currentSection.bullets.push({ emoji: null, text: bulletText });
                          } else {
                            sections.push({ type: 'bullet', content: bulletText });
                          }
                        } else {
                          // Regular paragraph text
                          // Check if it's a product title (first substantial line, usually long)
                          if (sections.length === 0 && trimmed.length > 50) {
                            sections.push({ type: 'intro', content: trimmed });
                          } else if (currentSection && currentSection.type === 'bottom-line') {
                            // Add as paragraph content to bottom line
                            currentSection.bullets!.push({ emoji: null, text: trimmed });
                          } else {
                            if (currentSection) sections.push(currentSection);
                            sections.push({ type: 'paragraph', content: trimmed });
                            currentSection = null;
                          }
                        }
                      });

                      // Don't forget the last section
                      if (currentSection) sections.push(currentSection);

                      // RENDER
                      const parseMarkdown = (text: string) => {
                        const parts = text.split(/(\*\*.*?\*\*)/);
                        return parts.map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className="font-bold text-gray-900 dark:text-gray-100">{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        });
                      };

                      return sections.map((section, idx) => {
                        switch (section.type) {
                          case 'intro':
                            return (
                              <p key={idx} className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-6">
                                {parseMarkdown(section.content)}
                              </p>
                            );

                          case 'feature-section':
                            return (
                              <div key={idx} className="mb-6">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                  <span>✨</span>
                                  {parseMarkdown(section.content)}
                                </h3>
                                <div className="space-y-3 pl-1">
                                  {section.bullets?.map((bullet, bIdx) => (
                                    <div key={bIdx} className="flex gap-3 items-start">
                                      <span className="flex-shrink-0 mt-0.5">{bullet.emoji || '•'}</span>
                                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{parseMarkdown(bullet.text)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );

                          case 'bottom-line':
                            return (
                              <div key={idx} className="mb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                  <span>🏁</span>
                                  {parseMarkdown(section.content)}
                                </h3>
                                <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-2">
                                  {section.bullets?.map((item, bIdx) => (
                                    <p key={bIdx}>{parseMarkdown(item.text)}</p>
                                  ))}
                                </div>
                              </div>
                            );

                          case 'bullet':
                            return (
                              <div key={idx} className="flex gap-3 items-start mb-3">
                                <span className="flex-shrink-0 mt-0.5">{section.emoji || '•'}</span>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{parseMarkdown(section.content)}</p>
                              </div>
                            );

                          case 'cta':
                            return (
                              <div key={idx} className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
                                  <span>👉</span>
                                  {parseMarkdown(section.content)}
                                </p>
                              </div>
                            );

                          case 'paragraph':
                          default:
                            return (
                              <p key={idx} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                {parseMarkdown(section.content)}
                              </p>
                            );
                        }
                      });
                    })()}
                  </div>
                </div>

                {/* SEO Keywords Chips */}
                {result.seo_keywords && result.seo_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in delay-300">
                    {result.seo_keywords.map((keyword: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full font-medium shadow-sm"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center text-center bg-white/50 dark:bg-gray-800/50 rounded-2xl border-2 dashed border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to Create</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                  Select a product from the database or enter a SKU to generate premium marketing content instantly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}