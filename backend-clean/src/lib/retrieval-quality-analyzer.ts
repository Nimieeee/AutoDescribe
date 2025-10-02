import { supabase } from './supabase';
import { kpiEventCollector } from './kpi-event-collector';

// Retrieval quality analysis interfaces
export interface SearchResult {
  id: string;
  sku: string;
  name: string;
  description: string;
  category?: string;
  relevance_score?: number;
  rank?: number;
}

export interface RetrievalQualityMetrics {
  query: string;
  total_results: number;
  precision_at_k: Record<number, number>; // {1: 0.8, 5: 0.6, 10: 0.4}
  recall_at_k: Record<number, number>;
  mean_reciprocal_rank: number;
  average_precision: number;
  ndcg_at_k: Record<number, number>; // Normalized Discounted Cumulative Gain
  response_time_ms: number;
  session_id: string;
  timestamp: Date;
}

export interface RelevanceJudgment {
  query: string;
  result_id: string;
  relevance_score: number; // 0-4 scale (0=irrelevant, 4=highly relevant)
  judged_by?: string;
  judged_at: Date;
}

export interface QueryPerformanceAnalysis {
  query: string;
  frequency: number;
  avg_precision_at_5: number;
  avg_recall_at_5: number;
  avg_mrr: number;
  avg_response_time_ms: number;
  success_rate: number;
  last_analyzed: Date;
}

export class RetrievalQualityAnalyzer {
  private static instance: RetrievalQualityAnalyzer;
  
  // Standard K values for evaluation
  private readonly kValues = [1, 3, 5, 10, 20];
  
  // Relevance threshold for binary relevance (3+ is considered relevant)
  private readonly relevanceThreshold = 3;

  private constructor() {}

  static getInstance(): RetrievalQualityAnalyzer {
    if (!RetrievalQualityAnalyzer.instance) {
      RetrievalQualityAnalyzer.instance = new RetrievalQualityAnalyzer();
    }
    return RetrievalQualityAnalyzer.instance;
  }

  /**
   * Calculate Precision@K for search results
   */
  calculatePrecisionAtK(
    results: SearchResult[], 
    relevanceJudgments: RelevanceJudgment[], 
    k: number
  ): number {
    if (results.length === 0 || k <= 0) return 0;
    
    const topKResults = results.slice(0, k);
    let relevantCount = 0;
    
    topKResults.forEach(result => {
      const judgment = relevanceJudgments.find(j => j.result_id === result.id);
      if (judgment && judgment.relevance_score >= this.relevanceThreshold) {
        relevantCount++;
      }
    });
    
    return relevantCount / Math.min(k, results.length);
  }

  /**
   * Calculate Recall@K for search results
   */
  calculateRecallAtK(
    results: SearchResult[], 
    relevanceJudgments: RelevanceJudgment[], 
    k: number
  ): number {
    if (results.length === 0 || k <= 0) return 0;
    
    // Total relevant documents for this query
    const totalRelevant = relevanceJudgments.filter(j => 
      j.relevance_score >= this.relevanceThreshold
    ).length;
    
    if (totalRelevant === 0) return 0;
    
    const topKResults = results.slice(0, k);
    let relevantRetrieved = 0;
    
    topKResults.forEach(result => {
      const judgment = relevanceJudgments.find(j => j.result_id === result.id);
      if (judgment && judgment.relevance_score >= this.relevanceThreshold) {
        relevantRetrieved++;
      }
    });
    
    return relevantRetrieved / totalRelevant;
  }

  /**
   * Calculate Mean Reciprocal Rank (MRR)
   */
  calculateMRR(results: SearchResult[], relevanceJudgments: RelevanceJudgment[]): number {
    if (results.length === 0) return 0;
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const judgment = relevanceJudgments.find(j => j.result_id === result.id);
      
      if (judgment && judgment.relevance_score >= this.relevanceThreshold) {
        return 1 / (i + 1); // Rank is 1-indexed
      }
    }
    
