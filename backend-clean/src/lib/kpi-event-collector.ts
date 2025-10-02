import { supabase } from './supabase';
import * as crypto from 'crypto';

// Core KPI Event Types
export interface KPIEvent {
  id?: string;
  type: 'search' | 'generation' | 'review' | 'data_quality' | 'system_performance' | 'user_interaction';
  timestamp: Date;
  session_id: string;
  user_id?: string;
  source: 'api' | 'dashboard' | 'system' | 'external';
  metadata: Record<string, any>;
}

// Standardized event schemas for validation
export interface SearchEvent extends KPIEvent {
  type: 'search';
  metadata: {
    query: string;
    results_count: number;
    response_time_ms: number;
    has_results: boolean;
    search_type?: 'basic' | 'advanced';
    filters_applied?: Record<string, any>;
  };
}

export interface GenerationEvent extends KPIEvent {
  type: 'generation';
  metadata: {
    sku: string;
    content_type: string;
    quality_score: number;
    generation_time_ms: number;
    ai_model: string;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

export interface ReviewEvent extends KPIEvent {
  type: 'review';
  metadata: {
    content_id: string;
    action: 'approve' | 'reject' | 'edit';
    review_time_ms?: number;
    changes_made?: boolean;
    quality_rating?: number;
  };
}

export interface DataQualityEvent extends KPIEvent {
  type: 'data_quality';
  metadata: {
    total_products: number;
    complete_products: number;
    normalized_products: number;
    quality_score: number;
    issues_found?: string[];
  };
}

export interface SystemPerformanceEvent extends KPIEvent {
  type: 'system_performance';
  metadata: {
    metric_name: string;
    metric_value: number;
    metric_unit: string;
    threshold_breached?: boolean;
    system_component?: string;
  };
}

export interface UserInteractionEvent extends KPIEvent {
  type: 'user_interaction';
  metadata: {
    action: string;
    element: string;
    page: string;
    time_on_page_ms?: number;
    click_position?: { x: number; y: number };
  };
}

export class KPIEventCollector {
  private static instance: KPIEventCollector;
  private eventQueue: KPIEvent[] = [];
  private batchSize = 50;
  private flushInterval = 10000; // 10 seconds
  private isProcessing = false;

  private constructor() {
    // Start periodic flush
    setInterval(() => this.flushEvents(), this.flushInterval);
    
    // Flush on process exit
    process.on('SIGINT', () => this.flushEvents());
    process.on('SIGTERM', () => this.flushEvents());
  }

  static getInstance(): KPIEventCollector {
    if (!KPIEventCollector.instance) {
      KPIEventCollector.instance = new KPIEventCollector();
    }
    return KPIEventCollector.instance;
  }

  /**
   * Collect a KPI event with validation and PII anonymization
   */
  async collectEvent(event: KPIEvent): Promise<void> {
    try {
      // Validate event structure
      const validatedEvent = this.validateEvent(event);
      
      // Anonymize PII
      const anonymizedEvent = this.anonymizePII(validatedEvent);
      
      // Add to queue
      this.eventQueue.push(anonymizedEvent);
      
      // Flush if batch is full
      if (this.eventQueue.length >= this.batchSize) {
        await this.flushEvents();
      }
      
      console.log(`📊 KPI Event collected: ${event.type} (queue: ${this.eventQueue.length})`);
    } catch (error) {
      console.error('Error collecting KPI event:', error);
      // Don't throw - KPI collection should not break main functionality
    }
  }

  /**
   * Collect search event
   */
  async collectSearchEvent(
    query: string,
    resultsCount: number,
    responseTimeMs: number,
    sessionId: string,
    searchType: 'basic' | 'advanced' = 'basic',
    userId?: string
  ): Promise<void> {
    const event: SearchEvent = {
      type: 'search',
      timestamp: new Date(),
      session_id: sessionId,
      user_id: userId,
      source: 'api',
      metadata: {
        query,
        results_count: resultsCount,
        response_time_ms: responseTimeMs,
        has_results: resultsCount > 0,
        search_type: searchType
      }
    };
    
    await this.collectEvent(event);
  }

  /**
   * Collect content generation event
   */
  async collectGenerationEvent(
    sku: string,
    contentType: string,
    qualityScore: number,
    generationTimeMs: number,
    aiModel: string,
    sessionId: string,
    userId?: string,
    tokenUsage?: { prompt: number; completion: number }
  ): Promise<void> {
    const event: GenerationEvent = {
      type: 'generation',
      timestamp: new Date(),
      session_id: sessionId,
      user_id: userId,
      source: 'api',
      metadata: {
        sku,
        content_type: contentType,
        quality_score: qualityScore,
        generation_time_ms: generationTimeMs,
        ai_model: aiModel,
        prompt_tokens: tokenUsage?.prompt,
        completion_tokens: tokenUsage?.completion
      }
    };
    
    await this.collectEvent(event);
  }

  /**
   * Collect review event
   */
  async collectReviewEvent(
    contentId: string,
    action: 'approve' | 'reject' | 'edit',
    sessionId: string,
    userId?: string,
    reviewTimeMs?: number,
    qualityRating?: number
  ): Promise<void> {
    const event: ReviewEvent = {
      type: 'review',
      timestamp: new Date(),
      session_id: sessionId,
      user_id: userId,
      source: 'dashboard',
      metadata: {
        content_id: contentId,
        action,
        review_time_ms: reviewTimeMs,
        changes_made: action === 'edit',
        quality_rating: qualityRating
      }
    };
    
    await this.collectEvent(event);
  }

  /**
   * Collect data quality event
   */
  async collectDataQualityEvent(
    totalProducts: number,
    completeProducts: number,
    normalizedProducts: number,
    qualityScore: number,
    sessionId: string = 'system'
  ): Promise<void> {
    const event: DataQualityEvent = {
      type: 'data_quality',
      timestamp: new Date(),
      session_id: sessionId,
      source: 'system',
      metadata: {
        total_products: totalProducts,
        complete_products: completeProducts,
        normalized_products: normalizedProducts,
        quality_score: qualityScore
      }
    };
    
    await this.collectEvent(event);
  }

  /**
   * Collect system performance event
   */
  async collectSystemPerformanceEvent(
    metricName: string,
    metricValue: number,
    metricUnit: string,
    sessionId: string = 'system',
    systemComponent?: string
  ): Promise<void> {
    const event: SystemPerformanceEvent = {
      type: 'system_performance',
      timestamp: new Date(),
      session_id: sessionId,
      source: 'system',
      metadata: {
        metric_name: metricName,
        metric_value: metricValue,
        metric_unit: metricUnit,
        system_component: systemComponent
      }
    };
    
    await this.collectEvent(event);
  }

  /**
   * Collect user interaction event
   */
  async collectUserInteractionEvent(
    action: string,
    element: string,
    page: string,
    sessionId: string,
    userId?: string,
    timeOnPageMs?: number
  ): Promise<void> {
    const event: UserInteractionEvent = {
      type: 'user_interaction',
      timestamp: new Date(),
      session_id: sessionId,
      user_id: userId,
      source: 'dashboard',
      metadata: {
        action,
        element,
        page,
        time_on_page_ms: timeOnPageMs
      }
    };
    
    await this.collectEvent(event);
  }

  /**
   * Generate session ID for tracking user journeys
   */
  generateSessionId(): string {
    return `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Validate event structure
   */
  private validateEvent(event: KPIEvent): KPIEvent {
    if (!event.type || !event.timestamp || !event.session_id || !event.source) {
      throw new Error('Invalid KPI event: missing required fields');
    }

    const validTypes = ['search', 'generation', 'review', 'data_quality', 'system_performance', 'user_interaction'];
    if (!validTypes.includes(event.type)) {
      throw new Error(`Invalid KPI event type: ${event.type}`);
    }

    const validSources = ['api', 'dashboard', 'system', 'external'];
    if (!validSources.includes(event.source)) {
      throw new Error(`Invalid KPI event source: ${event.source}`);
    }

    return event;
  }

  /**
   * Anonymize PII in event data
   */
  private anonymizePII(event: KPIEvent): KPIEvent {
    const anonymized = { ...event };
    
    // Hash user ID if present
    if (anonymized.user_id) {
      anonymized.user_id = this.hashPII(anonymized.user_id);
    }
    
    // Anonymize search queries (keep first 3 chars + length)
    if (event.type === 'search' && event.metadata.query) {
      const query = event.metadata.query as string;
      if (query.length > 10) {
        anonymized.metadata = {
          ...anonymized.metadata,
          query: `${query.substring(0, 3)}...[${query.length} chars]`
        };
      }
    }
    
    // Remove any potential PII from metadata
    if (anonymized.metadata) {
      anonymized.metadata = this.sanitizeMetadata(anonymized.metadata);
    }
    
    return anonymized;
  }

  /**
   * Hash PII data consistently
   */
  private hashPII(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Sanitize metadata to remove potential PII
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata };
    
    // Remove common PII fields
    const piiFields = ['email', 'phone', 'address', 'name', 'ip_address'];
    piiFields.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    });
    
    return sanitized;
  }

  /**
   * Flush events to database
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const { error } = await supabase
        .from('kpi_events')
        .insert(eventsToFlush.map(event => ({
          type: event.type,
          timestamp: event.timestamp.toISOString(),
          session_id: event.session_id,
          user_id: event.user_id,
          source: event.source,
          metadata: event.metadata
        })));

      if (error) {
        console.error('Error flushing KPI events:', error);
        // Re-add events to queue for retry
        this.eventQueue.unshift(...eventsToFlush);
      } else {
        console.log(`📊 Flushed ${eventsToFlush.length} KPI events to database`);
      }
    } catch (error) {
      console.error('Error flushing KPI events:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...eventsToFlush);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.eventQueue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Force flush events (useful for testing)
   */
  async forceFlush(): Promise<void> {
    await this.flushEvents();
  }
}

// Export singleton instance
export const kpiEventCollector = KPIEventCollector.getInstance();