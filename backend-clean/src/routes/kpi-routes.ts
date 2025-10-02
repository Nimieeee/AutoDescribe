import express from 'express';
import { dataQualityAnalyzer } from '../lib/data-quality-analyzer';
import { retrievalQualityAnalyzer } from '../lib/retrieval-quality-analyzer';
import { userExperienceAnalyzer } from '../lib/user-experience-analyzer';
import { systemPerformanceMonitor } from '../lib/system-performance-monitor';
import { eventProcessingPipeline } from '../lib/event-processing-pipeline';
import { kpiEventCollector } from '../lib/kpi-event-collector';

// Extend Request interface to include startTime
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

const router = express.Router();

// Middleware for request timing
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Middleware for response timing and logging
router.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - (req as any).startTime;
    
    // Record API performance metrics
    systemPerformanceMonitor.recordAPIPerformance(
      req.path,
      req.method,
      responseTime,
      res.statusCode,
      req.headers['x-session-id'] as string,
      res.statusCode >= 400 ? 'API Error' : undefined
    );
    
    return originalSend.call(this, data);
  };
  next();
});

// ============================================================================
// DATA QUALITY KPI ENDPOINTS
// ============================================================================

/**
 * GET /api/kpi/data-quality/completeness
 * Get product data completeness metrics
 */
