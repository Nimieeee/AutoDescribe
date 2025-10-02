import { Request, Response, NextFunction } from 'express';
import { kpiEventCollector } from '../lib/kpi-event-collector';
import * as crypto from 'crypto';

// Extend Express Request to include KPI tracking data
declare global {
  namespace Express {
    interface Request {
      kpiSession?: {
        sessionId: string;
        startTime: number;
        userId?: string;
      };
    }
  }
}

/**
 * Session tracking middleware - generates session IDs for user journey mapping
 */
export function sessionTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate or extract session ID
  const sessionId = req.headers['x-session-id'] as string || 
                   req.cookies?.sessionId || 
                   kpiEventCollector.generateSessionId();
  
  // Extract user ID if available (from auth headers, etc.)
  const userId = req.headers['x-user-id'] as string || undefined;
  
  // Store session info in request
  req.kpiSession = {
    sessionId,
    startTime: Date.now(),
    userId
  };
  
  // Set session cookie if not present
  if (!req.cookies?.sessionId) {
    res.cookie('sessionId', sessionId, { 
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
  }
  
  next();
}

/**
 * Search API tracking middleware
 */
export function searchTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Override res.json to capture response data
  const originalJson = res.json;
  res.json = function(data: any) {
    const responseTime = Date.now() - startTime;
    
    // Collect search event asynchronously
    if (req.kpiSession && data.success) {
      setImmediate(async () => {
        try {
          const query = req.query.q as string || '';
          const resultsCount = data.count || 0;
          const searchType = req.query.advanced === 'true' ? 'advanced' : 'basic';
          
          await kpiEventCollector.collectSearchEvent(
            query,
            resultsCount,
            responseTime,
            req.kpiSession!.sessionId,
            searchType,
            req.kpiSession!.userId
          );
        } catch (error) {
          console.error('Error tracking search event:', error);
        }
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}

/**
 * Content generation tracking middleware
 */
export function generationTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Override res.json to capture response data
  const originalJson = res.json;
  res.json = function(data: any) {
    const responseTime = Date.now() - startTime;
    
    // Collect generation event asynchronously
    if (req.kpiSession && data.success) {
      setImmediate(async () => {
        try {
          const sku = req.body.sku || '';
          const contentType = req.body.content_type || 'description';
          const qualityScore = data.ai_metadata?.quality_score || 0.7; // Default if not available
          const aiModel = data.ai_metadata?.model || 'unknown';
          const tokenUsage = data.ai_metadata?.tokens_used ? {
            prompt: data.ai_metadata.tokens_used.prompt || 0,
            completion: data.ai_metadata.tokens_used.completion || 0
          } : undefined;
          
          await kpiEventCollector.collectGenerationEvent(
            sku,
            contentType,
            qualityScore,
            responseTime,
            aiModel,
            req.kpiSession!.sessionId,
            req.kpiSession!.userId,
            tokenUsage
          );
        } catch (error) {
          console.error('Error tracking generation event:', error);
        }
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}

/**
 * System performance tracking middleware
 */
export function performanceTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Track response time
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Collect performance metrics asynchronously
    setImmediate(async () => {
      try {
        const sessionId = req.kpiSession?.sessionId || 'system';
        
        await kpiEventCollector.collectSystemPerformanceEvent(
          'api_response_time',
          responseTime,
          'milliseconds',
          sessionId,
          `${req.method} ${req.path}`
        );
        
        // Track error rates
        if (res.statusCode >= 400) {
          await kpiEventCollector.collectSystemPerformanceEvent(
            'api_error_rate',
            1,
            'count',
            sessionId,
            `${req.method} ${req.path}`
          );
        }
      } catch (error) {
        console.error('Error tracking performance event:', error);
      }
    });
  });
  
  next();
}

/**
 * Dashboard interaction tracking middleware
 */
export function dashboardTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Track dashboard page visits and interactions
  if (req.path.startsWith('/api/') && req.kpiSession) {
    setImmediate(async () => {
      try {
        let action = 'api_call';
        let element = req.path;
        let page = 'api';
        
        // Determine page and action based on endpoint
        if (req.path.includes('/kpis')) {
          page = 'kpi_dashboard';
          action = 'view_kpis';
          element = 'kpi_endpoint';
        } else if (req.path.includes('/generate')) {
          page = 'generation_dashboard';
          action = 'generate_content';
          element = 'generate_button';
        } else if (req.path.includes('/search')) {
          page = 'search_dashboard';
          action = 'search_products';
          element = 'search_input';
        }
        
        await kpiEventCollector.collectUserInteractionEvent(
          action,
          element,
          page,
          req.kpiSession!.sessionId,
          req.kpiSession!.userId
        );
      } catch (error) {
        console.error('Error tracking dashboard interaction:', error);
      }
    });
  }
  
  next();
}

/**
 * Error tracking middleware
 */
export function errorTrackingMiddleware(error: any, req: Request, res: Response, next: NextFunction) {
  // Track errors as system performance events
  if (req.kpiSession) {
    setImmediate(async () => {
      try {
        await kpiEventCollector.collectSystemPerformanceEvent(
          'system_error',
          1,
          'count',
          req.kpiSession!.sessionId,
          `${req.method} ${req.path}`
        );
      } catch (trackingError) {
        console.error('Error tracking error event:', trackingError);
      }
    });
  }
  
  next(error);
}

/**
 * Data quality monitoring middleware - tracks data completeness
 */
export function dataQualityTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Override res.json to analyze response data quality
  const originalJson = res.json;
  res.json = function(data: any) {
    // Analyze data quality asynchronously
    if (data.success && data.products) {
      setImmediate(async () => {
        try {
          const products = data.products;
          const totalProducts = products.length;
          
          // Calculate completeness
          const completeProducts = products.filter((p: any) => 
            p.sku && p.name && p.brand && p.category
          ).length;
          
          // Calculate normalization (simplified check)
          const normalizedProducts = products.filter((p: any) => 
            p.price && typeof p.price === 'number'
          ).length;
          
          const qualityScore = totalProducts > 0 ? 
            ((completeProducts + normalizedProducts) / (totalProducts * 2)) * 100 : 0;
          
          const sessionId = req.kpiSession?.sessionId || 'system';
          
          await kpiEventCollector.collectDataQualityEvent(
            totalProducts,
            completeProducts,
            normalizedProducts,
            qualityScore,
            sessionId
          );
        } catch (error) {
          console.error('Error tracking data quality:', error);
        }
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}

/**
 * Batch middleware application helper
 */
export function applyKPIMiddleware(app: any) {
  // Apply session tracking to all routes
  app.use(sessionTrackingMiddleware);
  
  // Apply performance tracking to all routes
  app.use(performanceTrackingMiddleware);
  
  // Apply dashboard interaction tracking
  app.use(dashboardTrackingMiddleware);
  
  // Apply error tracking
  app.use(errorTrackingMiddleware);
}

/**
 * Route-specific middleware application helper
 */
export function applyRouteSpecificKPIMiddleware(app: any) {
  // Search endpoints
  app.use('/api/search-products', searchTrackingMiddleware, dataQualityTrackingMiddleware);
  app.use('/api/search-category', searchTrackingMiddleware, dataQualityTrackingMiddleware);
  app.use('/api/search-brand', searchTrackingMiddleware, dataQualityTrackingMiddleware);
  
  // Content generation endpoints
  app.use('/api/generate-with-rag', generationTrackingMiddleware);
  
  // Product endpoints
  app.use('/api/product/:sku', dataQualityTrackingMiddleware);
  app.use('/api/examples', dataQualityTrackingMiddleware);
}