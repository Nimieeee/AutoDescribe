// CSV RAG Service for the clean frontend
// This will call the backend API to get RAG context

export interface Product {
  sku: string;
  name: string;
  breadcrumbs_text: string;
  brandName: string;
  color?: string;
  material?: string;
  style?: string;
  size?: string;
  salePrice?: string;
  listedPrice?: string;
  rating?: string;
  reviewCount?: string;
  description?: string;
  features_text?: string;
  additional_text?: string;
  primary_category?: string;
  product_type?: string;
  use_case?: string;
  key_features?: string[];
  price_tier?: string;
  target_audience?: string;
}

export interface RAGContext {
  targetProduct: Product;
  similarProducts: Product[];
  categoryProducts: Product[];
  brandProducts: Product[];
  contextSummary: string;
}

export class CSVRAGService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  /**
   * Generate content using CSV RAG context
   */
  async generateContentWithRAG(
    sku: string,
    contentType: string = 'description',
    customPrompt?: string
  ): Promise<{
    success: boolean;
    content?: string;
    ragContext?: RAGContext;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/generate-with-rag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku,
          content_type: contentType,
          custom_prompt: customPrompt,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to generate content',
        };
      }

      return {
        success: true,
        content: result.generated_text,
        ragContext: result.rag_context,
      };
    } catch (error) {
      console.error('RAG generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search for products in the CSV
   */
  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/search-products?q=${encodeURIComponent(query)}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to search products');
      }

      const result = await response.json();
      return result.products || [];
    } catch (error) {
      console.error('Product search error:', error);
      return [];
    }
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(sku: string): Promise<Product | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/product/${sku}`);

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.product || null;
    } catch (error) {
      console.error('Get product error:', error);
      return null;
    }
  }
}

export const csvRAGService = new CSVRAGService();