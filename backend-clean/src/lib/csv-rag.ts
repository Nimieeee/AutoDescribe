import { Product, productLoader } from './product-loader';

export interface RAGContext {
  targetProduct: Product;
  similarProducts: Product[];
  categoryProducts: Product[];
  brandProducts: Product[];
  contextSummary: string;
}

export class CSVRAGService {
  /**
   * Generate RAG context for a product using CSV data
   */
  async generateRAGContext(sku: string, maxSimilarProducts: number = 5): Promise<RAGContext | null> {
    try {
      // Get the target product
      const targetProduct = await productLoader.findProductBySku(sku);
      if (!targetProduct) {
        return null;
      }

      console.log(`Generating RAG context for product: ${targetProduct.name}`);

      // Find similar products by different criteria
      const [similarProducts, categoryProducts, brandProducts] = await Promise.all([
        this.findSimilarProducts(targetProduct, maxSimilarProducts),
        this.findCategoryProducts(targetProduct, maxSimilarProducts),
        this.findBrandProducts(targetProduct, maxSimilarProducts),
      ]);

      // Create context summary
      const contextSummary = this.createContextSummary(
        targetProduct,
        similarProducts,
        categoryProducts,
        brandProducts
      );

      return {
        targetProduct,
        similarProducts,
        categoryProducts,
        brandProducts,
        contextSummary,
      };
    } catch (error) {
      console.error('Error generating RAG context:', error);
      return null;
    }
  }

  /**
   * Find similar products based on category, brand, and features
   */
  private async findSimilarProducts(targetProduct: Product, limit: number): Promise<Product[]> {
    const searchTerms = [
      targetProduct.primary_category,
      targetProduct.product_type,
      targetProduct.use_case,
      targetProduct.material,
      targetProduct.color,
      targetProduct.style,
      ...(targetProduct.key_features || []).slice(0, 3),
    ].filter(Boolean);

    const similarProducts: Product[] = [];
    const seenSkus = new Set([targetProduct.sku]);

    // Search for each term and collect unique products
    for (const term of searchTerms) {
      if (similarProducts.length >= limit || !term) break;
      
      const results = await productLoader.searchProducts(term, limit * 2);
      for (const product of results) {
        if (!seenSkus.has(product.sku) && similarProducts.length < limit) {
          const similarity = this.calculateSimilarity(targetProduct, product);
          if (similarity > 0.2) {
            similarProducts.push(product);
            seenSkus.add(product.sku);
          }
        }
      }
    }

    return similarProducts.slice(0, limit);
  }

  /**
   * Find products in the same category
   */
  private async findCategoryProducts(targetProduct: Product, limit: number): Promise<Product[]> {
    if (!targetProduct.breadcrumbs_text && !targetProduct.primary_category) return [];

    const searchTerm = targetProduct.primary_category || 
                      targetProduct.breadcrumbs_text.split(' > ').pop() || '';
    
    if (!searchTerm) return [];

    const results = await productLoader.searchProducts(searchTerm, limit * 2);
    return results
      .filter(product => product.sku !== targetProduct.sku)
      .slice(0, limit);
  }

  /**
   * Find products from the same brand
   */
  private async findBrandProducts(targetProduct: Product, limit: number): Promise<Product[]> {
    if (!targetProduct.brandName) return [];

    const results = await productLoader.searchProducts(targetProduct.brandName, limit * 2);
    return results
      .filter(product => product.sku !== targetProduct.sku)
      .slice(0, limit);
  }

  /**
   * Create a comprehensive context summary for the AI
   */
  private createContextSummary(
    targetProduct: Product,
    similarProducts: Product[],
    categoryProducts: Product[],
    brandProducts: Product[]
  ): string {
    let context = `TARGET PRODUCT ANALYSIS:\n`;
    context += `Product: ${targetProduct.name}\n`;
    context += `Brand: ${targetProduct.brandName}\n`;
    context += `SKU: ${targetProduct.sku}\n`;
    context += `Category: ${targetProduct.breadcrumbs_text || targetProduct.primary_category}\n`;
    context += `Price: ${targetProduct.salePrice ? `$${targetProduct.salePrice}` : 'N/A'}\n`;
    context += `Rating: ${targetProduct.rating ? `${targetProduct.rating}/5 stars` : 'N/A'}\n`;
    
    // Add product specifications
    if (targetProduct.color || targetProduct.material || targetProduct.style) {
      context += `\nSPECIFICATIONS:\n`;
      if (targetProduct.color) context += `Color: ${targetProduct.color}\n`;
      if (targetProduct.material) context += `Material: ${targetProduct.material}\n`;
      if (targetProduct.style) context += `Style: ${targetProduct.style}\n`;
      if (targetProduct.size) context += `Size: ${targetProduct.size}\n`;
      if (targetProduct.specific_uses_for_product) context += `Use: ${targetProduct.specific_uses_for_product}\n`;
    }
    
    // Add existing description
    if (targetProduct.description) {
      context += `\nEXISTING DESCRIPTION:\n${targetProduct.description.substring(0, 300)}...\n`;
    }
    
    // Add features
    if (targetProduct.features_text) {
      context += `\nFEATURES:\n${targetProduct.features_text.substring(0, 200)}...\n`;
    }

    // Add similar products context
    if (similarProducts.length > 0) {
      context += `\nSIMILAR PRODUCTS:\n`;
      similarProducts.slice(0, 3).forEach((product, index) => {
        context += `${index + 1}. ${product.name} - ${product.brandName}\n`;
        context += `   Price: ${product.salePrice ? `$${product.salePrice}` : 'N/A'} | Rating: ${product.rating || 'N/A'}\n`;
      });
    }

    // Add category context
    if (categoryProducts.length > 0) {
      const avgPrice = this.calculateAveragePrice(categoryProducts);
      context += `\nCATEGORY CONTEXT:\n`;
      context += `Average category price: $${avgPrice}\n`;
      context += `Category has ${categoryProducts.length} similar products\n`;
    }

    // Add brand context
    if (brandProducts.length > 0) {
      const brandAvgPrice = this.calculateAveragePrice(brandProducts);
      context += `\nBRAND CONTEXT:\n`;
      context += `Average brand price: $${brandAvgPrice}\n`;
      context += `Brand has ${brandProducts.length} other products\n`;
    }

    context += `\nCONTENT GUIDELINES:\n`;
    context += `- Use the product specifications and features\n`;
    context += `- Position appropriately within category and brand\n`;
    context += `- Highlight unique differentiators\n`;
    context += `- Reference competitive pricing if relevant\n`;
    context += `- Write naturally and avoid repetitive language\n`;

    return context.replace(/\*/g, '').trim();
  }

  /**
   * Calculate similarity between products
   */
  private calculateSimilarity(product1: Product, product2: Product): number {
    let score = 0;

    if (product1.primary_category === product2.primary_category) score += 0.3;
    if (product1.product_type === product2.product_type) score += 0.2;
    if (product1.brandName === product2.brandName) score += 0.2;
    if (product1.use_case === product2.use_case) score += 0.1;
    if (product1.material === product2.material) score += 0.1;
    if (product1.color === product2.color) score += 0.05;
    if (product1.style === product2.style) score += 0.05;

    return score;
  }

  private calculateAveragePrice(products: Product[]): string {
    const prices = products
      .map(p => parseFloat(p.salePrice || '0'))
      .filter(price => price > 0);
    
    if (prices.length === 0) return '0';
    
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    return avg.toFixed(2);
  }
}

export const csvRAGService = new CSVRAGService();