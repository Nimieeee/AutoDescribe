import { supabase } from './supabase';
import { kpiEventCollector } from './kpi-event-collector';

// User experience analysis interfaces
export interface SearchSuccessMetrics {
  query: string;
  session_id: string;
  total_results: number;
  clicked_results: number;
  time_to_first_click_ms?: number;
  query_refinements: number;
  success_indicators: {
    has_results: boolean;
    has_clicks: boolean;
    quick_click: boolean; // Click within 10 seconds
    no_refinement: boolean; // No query refinement needed
  };
  success_score: number; // 0-1 scale
  timestamp: Date;
}

export interface UserInteractionMetrics {
  session_id: string;
  page: string;
  action: string;
  element: string;
  timestamp: Date;
  time_on_page_ms?: number;
  click_position?: { x: number; y: number };
  scroll_depth_percent?: number;
}

export interface ClickThroughRateMetrics {
  query: string;
  total_searches: number;
  searches_with_clicks: number;
  total_results_shown: number;
  total_clicks: number;
  ctr_percentage: number;
  avg_click_position: number;
  time_period: string;
  timestamp: Date;
}

export interface QueryRefinementPattern {
  original_query: string;
  refined_query: string;
  refinement_type: 'addition' | 'removal' | 'replacement' | 'spelling';
  time_between_queries_ms: number;
  session_id: string;
  success_after_refinement: boolean;
  timestamp: Date;
}

export interface UserSatisfactionScore {
  session_id: string;
  user_id?: string;
  satisfaction_rating: number; // 1-5 scale
  feedback_text?: string;
  completion_rate: number; // Did user complete their intended task?
  task_type: 'search' | 'generation' | 'review';
  timestamp: Date;
}

export interface SearchSuccessRateReport {
  time_period: string;
  total_searches: number;
  successful_searches: number;
  success_rate_percentage: number;
  avg_time_to_first_click_ms: number;
  avg_query_refinements: number;
  top_successful_queries: Array<{ query: string; success_rate: number; count: number }>;
  top_failed_queries: Array<{ query: string; success_rate: number; count: number }>;
  success_factors: {
    result_count_correlation: number;
    response_time_correlation: number;
    query_length_correlation: number;
  };
}

export class UserExperienceAnalyzer {
  private static instance: UserExperienceAnalyzer;
  
  // Success criteria thresholds
  private readonly successThresholds = {
    maxTimeToFirstClick: 10000, // 10 seconds
    minResultsForSuccess: 1,
    maxRefinementsForSuccess: 1
  };

  private constructor() {}

  static getInstance(): UserExperienceAnalyzer {
    if (!UserExperienceAnalyzer.instance) {
      UserExperienceAnalyzer.instance = new UserExperienceAnalyzer();
    }
    return UserExperienceAnalyzer.instance;
  }

