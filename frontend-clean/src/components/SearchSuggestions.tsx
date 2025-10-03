'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Package, Tag, Building2 } from 'lucide-react'

interface SearchSuggestion {
  type: 'product' | 'category' | 'brand'
  value: string
  label: string
  count?: number
}

interface SearchSuggestionsProps {
  query: string
  onSelect: (suggestion: SearchSuggestion) => void
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export default function SearchSuggestions({
  query,
  onSelect,
  onSearch,
  placeholder = "Search products, categories, or brands...",
  className = ""
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounced search for suggestions
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        fetchSuggestions(query.trim())
      } else {
        setSuggestions([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const fetchSuggestions = async (searchQuery: string) => {
    setLoading(true)
    try {
      // Get backend URL from environment
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      
      // Fetch suggestions from multiple endpoints
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        fetch(`${backendUrl}/api/search-products?q=${encodeURIComponent(searchQuery)}&limit=5`),
        fetch(`${backendUrl}/api/search-category?category=${encodeURIComponent(searchQuery)}&limit=3`),
        fetch(`${backendUrl}/api/search-brand?brand=${encodeURIComponent(searchQuery)}&limit=3`)
      ])

      const [products, categories, brands] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
        brandsRes.json()
      ])

      const newSuggestions: SearchSuggestion[] = []

      // Add product suggestions
      if (products.success && products.products) {
        products.products.forEach((product: any) => {
          newSuggestions.push({
            type: 'product',
            value: product.sku,
            label: `${product.name} (${product.sku})`,
            count: 1
          })
        })
      }

      // Add category suggestions
      if (categories.success && categories.products) {
        const categorySet = new Set<string>()
        categories.products.forEach((product: any) => {
          if (product.category && !categorySet.has(product.category)) {
            categorySet.add(product.category)
            newSuggestions.push({
              type: 'category',
              value: product.category,
              label: product.category,
              count: categories.count
            })
          }
        })
      }

      // Add brand suggestions
      if (brands.success && brands.products) {
        const brandSet = new Set<string>()
        brands.products.forEach((product: any) => {
          if (product.brand && !brandSet.has(product.brand)) {
            brandSet.add(product.brand)
            newSuggestions.push({
              type: 'brand',
              value: product.brand,
              label: product.brand,
              count: brands.count
            })
          }
        })
      }

      setSuggestions(newSuggestions.slice(0, 8)) // Limit to 8 suggestions
      setIsOpen(newSuggestions.length > 0)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex])
        } else {
          onSearch(query)
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    onSelect(suggestion)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="w-4 h-4 text-blue-500" />
      case 'category':
        return <Tag className="w-4 h-4 text-green-500" />
      case 'brand':
        return <Building2 className="w-4 h-4 text-purple-500" />
      default:
        return <Search className="w-4 h-4 text-gray-500" />
    }
  }

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'product':
        return 'Product'
      case 'category':
        return 'Category'
      case 'brand':
        return 'Brand'
      default:
        return ''
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true)
            }
          }}
          onBlur={() => {
            // Delay closing to allow clicking on suggestions
            setTimeout(() => setIsOpen(false), 200)
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.value}`}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getSuggestionIcon(suggestion.type)}
                  <div>
                    <div className="font-medium text-gray-900">
                      {suggestion.label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getSuggestionTypeLabel(suggestion.type)}
                      {suggestion.count && suggestion.count > 1 && (
                        <span className="ml-1">({suggestion.count} items)</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 uppercase">
                  {suggestion.type}
                </div>
              </div>
            </div>
          ))}
          
          {/* Search all results option */}
          <div
            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-t border-gray-200 ${
              selectedIndex === suggestions.length ? 'bg-blue-50' : ''
            }`}
            onClick={() => {
              onSearch(query)
              setIsOpen(false)
            }}
          >
            <div className="flex items-center space-x-3">
              <Search className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900">
                  Search for "{query}"
                </div>
                <div className="text-sm text-gray-500">
                  View all results
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}