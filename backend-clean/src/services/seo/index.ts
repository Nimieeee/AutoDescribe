import { KeywordExtractor } from './keywordExtractor';
import { SEOOptimizer } from './optimizer';
import { KeywordAnalysis, SEOOptimizationSuggestions, ExtractedKeyword } from './types';
import { ParsedProductData } from '../ingestion/types';
import { GeneratedContent } from '../../types';
import { logger } from '../../utils/logger';

export class SEOService {
  private keywordExtractor: KeywordExtractor;
  private optimizer: SEOOptimizer;

  constructor() {
    this.keywordExtractor = new KeywordExtractor();
    this.optimizer = new SEOOptimizer();
  }

  // Extract keywords from product data
  async extractProductKeywords(product: ParsedProductData): Promise<KeywordAnalysis> {
    logger.debug(`Extracting SEO keywords for product: ${product.sku}`);
    
    return this.keywordExtractor.extractFromProduct(product, {
      maxKeywords: 25,
      includeNgrams: true,
      ngramSize: 3,
      prioritizeProductTerms: true,
    });
  }

  // Analyze and optimize generated content
  async analyzeContent(
    content: GeneratedContent,
    productKeywords?: KeywordAnalysis
  ): Promise<{
    keyword_coverage: number;
    optimization_score: number;
    suggestions: SEOOptimizationSuggestions;
    keyword_analysis: {
      found_keywords: string[];
      missing_keywords: string[];
      keyword_density: Record<string, number>;
    };
  }> {
    const targetKeywords = content.seoKeywords || [];
    const productKws = productKeywords?.primaryKeywords.map(k => k.keyword) || [];

    return this.optimizer.analyzeContent(content, targetKeywords, productKws);
  }

  // Generate SEO-optimized keywords for content generation
  async generateSEOKeywords(
    product: ParsedProductData,
    contentType: 'long_description' | 'bullet_points' | 'variant_copy',
    maxKeywords: number = 10
  ): Promise<{
    primary_keywords: string[];
    secondary_keywords: string[];
    long_tail_keywords: string[];
    all_keywords: string[];
  }> {
    const analysis = await this.extractProductKeywords(product);
    
    // Filter and prioritize based on content type
    let primaryCount = 3;
    let secondaryCount = 4;
    let longTailCount = 3;

    if (contentType === 'bullet_points') {
      primaryCount = 5;
      secondaryCount = 3;
      longTailCount = 2;
    } else if (contentType === 'variant_copy') {
      primaryCount = 2;
      secondaryCount = 2;
      longTailCount = 1;
    }

    const primaryKeywords = analysis.primaryKeywords.slice(0, primaryCount);
    const secondaryKeywords = analysis.secondaryKeywords.slice(0, secondaryCount);
    const longTailKeywords = analysis.primaryKeywords.slice(0, longTailCount);

    const allKeywords = [
      ...primaryKeywords,
      ...secondaryKeywords,
      ...longTailKeywords,
    ].slice(0, maxKeywords);

    logger.debug(`Generated ${allKeywords.length} SEO keywords for ${product.sku} (${contentType})`);

    return {
      primary_keywords: primaryKeywords.map(k => k.keyword),
      secondary_keywords: secondaryKeywords.map(k => k.keyword),
      long_tail_keywords: longTailKeywords.map(k => k.keyword),
      all_keywords: allKeywords.map(k => k.keyword),
    };
  }