  /**
   * Analyze search success for a specific query session
   */
  async analyzeSearchSuccess(
    query: string,
    sessionId: string,
    searchResults: any[],
    userInteractions: UserInteractionMetrics[]
  ): Promise<SearchSuccessMetrics> {
    try {
      console.log(`🔍 Analyzing search success for query: "${query}" in session: ${sessionId}`);
      
      // Find clicks on search results
      const resultClicks = userInteractions.filter(interaction => 
        interaction.action === 'click' && 
        interaction.element.includes('result')
      );
      
      // Calculate time to first click
      const firstClick = resultClicks.length > 0 ? resultClicks[0] : null;
      const timeToFirstClick = firstClick ? 
        firstClick.timestamp.getTime() - new Date().getTime() : undefined;
      
      // Count query refinements in this session
      const queryRefinements = await this.countQueryRefinements(sessionId, query);
      
      // Calculate success indicators
      const successIndicators = {
        has_results: searchResults.length > 0,
        has_clicks: resultClicks.length > 0,
        quick_click: timeToFirstClick ? timeToFirstClick <= this.successThresholds.maxTimeToFirstClick : false,
        no_refinement: queryRefinements <= this.successThresholds.maxRefinementsForSuccess
      };
      
      // Calculate overall success score (weighted average)
      const weights = { has_results: 0.3, has_clicks: 0.4, quick_click: 0.2, no_refinement: 0.1 };
      const successScore = Object.entries(successIndicators).reduce((score, [key, value]) => {
        return score + (value ? weights[key as keyof typeof weights] : 0);
      }, 0);
      
      const metrics: SearchSuccessMetrics = {
        query,
        session_id: sessionId,
        total_results: searchResults.length,
        clicked_results: resultClicks.length,
        time_to_first_click_ms: timeToFirstClick,
        query_refinements: queryRefinements,
        success_indicators: successIndicators,
        success_score: successScore,
        timestamp: new Date()
      };
      
      // Store metrics
      await this.storeSearchSuccessMetrics(metrics);
      
      // Collect KPI event
      await kpiEventCollector.collectUserInteractionEvent(
        'search_analysis',
        'search_success',
        'search_results',
        sessionId,
        undefined,
        timeToFirstClick
      );
      
      console.log(`📊 Search success analysis complete - Score: ${successScore.toFixed(2)}`);
      return metrics;
      
    } catch (error) {
      console.error('Error analyzing search success:', error);
      throw error;
    }
  }