router.get('/data-quality/completeness', async (req, res) => {
  try {
    const completenessResult = await dataQualityAnalyzer.analyzeProductCompleteness();
    
    res.json({
      success: true,
      data: completenessResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching completeness metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch completeness metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/kpi/data-quality/normalization
 * Get data normalization metrics
 */
router.get('/data-quality/normalization', async (req, res) => {
  try {
    const normalizationResult = await dataQualityAnalyzer.analyzeDataNormalization();
    
    res.json({
      success: true,
      data: normalizationResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching normalization metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch normalization metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/kpi/data-quality/attribute-consistency/:field
 * Get attribute consistency for a specific field
 */
router.get('/data-quality/attribute-consistency/:field', async (req, res) => {
  try {
    const { field } = req.params;
    const consistencyResult = await dataQualityAnalyzer.analyzeAttributeConsistency(field);
    
    res.json({
      success: true,
      data: consistencyResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching attribute consistency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attribute consistency',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/kpi/data-quality/report
 * Get comprehensive data quality report
 */
router.get('/data-quality/report', async (req, res) => {
  try {
    const report = await dataQualityAnalyzer.getDataQualityReport();
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating data quality report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate data quality report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// RETRIEVAL QUALITY KPI ENDPOINTS
// ============================================================================

/**
 * GET /api/kpi/retrieval/query-performance
 * Get query performance analysis
 */
router.get('/retrieval/query-performance', async (req, res) => {
  try {
    const timeRangeHours = parseInt(req.query.hours as string) || 24;
    const performance = await retrievalQualityAnalyzer.getQueryPerformanceAnalysis(timeRangeHours);
    
    res.json({
      success: true,
      data: performance,
      metadata: {
        time_range_hours: timeRangeHours,
        total_queries: performance.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching query performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch query performance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/kpi/retrieval/relevance-judgment
 * Add relevance judgment for query-result pair
 */
router.post('/retrieval/relevance-judgment', async (req, res) => {
  try {
    const { query, result_id, relevance_score, judged_by } = req.body;
    
    if (!query || !result_id || relevance_score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: query, result_id, relevance_score'
      });
    }
    
    await retrievalQualityAnalyzer.addRelevanceJudgment(
      query,
      result_id,
      relevance_score,
      judged_by
    );
    
    res.json({
      success: true,
      message: 'Relevance judgment added successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error adding relevance judgment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add relevance judgment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/kpi/retrieval/evaluate-search
 * Evaluate search results against ground truth
 */
router.post('/retrieval/evaluate-search', async (req, res) => {
  try {
    const { query, results, ground_truth_relevant, session_id, response_time_ms } = req.body;
    
    if (!query || !results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: query, results (array)'
      });
    }
    
    const metrics = await retrievalQualityAnalyzer.evaluateSearchResults(
      query,
      results,
      ground_truth_relevant || [],
      session_id || kpiEventCollector.generateSessionId(),
      response_time_ms || 0
    );
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error evaluating search results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate search results',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// SYSTEM PERFORMANCE KPI ENDPOINTS
// ============================================================================

/**
 * GET /api/kpi/system/health
 * Get current system health status
 */
router.get('/system/health', async (req, res) => {
  try {
    const healthStatus = await systemPerformanceMonitor.getSystemHealthStatus();
    
    res.json({
      success: true,
      data: healthStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system health',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/kpi/system/metrics
 * Get system performance metrics for a time range
 */
router.get('/system/metrics', async (req, res) => {
  try {
    const startTime = req.query.start_time ? new Date(req.query.start_time as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endTime = req.query.end_time ? new Date(req.query.end_time as string) : new Date();
    const metricType = (req.query.type as 'system' | 'api' | 'database') || 'system';
    
    const metrics = await systemPerformanceMonitor.getPerformanceMetrics(startTime, endTime, metricType);
    
    res.json({
      success: true,
      data: metrics,
      metadata: {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        metric_type: metricType,
        count: metrics.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/kpi/system/alerts
 * Get active performance alerts
 */
router.get('/system/alerts', async (req, res) => {
  try {
    const alerts = systemPerformanceMonitor.getActiveAlerts();
    
    res.json({
      success: true,
      data: alerts,
      metadata: {
        active_count: alerts.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/kpi/system/collect-metrics
 * Manually trigger system metrics collection
 */
router.post('/system/collect-metrics', async (req, res) => {
  try {
    const metrics = await systemPerformanceMonitor.collectSystemMetrics();
    
    res.json({
      success: true,
      data: metrics,
      message: 'System metrics collected successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error collecting system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect system metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// USER EXPERIENCE KPI ENDPOINTS
// ============================================================================

/**
 * GET /api/kpi/user-experience/search-success-rate
 * Get search success rate report
 */
router.get('/user-experience/search-success-rate', async (req, res) => {
  try {
    const timeRangeHours = parseInt(req.query.hours as string) || 24;
    const report = await userExperienceAnalyzer.generateSearchSuccessRateReport(timeRangeHours);
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching search success rate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search success rate',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/kpi/user-experience/click-through-rate
 * Get click-through rate metrics
 */
router.get('/user-experience/click-through-rate', async (req, res) => {
  try {
    const timeRangeHours = parseInt(req.query.hours as string) || 24;
    const ctrMetrics = await userExperienceAnalyzer.calculateClickThroughRate(timeRangeHours);
    
    res.json({
      success: true,
      data: ctrMetrics,
      metadata: {
        time_range_hours: timeRangeHours,
        queries_analyzed: ctrMetrics.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching click-through rate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch click-through rate',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/kpi/user-experience/satisfaction
 * Record user satisfaction score
 */
router.post('/user-experience/satisfaction', async (req, res) => {
  try {
    const { session_id, satisfaction_rating, task_type, user_id, feedback_text, completion_rate } = req.body;
    
    if (!session_id || satisfaction_rating === undefined || !task_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: session_id, satisfaction_rating, task_type'
      });
    }
    
    await userExperienceAnalyzer.recordUserSatisfaction(
      session_id,
      satisfaction_rating,
      task_type,
      user_id,
      feedback_text,
      completion_rate
    );
    
    res.json({
      success: true,
      message: 'User satisfaction recorded successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error recording user satisfaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record user satisfaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/kpi/user-experience/query-refinement-patterns/:sessionId
 * Get query refinement patterns for a session
 */
router.get('/user-experience/query-refinement-patterns/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const patterns = await userExperienceAnalyzer.analyzeQueryRefinementPatterns(sessionId);
    
    res.json({
      success: true,
      data: patterns,
      metadata: {
        session_id: sessionId,
        pattern_count: patterns.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching query refinement patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch query refinement patterns',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// REAL-TIME ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/kpi/real-time/metrics
 * Get real-time metrics
 */
router.get('/real-time/metrics', async (req, res) => {
  try {
    const metrics = eventProcessingPipeline.getRealTimeMetrics();
    
    res.json({
      success: true,
      data: metrics,
      metadata: {
        metric_count: metrics.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/kpi/real-time/processing-stats
 * Get event processing pipeline statistics
 */
router.get('/real-time/processing-stats', async (req, res) => {
  try {
    const stats = eventProcessingPipeline.getProcessingStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching processing stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch processing stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// EVENT COLLECTION ENDPOINTS
// ============================================================================

/**
 * POST /api/kpi/events/search
 * Record a search event
 */
router.post('/events/search', async (req, res) => {
  try {
    const { query, results_count, response_time_ms, session_id, search_type, user_id } = req.body;
    
    if (!query || results_count === undefined || !response_time_ms || !session_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: query, results_count, response_time_ms, session_id'
      });
    }
    
    await kpiEventCollector.collectSearchEvent(
      query,
      results_count,
      response_time_ms,
      session_id,
      search_type || 'basic',
      user_id
    );
    
    res.json({
      success: true,
      message: 'Search event recorded successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error recording search event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record search event',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/kpi/events/generation
 * Record a content generation event
 */
router.post('/events/generation', async (req, res) => {
  try {
    const { sku, content_type, quality_score, generation_time_ms, ai_model, session_id, user_id, token_usage } = req.body;
    
    if (!sku || !content_type || quality_score === undefined || !generation_time_ms || !ai_model || !session_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sku, content_type, quality_score, generation_time_ms, ai_model, session_id'
      });
    }
    
    await kpiEventCollector.collectGenerationEvent(
      sku,
      content_type,
      quality_score,
      generation_time_ms,
      ai_model,
      session_id,
      user_id,
      token_usage
    );
    
    res.json({
      success: true,
      message: 'Generation event recorded successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error recording generation event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record generation event',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/kpi/events/user-interaction
 * Record a user interaction event
 */
router.post('/events/user-interaction', async (req, res) => {
  try {
    const { action, element, page, session_id, user_id, time_on_page_ms } = req.body;
    
    if (!action || !element || !page || !session_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: action, element, page, session_id'
      });
    }
    
    await kpiEventCollector.collectUserInteractionEvent(
      action,
      element,
      page,
      session_id,
      user_id,
      time_on_page_ms
    );
    
    res.json({
      success: true,
      message: 'User interaction event recorded successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error recording user interaction event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record user interaction event',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/kpi/events/session/:sessionId
 * Get all events for a session
 */
router.get('/events/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // This would typically query the events from the database
    // For now, return a placeholder response
    res.json({
      success: true,
      data: [],
      metadata: {
        session_id: sessionId,
        event_count: 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching session events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session events',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

/**
 * GET /api/kpi/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'KPI Tracking System',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/kpi/session/generate
 * Generate a new session ID
 */
router.get('/session/generate', (req, res) => {
  try {
    const sessionId = kpiEventCollector.generateSessionId();
    
    res.json({
      success: true,
      data: {
        session_id: sessionId
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating session ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate session ID',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;