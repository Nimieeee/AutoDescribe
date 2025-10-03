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
    this.apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://autodescribe.onrender.com';
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
      // Try backend API first
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

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          content: result.generated_text,
          ragContext: result.rag_context,
        };
      }
    } catch (error) {
      console.log('Backend not available, using fallback generation');
    }

    // Fallback: Generate demo content
    return this.generateFallbackContent(sku, contentType, customPrompt);
  }

  /**
   * Fallback content generation when backend is not available
   */
  private async generateFallbackContent(
    sku: string, 
    contentType: string, 
    customPrompt?: string
  ): Promise<{
    success: boolean;
    content?: string;
    ragContext?: RAGContext;
    error?: string;
  }> {
    // Find product in demo data
    const demoProducts = this.getFallbackSearchResults('', 100);
    const product = demoProducts.find(p => p.sku === sku) || {
      sku,
      name: `Product ${sku}`,
      breadcrumbs_text: 'Demo > Products > General',
      brandName: 'Demo Brand',
      primary_category: 'Electronics',
      description: 'Demo product for testing'
    };

    const content = `Discover the ${product.name} - a premium ${product.primary_category?.toLowerCase() || 'product'} from ${product.brandName}.

This exceptional product combines quality craftsmanship with innovative design, delivering outstanding performance and value. Perfect for customers who demand excellence and reliability.

Key features:
• Premium materials and construction
• Innovative design for optimal performance
• Excellent value for money
• Trusted brand quality
• Customer satisfaction guaranteed

${customPrompt ? `\nCustom requirements: ${customPrompt}` : ''}

Experience the difference with ${product.name} - your satisfaction is our priority.

*Note: This is demo content generated without backend connection. Connect your backend for AI-powered generation with real product data.*`;

    return {
      success: true,
      content,
      ragContext: {
        targetProduct: product,
        similarProducts: demoProducts.slice(0, 3),
        categoryProducts: demoProducts.filter(p => p.primary_category === product.primary_category).slice(0, 3),
        brandProducts: demoProducts.filter(p => p.brandName === product.brandName).slice(0, 3),
        contextSummary: 'Demo RAG context - connect backend for real data'
      }
    };
  }

  /**
   * Search for products in the CSV
   */
  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    try {
      // First try backend API
      const response = await fetch(
        `${this.apiUrl}/api/search-products?q=${encodeURIComponent(query)}&limit=${limit}`,
        { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.ok) {
        const result = await response.json();
        return result.products || [];
      }
    } catch (error) {
      console.log('Backend not available, using fallback search');
    }

    // Fallback: Use demo search results
    return this.getFallbackSearchResults(query, limit);
  }

  /**
   * Fallback search results when backend is not available
   */
  private getFallbackSearchResults(query: string, limit: number): Product[] {
    const demoProducts: Product[] = [
      {
        sku: 'B07VGRJDFY',
        name: 'Wireless Bluetooth Headphones',
        breadcrumbs_text: 'Electronics > Audio > Headphones',
        brandName: 'TechSound',
        primary_category: 'Electronics',
        description: 'Premium wireless headphones with noise cancellation'
      },
      {
        sku: 'B08N5WRWNW', 
        name: 'Smart Fitness Watch',
        breadcrumbs_text: 'Electronics > Wearables > Fitness',
        brandName: 'FitTech',
        primary_category: 'Electronics',
        description: 'Advanced fitness tracking with heart rate monitor'
      },
      {
        sku: 'F001234567',
        name: 'Organic Cotton T-Shirt',
        breadcrumbs_text: 'Clothing > Men > T-Shirts',
        brandName: 'EcoWear',
        primary_category: 'Clothing',
        description: 'Sustainable organic cotton t-shirt'
      },
      {
        sku: 'H987654321',
        name: 'Stainless Steel Water Bottle',
        breadcrumbs_text: 'Home > Kitchen > Drinkware',
        brandName: 'HydroLife',
        primary_category: 'Home & Kitchen',
        description: 'Insulated stainless steel water bottle'
      },
      {
        sku: 'C555666777',
        name: 'Gaming Mechanical Keyboard',
        breadcrumbs_text: 'Electronics > Computers > Keyboards',
        brandName: 'GameTech',
        primary_category: 'Electronics',
        description: 'RGB mechanical keyboard for gaming'
      }
    ];

    // Simple search filter
    const queryLower = query.toLowerCase();
    return demoProducts
      .filter(product => 
        product.name.toLowerCase().includes(queryLower) ||
        product.brandName.toLowerCase().includes(queryLower) ||
        product.primary_category?.toLowerCase().includes(queryLower) ||
        product.description?.toLowerCase().includes(queryLower)
      )
      .slice(0, limit);
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