    return 0; // No relevant results found
  }

  /**
   * Calculate Average Precision (AP)
   */
  calculateAveragePrecision(
    results: SearchResult[], 
    relevanceJudgments: RelevanceJudgment[]
  ): number {
    if (results.length === 0) return 0;
    
    let precisionSum = 0;
    let relevantCount = 0;
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const judgment = relevanceJudgments.find(j => j.result_id === result.id);
      
      if (judgment && judgment.relevance_score >= this.relevanceThreshold) {
        relevantCount++;
        const precisionAtI = relevantCount / (i + 1);
        precisionSum += precisionAtI;
      }
    }
    
    const totalRelevant = relevanceJudgments.filter(j => 
      j.relevance_score >= this.relevanceThreshold
    ).length;
    
    return totalRelevant > 0 ? precisionSum / totalRelevant : 0;
  }

  /**
   * Calculate Normalized Discounted Cumulative Gain (NDCG@K)
   */
  calculateNDCGAtK(
    results: SearchResult[], 
    relevanceJudgments: RelevanceJudgment[], 
    k: number
  ): number {
    if (results.length === 0 || k <= 0) return 0;
    
    const topKResults = results.slice(0, k);
    
    // Calculate DCG@K
    let dcg = 0;
    topKResults.forEach((result, index) => {
      const judgment = relevanceJudgments.find(j => j.result_id === result.id);
      const relevance = judgment ? judgment.relevance_score : 0;
      const rank = index + 1;
      
      if (rank === 1) {
        dcg += relevance;
      } else {
        dcg += relevance / Math.log2(rank);
      }
    });
    
    // Calculate IDCG@K (Ideal DCG)
    const sortedRelevances = relevanceJudgments
      .map(j => j.relevance_score)
      .sort((a, b) => b - a)
      .slice(0, k);
    
    let idcg = 0;
    sortedRelevances.forEach((relevance, index) => {
      const rank = index + 1;
      if (rank === 1) {
        idcg += relevance;
      } else {
        idcg += relevance / Math.log2(rank);
      }
    });
    
    return idcg > 0 ? dcg / idcg : 0;
  }

  /**
   * Analyze retrieval quality for a specific search query
   */
  async analyzeSearchQuality(
    query: string,
    results: SearchResult[],
    sessionId: string,
    responseTimeMs: number
  ): Promise<RetrievalQualityMetrics> {
    try {
      console.log(`🔍 Analyzing retrieval quality for query: "${query}"`);
      
      // Get relevance judgments for this query
      const relevanceJudgments = await this.getRelevanceJudgments(query);
      
      // Calculate metrics for different K values
      const precisionAtK: Record<number, number> = {};
      const recallAtK: Record<number, number> = {};
      const ndcgAtK: Record<number, number> = {};
      
      this.kValues.forEach(k => {
        precisionAtK[k] = this.calculatePrecisionAtK(results, relevanceJudgments, k);
        recallAtK[k] = this.calculateRecallAtK(results, relevanceJudgments, k);
        ndcgAtK[k] = this.calculateNDCGAtK(results, relevanceJudgments, k);
      });
      
      const mrr = this.calculateMRR(results, relevanceJudgments);
      const averagePrecision = this.calculateAveragePrecision(results, relevanceJudgments);
      
      const metrics: RetrievalQualityMetrics = {
        query,
        total_results: results.length,
        precision_at_k: precisionAtK,
        recall_at_k: recallAtK,
        mean_reciprocal_rank: mrr,
        average_precision: averagePrecision,
        ndcg_at_k: ndcgAtK,
        response_time_ms: responseTimeMs,
        session_id: sessionId,
        timestamp: new Date()
      };
      
      // Store metrics in database
      await this.storeRetrievalMetrics(metrics);
      
      // Collect KPI event for search quality
      await kpiEventCollector.collectSearchEvent(
        query,
        results.length,
        responseTimeMs,
        sessionId
      );
      
      console.log(`📊 Retrieval quality analysis complete - P@5: ${precisionAtK[5]?.toFixed(3)}, MRR: ${mrr.toFixed(3)}`);
      return metrics;
      
    } catch (error) {
      console.error('Error analyzing search quality:', error);
      throw error;
    }
  }

  /**
   * Get historical query performance analysis
   */
  async getQueryPerformanceAnalysis(
    timeRangeHours: number = 24
  ): Promise<QueryPerformanceAnalysis[]> {
    try {
      console.log(`📊 Analyzing query performance for last ${timeRangeHours} hours`);
      
      const cutoffTime = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
      
      const { data: metrics, error } = await supabase
        .from('retrieval_quality_metrics')
        .select('*')
        .gte('timestamp', cutoffTime.toISOString())
        .order('timestamp', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to fetch retrieval metrics: ${error.message}`);
      }
      
      if (!metrics || metrics.length === 0) {
        return [];
      }
      
      // Group metrics by query
      const queryGroups: Record<string, any[]> = {};
      metrics.forEach(metric => {
        if (!queryGroups[metric.query]) {
          queryGroups[metric.query] = [];
        }
        queryGroups[metric.query].push(metric);
      });
      
      // Calculate performance analysis for each query
      const analyses: QueryPerformanceAnalysis[] = [];
      
      Object.entries(queryGroups).forEach(([query, queryMetrics]) => {
        const frequency = queryMetrics.length;
        const avgPrecisionAt5 = this.calculateAverage(queryMetrics.map(m => m.precision_at_k['5'] || 0));
        const avgRecallAt5 = this.calculateAverage(queryMetrics.map(m => m.recall_at_k['5'] || 0));
        const avgMRR = this.calculateAverage(queryMetrics.map(m => m.mean_reciprocal_rank || 0));
        const avgResponseTime = this.calculateAverage(queryMetrics.map(m => m.response_time_ms || 0));
        
        // Calculate success rate (queries with P@5 > 0.5)
        const successfulQueries = queryMetrics.filter(m => (m.precision_at_k['5'] || 0) > 0.5).length;
        const successRate = frequency > 0 ? successfulQueries / frequency : 0;
        
        analyses.push({
          query,
          frequency,
          avg_precision_at_5: avgPrecisionAt5,
          avg_recall_at_5: avgRecallAt5,
          avg_mrr: avgMRR,
          avg_response_time_ms: avgResponseTime,
          success_rate: successRate,
          last_analyzed: new Date()
        });
      });
      
      // Sort by frequency (most common queries first)
      analyses.sort((a, b) => b.frequency - a.frequency);
      
      return analyses;
      
    } catch (error) {
      console.error('Error analyzing query performance:', error);
      throw error;
    }
  }

  /**
   * Add relevance judgment for a query-result pair
   */
  async addRelevanceJudgment(
    query: string,
    resultId: string,
    relevanceScore: number,
    judgedBy?: string
  ): Promise<void> {
    try {
      const judgment: RelevanceJudgment = {
        query: query.toLowerCase().trim(),
        result_id: resultId,
        relevance_score: Math.max(0, Math.min(4, relevanceScore)), // Clamp to 0-4 range
        judged_by: judgedBy,
        judged_at: new Date()
      };
      
      const { error } = await supabase
        .from('relevance_judgments')
        .upsert(judgment, {
          onConflict: 'query,result_id'
        });
      
      if (error) {
        throw new Error(`Failed to store relevance judgment: ${error.message}`);
      }
      
      console.log(`✅ Added relevance judgment: "${query}" -> ${resultId} (score: ${relevanceScore})`);
      
    } catch (error) {
      console.error('Error adding relevance judgment:', error);
      throw error;
    }
  }

  /**
   * Get relevance judgments for a query
   */
  private async getRelevanceJudgments(query: string): Promise<RelevanceJudgment[]> {
    try {
      const { data: judgments, error } = await supabase
        .from('relevance_judgments')
        .select('*')
        .eq('query', query.toLowerCase().trim());
      
      if (error) {
        console.warn(`Failed to fetch relevance judgments for "${query}": ${error.message}`);
        return [];
      }
      
      return judgments || [];
      
    } catch (error) {
      console.warn(`Error fetching relevance judgments for "${query}":`, error);
      return [];
    }
  }

  /**
   * Store retrieval metrics in database
   */
  private async storeRetrievalMetrics(metrics: RetrievalQualityMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('retrieval_quality_metrics')
        .insert({
          query: metrics.query,
          total_results: metrics.total_results,
          precision_at_k: metrics.precision_at_k,
          recall_at_k: metrics.recall_at_k,
          mean_reciprocal_rank: metrics.mean_reciprocal_rank,
          average_precision: metrics.average_precision,
          ndcg_at_k: metrics.ndcg_at_k,
          response_time_ms: metrics.response_time_ms,
          session_id: metrics.session_id,
          timestamp: metrics.timestamp.toISOString()
        });
      
      if (error) {
        console.warn(`Failed to store retrieval metrics: ${error.message}`);
      }
      
    } catch (error) {
      console.warn('Error storing retrieval metrics:', error);
    }
  }

  /**
   * Calculate average of an array of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return sum / numbers.length;
  }

  /**
   * Evaluate search results against ground truth
   */
  async evaluateSearchResults(
    query: string,
    results: SearchResult[],
    groundTruthRelevant: string[],
    sessionId: string,
    responseTimeMs: number
  ): Promise<RetrievalQualityMetrics> {
    try {
      // Create synthetic relevance judgments from ground truth
      const syntheticJudgments: RelevanceJudgment[] = results.map(result => ({
        query: query.toLowerCase().trim(),
        result_id: result.id,
        relevance_score: groundTruthRelevant.includes(result.id) ? 4 : 0,
        judged_by: 'ground_truth',
        judged_at: new Date()
      }));
      
      // Calculate metrics using synthetic judgments
      const precisionAtK: Record<number, number> = {};
      const recallAtK: Record<number, number> = {};
      const ndcgAtK: Record<number, number> = {};
      
      this.kValues.forEach(k => {
        precisionAtK[k] = this.calculatePrecisionAtK(results, syntheticJudgments, k);
        recallAtK[k] = this.calculateRecallAtK(results, syntheticJudgments, k);
        ndcgAtK[k] = this.calculateNDCGAtK(results, syntheticJudgments, k);
      });
      
      const mrr = this.calculateMRR(results, syntheticJudgments);
      const averagePrecision = this.calculateAveragePrecision(results, syntheticJudgments);
      
      return {
        query,
        total_results: results.length,
        precision_at_k: precisionAtK,
        recall_at_k: recallAtK,
        mean_reciprocal_rank: mrr,
        average_precision: averagePrecision,
        ndcg_at_k: ndcgAtK,
        response_time_ms: responseTimeMs,
        session_id: sessionId,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Error evaluating search results:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const retrievalQualityAnalyzer = RetrievalQualityAnalyzer.getInstance();