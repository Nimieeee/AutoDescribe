-- Clean Supabase Schema for Content Generation App
-- Run this in your Supabase SQL editor

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS generated_content CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  price DECIMAL,
  description TEXT,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated content table
CREATE TABLE generated_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL DEFAULT 'description',
  generated_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  seo_keywords TEXT[] DEFAULT '{}',
  quality_score DECIMAL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_generated_content_status ON generated_content(status);
CREATE INDEX idx_generated_content_product_id ON generated_content(product_id);
CREATE INDEX idx_generated_content_created_at ON generated_content(created_at DESC);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- RLS (Row Level Security) policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON products
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON generated_content
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Insert sample product for testing
INSERT INTO products (sku, name, brand, category, price, description) VALUES
('TEST-001', 'Sample Product for Testing', 'TestBrand', 'Electronics', 29.99, 'A sample product for testing the content generation system');

-- Verify the setup
SELECT 'Products table created' as status, count(*) as count FROM products;
SELECT 'Generated content table created' as status, count(*) as count FROM generated_content;