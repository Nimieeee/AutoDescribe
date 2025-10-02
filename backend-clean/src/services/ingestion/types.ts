export interface ParsedProductData {
  sku: string;
  title: string;
  description?: string;
  price?: number;
  category?: string;
  brand?: string;
  features?: string[];
  specifications?: Record<string, any>;
  images?: string[];
  additional_text?: string;
}