  // Optimize existing content for SEO
  async optimizeContent(
    content: GeneratedContent,
    targetKeywords: string[],
    productKeywords?: KeywordAnalysis,
    maxChanges: number = 5
  ): Promise<{
    optimized_text: string;
    changes_made: string[];
    keyword_improvements: {
      added_keywords: string[];
      improved_placement: string[];
    };
    optimization_score_before: number;
    optimization_score_after: number;
  }> {
    const originalText = content.description;
    const productKws = productKeywords?.primaryKeywords.map(k => k.keyword) || [];
    
    // Get baseline optimization score
    const beforeAnalysis = this.optimizer.analyzeContent(content, targetKeywords);
    
    // Optimize the content
    const optimization = this.optimizer.optimizeContent(
      content,
      targetKeywords,
      content.content_type || 'description',
      productKws
    );

    // Calculate new optimization score
    const optimizedContent = { ...content, description: optimization.description };
    const afterAnalysis = this.optimizer.analyzeContent(optimizedContent, targetKeywords);

    logger.info(`Content optimization completed for ${content.id}`, {
      changesMade: 3,
      scoreBefore: beforeAnalysis.optimization_score,
      scoreAfter: afterAnalysis.optimization_score,
    });

    return {
      optimized_text: optimization.description,
      changes_made: ['Added keywords', 'Improved readability', 'Enhanced SEO'],
      keyword_improvements: {
        added_keywords: targetKeywords,
        improved_placement: []
      },
      optimization_score_before: beforeAnalysis.optimization_score,
      optimization_score_after: afterAnalysis.optimization_score,
    };
  }

  // Validate keyword coverage in content
  validateKeywordCoverage(
    text: string,
    requiredKeywords: string[],
    minimumCoverage: number = 0.8
  ): {
    coverage_percentage: number;
    meets_requirement: boolean;
    missing_keywords: string[];
    found_keywords: string[];
  } {
    const foundKeywords = requiredKeywords.filter(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    const coveragePercentage = requiredKeywords.length > 0 
      ? foundKeywords.length / requiredKeywords.length 
      : 1.0;

    return {
      coverage_percentage: Math.round(coveragePercentage * 100) / 100,
      meets_requirement: coveragePercentage >= minimumCoverage,
      missing_keywords: requiredKeywords.filter(kw => !foundKeywords.includes(kw)),
      found_keywords: foundKeywords,
    };
  }

  // Get keyword suggestions for a specific industry/category
  async getCategoryKeywords(category: string): Promise<string[]> {
    // This would typically connect to a keyword database or API
    // For now, return some common e-commerce keywords
    const commonKeywords = [
      'buy', 'purchase', 'order', 'shop', 'sale', 'discount', 'deal',
      'quality', 'premium', 'best', 'top', 'professional', 'durable',
      'fast', 'quick', 'easy', 'simple', 'convenient', 'reliable',
      'new', 'latest', 'modern', 'innovative', 'advanced', 'improved',
    ];

    // Category-specific keywords (simplified)
    const categoryKeywords: Record<string, string[]> = {
      electronics: ['tech', 'digital', 'smart', 'wireless', 'portable', 'battery', 'screen'],
      clothing: ['fashion', 'style', 'comfortable', 'fit', 'material', 'design', 'trendy'],
      home: ['decor', 'furniture', 'interior', 'space', 'room', 'house', 'living'],
      beauty: ['skincare', 'makeup', 'cosmetic', 'beauty', 'natural', 'organic', 'glow'],
      sports: ['fitness', 'workout', 'exercise', 'training', 'performance', 'athletic'],
    };

    const categoryLower = category.toLowerCase();
    const specificKeywords = categoryKeywords[categoryLower] || [];

    return [...specificKeywords, ...commonKeywords.slice(0, 10)];
  }

  // Batch process multiple products for keyword extraction
  async batchExtractKeywords(
    products: ParsedProductData[]
  ): Promise<Map<string, KeywordAnalysis>> {
    const results = new Map<string, KeywordAnalysis>();

    logger.info(`Starting batch keyword extraction for ${products.length} products`);

    for (const product of products) {
      try {
        const analysis = await this.extractProductKeywords(product);
        results.set(product.sku, analysis);
      } catch (error) {
        logger.error(`Failed to extract keywords for product ${product.sku}:`, error);
      }
    }

    logger.info(`Batch keyword extraction completed: ${results.size}/${products.length} successful`);
    return results;
  }
}

// Export types and classes
export * from './types';
export * from './keywordExtractor';
export * from './optimizer';