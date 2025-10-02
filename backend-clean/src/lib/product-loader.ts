import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

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
  product_dimensions?: string;
  item_weight?: string;
  specific_uses_for_product?: string;
  age_range?: string;
}

class ProductLoader {
  private products: Product[] = [];
  private loaded = false;

  async loadProducts(): Promise<void> {
    if (this.loaded) return;

    const csvPath = process.env.CSV_PATH || './structured_products.csv';
    const fullPath = path.resolve(process.cwd(), csvPath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`CSV file not found at ${fullPath}`);
      console.log(`Looking for CSV at: ${fullPath}`);
      console.log(`Current directory: ${process.cwd()}`);
      console.log(`Available files in current directory:`, fs.readdirSync(process.cwd()).filter((f: string) => f.includes('.csv')));
      return;
    }

    console.log(`📁 Loading CSV from: ${fullPath}`);

    return new Promise((resolve, reject) => {
      const products: Product[] = [];

      fs.createReadStream(fullPath)
        .pipe(csv())
        .on('data', (row) => {
          // Clean and structure the product data
          const product: Product = {
            sku: row.sku || '',
            name: row.name || '',
            breadcrumbs_text: row.breadcrumbs_text || '',
            brandName: row.brandName || '',
            color: row.color,
            material: row.material,
            style: row.style,
            size: row.size,
            salePrice: row.salePrice,
            listedPrice: row.listedPrice,
            rating: row.rating,
            reviewCount: row.reviewCount,
            description: row.description,
            features_text: row.features_text,
            additional_text: row.additional_text,
            primary_category: row.primary_category,
            product_type: row.product_type,
            use_case: row.use_case,
            key_features: row.key_features ? row.key_features.split(',').map((f: string) => f.trim()) : [],
            price_tier: row.price_tier,
            target_audience: row.target_audience,
            product_dimensions: row.product_dimensions,
            item_weight: row.item_weight,
            specific_uses_for_product: row.specific_uses_for_product,
            age_range: row.age_range,
          };

          if (product.sku) {
            products.push(product);
          }
        })
        .on('end', () => {
          this.products = products;
          this.loaded = true;
          console.log(`Loaded ${products.length} products from CSV`);
          resolve();
        })
        .on('error', (error) => {
          console.error('Error loading CSV:', error);
          reject(error);
        });
    });
  }

  async findProductBySku(sku: string): Promise<Product | null> {
    await this.loadProducts();
    return this.products.find(p => p.sku === sku) || null;
  }

  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    await this.loadProducts();
    
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
    
    console.log(`🔍 Searching for "${query}" in ${this.products.length} products...`);
    
    const results = this.products.filter(product => {
      // Create searchable text from all product fields
      const searchableText = [
        product.name || '',
        product.brandName || '',
        product.sku || '',
        product.breadcrumbs_text || '',
        product.description || '',
        product.primary_category || '',
        product.product_type || '',
        product.use_case || '',
        product.color || '',
        product.material || '',
        product.style || '',
        product.size || '',
        product.features_text || '',
        product.additional_text || '',
        product.target_audience || '',
        product.specific_uses_for_product || ''
      ].join(' ').toLowerCase();

      // Check if the exact search term is found
      if (searchableText.includes(searchTerm)) {
        return true;
      }

      // Check if all search words are found (for multi-word searches)
      if (searchWords.length > 1) {
        return searchWords.every(word => searchableText.includes(word));
      }

      // Check for partial matches in key fields
      const keyFields = [
        product.name?.toLowerCase() || '',
        product.brandName?.toLowerCase() || '',
        product.sku?.toLowerCase() || ''
      ];

      return keyFields.some(field => field.includes(searchTerm));
    });

    console.log(`📦 Found ${results.length} matching products, returning top ${Math.min(results.length, limit)}`);
    
    return results.slice(0, limit);
  }

  async getAllProducts(): Promise<Product[]> {
    await this.loadProducts();
    return this.products;
  }

  async getProductCount(): Promise<number> {
    await this.loadProducts();
    return this.products.length;
  }

  async getRandomProducts(count: number = 10): Promise<Product[]> {
    await this.loadProducts();
    const shuffled = [...this.products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Advanced search with scoring and ranking
   */
  async searchProductsAdvanced(query: string, limit: number = 10): Promise<Product[]> {
    await this.loadProducts();
    
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
    
    console.log(`🔍 Advanced search for "${query}" in ${this.products.length} products...`);
    
    // Score each product based on relevance
    const scoredResults = this.products.map(product => {
      let score = 0;
      
      const name = (product.name || '').toLowerCase();
      const brand = (product.brandName || '').toLowerCase();
      const sku = (product.sku || '').toLowerCase();
      const category = (product.primary_category || '').toLowerCase();
      const description = (product.description || '').toLowerCase();
      
      // Exact matches get highest scores
      if (sku === searchTerm) score += 100;
      if (name === searchTerm) score += 90;
      if (brand === searchTerm) score += 80;
      
      // Starts with matches
      if (sku.startsWith(searchTerm)) score += 70;
      if (name.startsWith(searchTerm)) score += 60;
      if (brand.startsWith(searchTerm)) score += 50;
      
      // Contains matches
      if (sku.includes(searchTerm)) score += 40;
      if (name.includes(searchTerm)) score += 30;
      if (brand.includes(searchTerm)) score += 25;
      if (category.includes(searchTerm)) score += 20;
      if (description.includes(searchTerm)) score += 10;
      
      // Multi-word search: all words must be found
      if (searchWords.length > 1) {
        const allText = `${name} ${brand} ${sku} ${category} ${description}`;
        const foundWords = searchWords.filter(word => allText.includes(word));
        if (foundWords.length === searchWords.length) {
          score += 15 * foundWords.length;
        } else if (foundWords.length > 0) {
          score += 5 * foundWords.length;
        }
      }
      
      return { product, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

    console.log(`📦 Advanced search found ${scoredResults.length} matching products, returning top ${Math.min(scoredResults.length, limit)}`);
    
    return scoredResults.slice(0, limit).map(item => item.product);
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string, limit: number = 20): Promise<Product[]> {
    await this.loadProducts();
    
    const categoryLower = category.toLowerCase();
    const results = this.products.filter(product => 
      (product.primary_category?.toLowerCase().includes(categoryLower)) ||
      (product.breadcrumbs_text?.toLowerCase().includes(categoryLower)) ||
      (product.product_type?.toLowerCase().includes(categoryLower))
    );

    return results.slice(0, limit);
  }

  /**
   * Get products by brand
   */
  async getProductsByBrand(brand: string, limit: number = 20): Promise<Product[]> {
    await this.loadProducts();
    
    const brandLower = brand.toLowerCase();
    const results = this.products.filter(product => 
      product.brandName?.toLowerCase().includes(brandLower)
    );

    return results.slice(0, limit);
  }
}

export const productLoader = new ProductLoader();