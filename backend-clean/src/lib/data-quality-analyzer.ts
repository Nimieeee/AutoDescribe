import { supabase } from './supabase';
import { kpiEventCollector } from './kpi-event-collector';

// Data quality analysis interfaces
export interface ProductCompletenessResult {
  total_products: number;
  complete_products: number;
  completeness_percentage: number;
  completeness_by_field: Record<string, number>;
  quality_score: number;
  timestamp: Date;
}

export interface DataNormalizationResult {
  total_products: number;
  normalized_products: number;
  normalization_percentage: number;
  normalization_by_field: Record<string, number>;
  consistency_score: number;
  timestamp: Date;
}

export interface AttributeConsistencyResult {
  field_name: string;
  total_values: number;
  consistent_values: number;
  consistency_percentage: number;
  common_formats: string[];
  inconsistent_examples: string[];
}

// Product data structure for analysis
export interface ProductData {
  id: string;
  sku?: string;
  name?: string;
  price?: number;
  description?: string;
  category?: string;
  brand?: string;
  weight?: string;
  dimensions?: string;
  color?: string;
  material?: string;
  availability?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class DataQualityAnalyzer {
  private static instance: DataQualityAnalyzer;
  
  // Required fields for completeness analysis
  private readonly requiredFields = ['sku', 'name', 'price', 'description'];
  
  // Optional fields that contribute to quality score
  private readonly optionalFields = ['category', 'brand', 'weight', 'dimensions', 'color', 'material'];
  
  // Weight factors for quality score calculation
  private readonly fieldWeights = {
    sku: 0.25,
    name: 0.25,
    price: 0.20,
    description: 0.15,
    category: 0.05,
    brand: 0.03,
    weight: 0.02,
    dimensions: 0.02,
    color: 0.02,
    material: 0.01
  };

  private constructor() {}

  static getInstance(): DataQualityAnalyzer {
    if (!DataQualityAnalyzer.instance) {
      DataQualityAnalyzer.instance = new DataQualityAnalyzer();
    }
    return DataQualityAnalyzer.instance;
  }

  /**
   * Analyze product data completeness
   */
  async analyzeProductCompleteness(): Promise<ProductCompletenessResult> {
    try {
      console.log('🔍 Starting product completeness analysis...');
      
      // Fetch all products from the database
      const { data: products, error } = await supabase
        .from('products')
        .select('*');

      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      if (!products || products.length === 0) {
        console.log('⚠️ No products found in database');
        return {
          total_products: 0,
          complete_products: 0,
          completeness_percentage: 0,
          completeness_by_field: {},
          quality_score: 0,
          timestamp: new Date()
        };
      }

      const totalProducts = products.length;
      const completenessResults = this.calculateCompleteness(products);
      
      // Calculate overall quality score
      const qualityScore = this.calculateQualityScore(products);
      
      const result: ProductCompletenessResult = {
        total_products: totalProducts,
        complete_products: completenessResults.completeProducts,
        completeness_percentage: (completenessResults.completeProducts / totalProducts) * 100,
        completeness_by_field: completenessResults.fieldCompleteness,
        quality_score: qualityScore,
        timestamp: new Date()
      };

      // Collect KPI event
      await kpiEventCollector.collectDataQualityEvent(
        result.total_products,
        result.complete_products,
        result.complete_products, // normalized_products (same as complete for now)
        result.quality_score
      );

      console.log(`📊 Completeness analysis complete: ${result.completeness_percentage.toFixed(2)}% complete`);
      return result;

    } catch (error) {
      console.error('Error analyzing product completeness:', error);
      throw error;
    }
  }

  /**
   * Analyze data normalization and consistency
   */
  async analyzeDataNormalization(): Promise<DataNormalizationResult> {
    try {
      console.log('🔍 Starting data normalization analysis...');
      
      const { data: products, error } = await supabase
        .from('products')
        .select('*');

      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      if (!products || products.length === 0) {
        return {
          total_products: 0,
          normalized_products: 0,
          normalization_percentage: 0,
          normalization_by_field: {},
          consistency_score: 0,
          timestamp: new Date()
        };
      }

      const totalProducts = products.length;
      const normalizationResults = this.calculateNormalization(products);
      
      const result: DataNormalizationResult = {
        total_products: totalProducts,
        normalized_products: normalizationResults.normalizedProducts,
        normalization_percentage: (normalizationResults.normalizedProducts / totalProducts) * 100,
        normalization_by_field: normalizationResults.fieldNormalization,
        consistency_score: normalizationResults.consistencyScore,
        timestamp: new Date()
      };

      console.log(`📊 Normalization analysis complete: ${result.normalization_percentage.toFixed(2)}% normalized`);
      return result;

    } catch (error) {
      console.error('Error analyzing data normalization:', error);
      throw error;
    }
  }

  /**
   * Analyze attribute consistency for specific fields
   */
  async analyzeAttributeConsistency(fieldName: string): Promise<AttributeConsistencyResult> {
    try {
      console.log(`🔍 Analyzing attribute consistency for field: ${fieldName}`);
      
      const { data: products, error } = await supabase
        .from('products')
        .select(fieldName);

      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      if (!products || products.length === 0) {
        return {
          field_name: fieldName,
          total_values: 0,
          consistent_values: 0,
          consistency_percentage: 0,
          common_formats: [],
          inconsistent_examples: []
        };
      }

      const values = products
        .map(p => (p as any)[fieldName])
        .filter(v => v !== null && v !== undefined && v !== '');

      const consistencyAnalysis = this.analyzeFieldConsistency(fieldName, values);
      
      return {
        field_name: fieldName,
        total_values: values.length,
        consistent_values: consistencyAnalysis.consistentCount,
        consistency_percentage: values.length > 0 ? (consistencyAnalysis.consistentCount / values.length) * 100 : 0,
        common_formats: consistencyAnalysis.commonFormats,
        inconsistent_examples: consistencyAnalysis.inconsistentExamples
      };

    } catch (error) {
      console.error(`Error analyzing attribute consistency for ${fieldName}:`, error);
      throw error;
    }
  }

  /**
   * Get comprehensive data quality report
   */
  async getDataQualityReport(): Promise<{
    completeness: ProductCompletenessResult;
    normalization: DataNormalizationResult;
    attributeConsistency: AttributeConsistencyResult[];
  }> {
    try {
      console.log('📋 Generating comprehensive data quality report...');
      
      const [completeness, normalization] = await Promise.all([
        this.analyzeProductCompleteness(),
        this.analyzeDataNormalization()
      ]);

      // Analyze consistency for key fields
      const fieldsToAnalyze = ['price', 'weight', 'dimensions', 'category'];
      const attributeConsistency = await Promise.all(
        fieldsToAnalyze.map(field => this.analyzeAttributeConsistency(field))
      );

      return {
        completeness,
        normalization,
        attributeConsistency
      };

    } catch (error) {
      console.error('Error generating data quality report:', error);
      throw error;
    }
  }

  /**
   * Calculate completeness metrics for products
   */
  private calculateCompleteness(products: any[]): {
    completeProducts: number;
    fieldCompleteness: Record<string, number>;
  } {
    const fieldCompleteness: Record<string, number> = {};
    let completeProducts = 0;

    // Calculate completeness for each field
    [...this.requiredFields, ...this.optionalFields].forEach(field => {
      const completeCount = products.filter(product => 
        this.isFieldComplete(product[field])
      ).length;
      fieldCompleteness[field] = (completeCount / products.length) * 100;
    });

    // Count products that have all required fields
    completeProducts = products.filter(product => 
      this.requiredFields.every(field => this.isFieldComplete(product[field]))
    ).length;

    return { completeProducts, fieldCompleteness };
  }

  /**
   * Calculate normalization metrics for products
   */
  private calculateNormalization(products: any[]): {
    normalizedProducts: number;
    fieldNormalization: Record<string, number>;
    consistencyScore: number;
  } {
    const fieldNormalization: Record<string, number> = {};
    let totalConsistencyScore = 0;
    let fieldsAnalyzed = 0;

    // Analyze normalization for specific fields
    const fieldsToNormalize = ['price', 'weight', 'dimensions'];
    
    fieldsToNormalize.forEach(field => {
      const values = products
        .map(p => p[field])
        .filter(v => v !== null && v !== undefined && v !== '');
      
      if (values.length > 0) {
        const consistency = this.calculateFieldConsistency(field, values);
        fieldNormalization[field] = consistency;
        totalConsistencyScore += consistency;
        fieldsAnalyzed++;
      }
    });

    const consistencyScore = fieldsAnalyzed > 0 ? totalConsistencyScore / fieldsAnalyzed : 0;
    
    // Count products with normalized data (all analyzed fields meet consistency threshold)
    const normalizedProducts = products.filter(product => {
      return fieldsToNormalize.every(field => {
        const value = product[field];
        if (!this.isFieldComplete(value)) return true; // Skip empty fields
        return this.isFieldNormalized(field, value);
      });
    }).length;

    return { normalizedProducts, fieldNormalization, consistencyScore };
  }

  /**
   * Calculate quality score based on field weights
   */
  private calculateQualityScore(products: any[]): number {
    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(this.fieldWeights).forEach(([field, weight]) => {
      const completeCount = products.filter(product => 
        this.isFieldComplete(product[field])
      ).length;
      
      const fieldScore = products.length > 0 ? (completeCount / products.length) : 0;
      totalScore += fieldScore * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  }

  /**
   * Check if a field value is complete (not null, undefined, or empty)
   */
  private isFieldComplete(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (typeof value === 'number' && (isNaN(value) || value <= 0)) return false;
    return true;
  }

  /**
   * Check if a field value is normalized according to expected format
   */
  private isFieldNormalized(field: string, value: any): boolean {
    switch (field) {
      case 'price':
        return typeof value === 'number' && value > 0;
      
      case 'weight':
        // Check for consistent weight format (e.g., "1.5 kg", "500 g")
        if (typeof value !== 'string') return false;
        return /^\d+(\.\d+)?\s*(kg|g|lb|oz)$/i.test(value.trim());
      
      case 'dimensions':
        // Check for consistent dimension format (e.g., "10x5x3 cm", "12 x 8 x 4 inches")
        if (typeof value !== 'string') return false;
        return /^\d+(\.\d+)?\s*x\s*\d+(\.\d+)?\s*x\s*\d+(\.\d+)?\s*(cm|mm|in|inches)$/i.test(value.trim());
      
      default:
        return true; // For other fields, assume normalized if present
    }
  }

  /**
   * Calculate consistency percentage for a specific field
   */
  private calculateFieldConsistency(field: string, values: any[]): number {
    if (values.length === 0) return 0;
    
    const consistentCount = values.filter(value => 
      this.isFieldNormalized(field, value)
    ).length;
    
    return (consistentCount / values.length) * 100;
  }

  /**
   * Analyze field consistency and return detailed results
   */
  private analyzeFieldConsistency(field: string, values: any[]): {
    consistentCount: number;
    commonFormats: string[];
    inconsistentExamples: string[];
  } {
    if (values.length === 0) {
      return { consistentCount: 0, commonFormats: [], inconsistentExamples: [] };
    }

    const consistent: any[] = [];
    const inconsistent: any[] = [];
    const formatCounts: Record<string, number> = {};

    values.forEach(value => {
      if (this.isFieldNormalized(field, value)) {
        consistent.push(value);
        
        // Track format patterns
        const format = this.getValueFormat(field, value);
        formatCounts[format] = (formatCounts[format] || 0) + 1;
      } else {
        inconsistent.push(value);
      }
    });

    // Get most common formats
    const commonFormats = Object.entries(formatCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([format]) => format);

    // Get sample inconsistent examples
    const inconsistentExamples = inconsistent
      .slice(0, 5)
      .map(v => String(v));

    return {
      consistentCount: consistent.length,
      commonFormats,
      inconsistentExamples
    };
  }

  /**
   * Get format pattern for a value
   */
  private getValueFormat(field: string, value: any): string {
    switch (field) {
      case 'price':
        return typeof value === 'number' ? 'numeric' : 'non-numeric';
      
      case 'weight':
        if (typeof value !== 'string') return 'non-string';
        const weightMatch = value.match(/^\d+(\.\d+)?\s*(kg|g|lb|oz)$/i);
        return weightMatch ? `number + ${weightMatch[2].toLowerCase()}` : 'invalid format';
      
      case 'dimensions':
        if (typeof value !== 'string') return 'non-string';
        const dimMatch = value.match(/^\d+(\.\d+)?\s*x\s*\d+(\.\d+)?\s*x\s*\d+(\.\d+)?\s*(cm|mm|in|inches)$/i);
        return dimMatch ? `LxWxH + ${dimMatch[4].toLowerCase()}` : 'invalid format';
      
      default:
        return typeof value;
    }
  }
}

// Export singleton instance
export const dataQualityAnalyzer = DataQualityAnalyzer.getInstance();