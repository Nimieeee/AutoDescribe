import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Product {
  id: string
  sku: string
  name: string
  brand?: string
  category?: string
  price?: number
  description?: string
  attributes?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface GeneratedContent {
  id: string
  product_id: string
  content_type: string
  generated_text: string
  edited_text?: string
  status: 'pending' | 'approved' | 'rejected'
  seo_keywords?: string[]
  quality_score?: number
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  products?: Product
}