  /**
   * Calculate click-through rate for queries
   */
  async calculateClickThroughRate(
    timePeriodHours: number = 24
  ): Promise<ClickThroughRateMetrics[]> {
    try {
      console.log(`📊 Calculating click-through rates for last ${timePeriodHours} hours`);
      
      const cutoffTime = new Date(Date.now() - timePeriodHours * 60 * 60 * 1000);
      
      // Get search success metrics from the time period
      const { data: searchMetrics, error } = await supabase
        .from('search_success_metrics')
        .select('*')
        .gte('timestamp', cutoffTime.toISOString())
        .order('timestamp', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to fetch search metrics: ${error.message}`);
      }
      
      if (!searchMetrics || searchMetrics.length === 0) {
        return [];
      }
      
      // Group by query
      const queryGroups: Record<string, any[]> = {};
      searchMetrics.forEach(metric => {
        if (!queryGroups[metric.query]) {
          queryGroups[metric.query] = [];
        }
        queryGroups[metric.query].push(metric);
      });
      
      // Calculate CTR for each query
      const ctrMetrics: ClickThroughRateMetrics[] = [];
      
      Object.entries(queryGroups).forEach(([query, metrics]) => {
        const totalSearches = metrics.length;
        const searchesWithClicks = metrics.filter(m => m.clicked_results > 0).length;
        const totalResultsShown = metrics.reduce((sum, m) => sum + m.total_results, 0);
        const totalClicks = metrics.reduce((sum, m) => sum + m.clicked_results, 0);
        
        const ctrPercentage = totalSearches > 0 ? (searchesWithClicks / totalSearches) * 100 : 0;
        
        // Calculate average click position (1-indexed)
        const clickPositions = metrics
          .filter(m => m.clicked_results > 0)
          .map(m => 1); // Simplified - would need more detailed click tracking
        const avgClickPosition = clickPositions.length > 0 ? 
          clickPositions.reduce((sum, pos) => sum + pos, 0) / clickPositions.length : 0;
        
        ctrMetrics.push({
          query,
          total_searches: totalSearches,
          searches_with_clicks: searchesWithClicks,
          total_results_shown: totalResultsShown,
          total_clicks: totalClicks,
          ctr_percentage: ctrPercentage,
          avg_click_position: avgClickPosition,
          time_period: `${timePeriodHours}h`,
          timestamp: new Date()
        });
      });
      
      // Sort by total searches (most popular first)
      ctrMetrics.sort((a, b) => b.total_searches - a.total_searches);
      
      return ctrMetrics;
      
    } catch (error) {
      console.error('Error calculating click-through rate:', error);
      throw error;
    }
  }

  /**
   * Analyze query refinement patterns
   */
  async analyzeQueryRefinementPatterns(
    sessionId: string
  ): Promise<QueryRefinementPattern[]> {
    try {
      console.log(`🔍 Analyzing query refinement patterns for session: ${sessionId}`);
      
      // Get all search events for this session
      const { data: searchEvents, error } = await supabase
        .from('kpi_events')
        .select('*')
        .eq('session_id', sessionId)
        .eq('type', 'search')
        .order('timestamp', { ascending: true });
      
      if (error) {
        throw new Error(`Failed to fetch search events: ${error.message}`);
      }
      
      if (!searchEvents || searchEvents.length < 2) {
        return []; // Need at least 2 queries to detect refinement
      }
      
      const patterns: QueryRefinementPattern[] = [];
      
      for (let i = 1; i < searchEvents.length; i++) {
        const previousQuery = searchEvents[i - 1].metadata.query;
        const currentQuery = searchEvents[i].metadata.query;
        
        if (previousQuery !== currentQuery) {
          const refinementType = this.detectRefinementType(previousQuery, currentQuery);
          const timeBetween = new Date(searchEvents[i].timestamp).getTime() - 
                             new Date(searchEvents[i - 1].timestamp).getTime();
          
          // Check if refinement led to success (simplified)
          const successAfterRefinement = searchEvents[i].metadata.has_results || false;
          
          patterns.push({
            original_query: previousQuery,
            refined_query: currentQuery,
            refinement_type: refinementType,
            time_between_queries_ms: timeBetween,
            session_id: sessionId,
            success_after_refinement: successAfterRefinement,
            timestamp: new Date(searchEvents[i].timestamp)
          });
        }
      }
      
      // Store patterns
      for (const pattern of patterns) {
        await this.storeQueryRefinementPattern(pattern);
      }
      
      return patterns;
      
    } catch (error) {
      console.error('Error analyzing query refinement patterns:', error);
      throw error;
    }
  }

  /**
   * Generate search success rate report
   */
  async generateSearchSuccessRateReport(
    timePeriodHours: number = 24
  ): Promise<SearchSuccessRateReport> {
    try {
      console.log(`📋 Generating search success rate report for last ${timePeriodHours} hours`);
      
      const cutoffTime = new Date(Date.now() - timePeriodHours * 60 * 60 * 1000);
      
      const { data: searchMetrics, error } = await supabase
        .from('search_success_metrics')
        .select('*')
        .gte('timestamp', cutoffTime.toISOString());
      
      if (error) {
        throw new Error(`Failed to fetch search metrics: ${error.message}`);
      }
      
      if (!searchMetrics || searchMetrics.length === 0) {
        return {
          time_period: `${timePeriodHours}h`,
          total_searches: 0,
          successful_searches: 0,
          success_rate_percentage: 0,
          avg_time_to_first_click_ms: 0,
          avg_query_refinements: 0,
          top_successful_queries: [],
          top_failed_queries: [],
          success_factors: {
            result_count_correlation: 0,
            response_time_correlation: 0,
            query_length_correlation: 0
          }
        };
      }
      
      const totalSearches = searchMetrics.length;
      const successfulSearches = searchMetrics.filter(m => m.success_score >= 0.6).length;
      const successRate = (successfulSearches / totalSearches) * 100;
      
      // Calculate averages
      const avgTimeToFirstClick = this.calculateAverage(
        searchMetrics
          .filter(m => m.time_to_first_click_ms)
          .map(m => m.time_to_first_click_ms)
      );
      
      const avgQueryRefinements = this.calculateAverage(
        searchMetrics.map(m => m.query_refinements)
      );
      
      // Analyze queries by success rate
      const queryAnalysis = this.analyzeQueriesBySuccess(searchMetrics);
      
      // Calculate success factor correlations
      const successFactors = this.calculateSuccessFactorCorrelations(searchMetrics);
      
      return {
        time_period: `${timePeriodHours}h`,
        total_searches: totalSearches,
        successful_searches: successfulSearches,
        success_rate_percentage: successRate,
        avg_time_to_first_click_ms: avgTimeToFirstClick,
        avg_query_refinements: avgQueryRefinements,
        top_successful_queries: queryAnalysis.successful.slice(0, 10),
        top_failed_queries: queryAnalysis.failed.slice(0, 10),
        success_factors: successFactors
      };
      
    } catch (error) {
      console.error('Error generating search success rate report:', error);
      throw error;
    }
  }

  /**
   * Record user satisfaction score
   */
  async recordUserSatisfaction(
    sessionId: string,
    satisfactionRating: number,
    taskType: 'search' | 'generation' | 'review',
    userId?: string,
    feedbackText?: string,
    completionRate: number = 1.0
  ): Promise<void> {
    try {
      const satisfaction: UserSatisfactionScore = {
        session_id: sessionId,
        user_id: userId,
        satisfaction_rating: Math.max(1, Math.min(5, satisfactionRating)), // Clamp to 1-5
        feedback_text: feedbackText,
        completion_rate: Math.max(0, Math.min(1, completionRate)), // Clamp to 0-1
        task_type: taskType,
        timestamp: new Date()
      };
      
      await this.storeUserSatisfaction(satisfaction);
      
      // Collect KPI event
      await kpiEventCollector.collectUserInteractionEvent(
        'satisfaction_rating',
        'feedback',
        'satisfaction_form',
        sessionId,
        userId
      );
      
      console.log(`📝 User satisfaction recorded: ${satisfactionRating}/5 for ${taskType} task`);
      
    } catch (error) {
      console.error('Error recording user satisfaction:', error);
      throw error;
    }
  }

  /**
   * Count query refinements in a session
   */
  private async countQueryRefinements(sessionId: string, currentQuery: string): Promise<number> {
    try {
      const { data: searchEvents, error } = await supabase
        .from('kpi_events')
        .select('metadata')
        .eq('session_id', sessionId)
        .eq('type', 'search')
        .order('timestamp', { ascending: true });
      
      if (error || !searchEvents) {
        return 0;
      }
      
      // Count unique queries before the current one
      const queries = searchEvents.map(event => event.metadata.query);
      const uniqueQueries = new Set(queries);
      
      // Subtract 1 for the original query
      return Math.max(0, uniqueQueries.size - 1);
      
    } catch (error) {
      console.warn('Error counting query refinements:', error);
      return 0;
    }
  }

  /**
   * Detect type of query refinement
   */
  private detectRefinementType(
    originalQuery: string, 
    refinedQuery: string
  ): 'addition' | 'removal' | 'replacement' | 'spelling' {
    const original = originalQuery.toLowerCase().trim();
    const refined = refinedQuery.toLowerCase().trim();
    
    // Check for spelling correction (Levenshtein distance)
    if (this.calculateLevenshteinDistance(original, refined) <= 2 && 
        Math.abs(original.length - refined.length) <= 2) {
      return 'spelling';
    }
    
    // Check for addition (refined contains all words from original plus more)
    const originalWords = new Set(original.split(/\s+/));
    const refinedWords = new Set(refined.split(/\s+/));
    
    if (this.isSubset(originalWords, refinedWords) && refinedWords.size > originalWords.size) {
      return 'addition';
    }
    
    // Check for removal (original contains all words from refined plus more)
    if (this.isSubset(refinedWords, originalWords) && originalWords.size > refinedWords.size) {
      return 'removal';
    }
    
    // Default to replacement
    return 'replacement';
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Check if set A is a subset of set B
   */
  private isSubset<T>(setA: Set<T>, setB: Set<T>): boolean {
    for (const elem of setA) {
      if (!setB.has(elem)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Analyze queries by success rate
   */
  private analyzeQueriesBySuccess(metrics: any[]): {
    successful: Array<{ query: string; success_rate: number; count: number }>;
    failed: Array<{ query: string; success_rate: number; count: number }>;
  } {
    const queryGroups: Record<string, any[]> = {};
    
    metrics.forEach(metric => {
      if (!queryGroups[metric.query]) {
        queryGroups[metric.query] = [];
      }
      queryGroups[metric.query].push(metric);
    });
    
    const queryStats = Object.entries(queryGroups).map(([query, queryMetrics]) => {
      const successfulCount = queryMetrics.filter(m => m.success_score >= 0.6).length;
      const successRate = (successfulCount / queryMetrics.length) * 100;
      
      return {
        query,
        success_rate: successRate,
        count: queryMetrics.length
      };
    });
    
    // Filter and sort
    const successful = queryStats
      .filter(q => q.success_rate >= 60 && q.count >= 3)
      .sort((a, b) => b.success_rate - a.success_rate);
    
    const failed = queryStats
      .filter(q => q.success_rate < 40 && q.count >= 3)
      .sort((a, b) => a.success_rate - b.success_rate);
    
    return { successful, failed };
  }

  /**
   * Calculate correlations between success factors
   */
  private calculateSuccessFactorCorrelations(metrics: any[]): {
    result_count_correlation: number;
    response_time_correlation: number;
    query_length_correlation: number;
  } {
    // Simplified correlation calculation
    // In a real implementation, you'd use proper statistical correlation
    
    const successScores = metrics.map(m => m.success_score);
    const resultCounts = metrics.map(m => m.total_results);
    const queryLengths = metrics.map(m => m.query.length);
    
    return {
      result_count_correlation: this.calculateSimpleCorrelation(successScores, resultCounts),
      response_time_correlation: 0, // Would need response time data
      query_length_correlation: this.calculateSimpleCorrelation(successScores, queryLengths)
    };
  }

  /**
   * Calculate simple correlation coefficient
   */
  private calculateSimpleCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate average of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Store search success metrics in database
   */
  private async storeSearchSuccessMetrics(metrics: SearchSuccessMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('search_success_metrics')
        .insert({
          query: metrics.query,
          session_id: metrics.session_id,
          total_results: metrics.total_results,
          clicked_results: metrics.clicked_results,
          time_to_first_click_ms: metrics.time_to_first_click_ms,
          query_refinements: metrics.query_refinements,
          success_indicators: metrics.success_indicators,
          success_score: metrics.success_score,
          timestamp: metrics.timestamp.toISOString()
        });
      
      if (error) {
        console.warn('Failed to store search success metrics:', error.message);
      }
    } catch (error) {
      console.warn('Error storing search success metrics:', error);
    }
  }

  /**
   * Store query refinement pattern in database
   */
  private async storeQueryRefinementPattern(pattern: QueryRefinementPattern): Promise<void> {
    try {
      const { error } = await supabase
        .from('query_refinement_patterns')
        .insert({
          original_query: pattern.original_query,
          refined_query: pattern.refined_query,
          refinement_type: pattern.refinement_type,
          time_between_queries_ms: pattern.time_between_queries_ms,
          session_id: pattern.session_id,
          success_after_refinement: pattern.success_after_refinement,
          timestamp: pattern.timestamp.toISOString()
        });
      
      if (error) {
        console.warn('Failed to store query refinement pattern:', error.message);
      }
    } catch (error) {
      console.warn('Error storing query refinement pattern:', error);
    }
  }

  /**
   * Store user satisfaction in database
   */
  private async storeUserSatisfaction(satisfaction: UserSatisfactionScore): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_satisfaction_scores')
        .insert({
          session_id: satisfaction.session_id,
          user_id: satisfaction.user_id,
          satisfaction_rating: satisfaction.satisfaction_rating,
          feedback_text: satisfaction.feedback_text,
          completion_rate: satisfaction.completion_rate,
          task_type: satisfaction.task_type,
          timestamp: satisfaction.timestamp.toISOString()
        });
      
      if (error) {
        console.warn('Failed to store user satisfaction:', error.message);
      }
    } catch (error) {
      console.warn('Error storing user satisfaction:', error);
    }
  }
}

// Export singleton instance
export const userExperienceAnalyzer = UserExperienceAnalyzer.getInstance();