import { supabase } from './supabase';
import { KPIEvent } from './kpi-event-collector';
import { dataQualityAnalyzer } from './data-quality-analyzer';
import { retrievalQualityAnalyzer } from './retrieval-quality-analyzer';
import { userExperienceAnalyzer } from './user-experience-analyzer';
import { systemPerformanceMonitor } from './system-performance-monitor';

// Event processing pipeline interfaces
export interface ProcessedEvent {
  original_event: KPIEvent;
  processed_at: Date;
  processing_time_ms: number;
  enrichments: Record<string, any>;
  aggregations_updated: string[];
  alerts_triggered: string[];
  status: 'processed' | 'failed' | 'skipped';
  error_message?: string;
}

export interface EventAggregation {
  id: string;
  metric_name: string;
  aggregation_type: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'percentile';
  time_window: 'minute' | 'hour' | 'day' | 'week' | 'month';
  dimensions: Record<string, string>;
  value: number;
  event_count: number;
  window_start: Date;
  window_end: Date;
  last_updated: Date;
}

export interface RealTimeMetric {
  metric_name: string;
  current_value: number;
  previous_value: number;
  change_percent: number;
  trend: 'up' | 'down' | 'stable';
  last_updated: Date;
  time_window_minutes: number;
}

export interface ProcessingStats {
  events_processed: number;
  events_failed: number;
  avg_processing_time_ms: number;
  throughput_events_per_second: number;
  queue_size: number;
  last_processed_at: Date;
  uptime_seconds: number;
}

export class EventProcessingPipeline {
  private static instance: EventProcessingPipeline;
  private isProcessing = false;
  private processingInterval?: NodeJS.Timeout;
  private eventQueue: KPIEvent[] = [];
  private processingStats: ProcessingStats = {
    events_processed: 0,
    events_failed: 0,
    avg_processing_time_ms: 0,
    throughput_events_per_second: 0,
    queue_size: 0,
    last_processed_at: new Date(),
    uptime_seconds: 0
  };
  
  // Time windows for aggregations
  private readonly timeWindows = ['minute', 'hour', 'day', 'week', 'month'] as const;
  
  // Real-time metrics cache
  private realTimeMetrics: Map<string, RealTimeMetric> = new Map();
  
  // Processing configuration
  private readonly config = {
    batchSize: 100,
    processingIntervalMs: 5000, // 5 seconds
    maxRetries: 3,
    alertThresholds: {
      processingLatency: 1000, // ms
      errorRate: 5, // percent
      queueSize: 1000
    }
  };

  private constructor() {
    this.startProcessingStats();
  }

  static getInstance(): EventProcessingPipeline {
    if (!EventProcessingPipeline.instance) {
      EventProcessingPipeline.instance = new EventProcessingPipeline();
    }
    return EventProcessingPipeline.instance;
  }

  /**
   * Start the event processing pipeline
   */
  startProcessing(): void {
    if (this.isProcessing) {
      console.log('⚠️ Event processing pipeline is already running');
      return;
    }

    console.log('🚀 Starting event processing pipeline');
    this.isProcessing = true;
    
    // Start periodic processing
    this.processingInterval = setInterval(() => {
      this.processEventBatch();
    }, this.config.processingIntervalMs);
    
    // Initial processing
    this.processEventBatch();
  }

  /**
   * Stop the event processing pipeline
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    this.isProcessing = false;
    console.log('🛑 Event processing pipeline stopped');
  }

  /**
   * Add event to processing queue
   */
  async enqueueEvent(event: KPIEvent): Promise<void> {
    this.eventQueue.push(event);
    this.processingStats.queue_size = this.eventQueue.length;
    
    // Process immediately if queue is getting large
    if (this.eventQueue.length >= this.config.batchSize) {
      await this.processEventBatch();
    }
  }

  /**
   * Process a batch of events
   */
  private async processEventBatch(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const startTime = Date.now();
    const batch = this.eventQueue.splice(0, this.config.batchSize);
    
    console.log(`⚡ Processing batch of ${batch.length} events`);
    
    const processedEvents: ProcessedEvent[] = [];
    
    for (const event of batch) {
      try {
        const processed = await this.processEvent(event);
        processedEvents.push(processed);
        
        if (processed.status === 'processed') {
          this.processingStats.events_processed++;
        } else {
          this.processingStats.events_failed++;
        }
        
      } catch (error) {
        console.error('Error processing event:', error);
        this.processingStats.events_failed++;
        
        processedEvents.push({
          original_event: event,
          processed_at: new Date(),
          processing_time_ms: 0,
          enrichments: {},
          aggregations_updated: [],
          alerts_triggered: [],
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Update processing stats
    const processingTime = Date.now() - startTime;
    this.processingStats.avg_processing_time_ms = 
      (this.processingStats.avg_processing_time_ms + processingTime) / 2;
    this.processingStats.queue_size = this.eventQueue.length;
    this.processingStats.last_processed_at = new Date();
    
    // Calculate throughput
    const totalEvents = this.processingStats.events_processed + this.processingStats.events_failed;
    if (totalEvents > 0) {
      this.processingStats.throughput_events_per_second = 
        totalEvents / (this.processingStats.uptime_seconds || 1);
    }
    
    // Store processed events
    await this.storeProcessedEvents(processedEvents);
    
    // Check for processing alerts
    await this.checkProcessingAlerts();
    
    console.log(`✅ Batch processed in ${processingTime}ms - Success: ${processedEvents.filter(e => e.status === 'processed').length}, Failed: ${processedEvents.filter(e => e.status === 'failed').length}`);
  }

  /**
   * Process a single event
   */
  private async processEvent(event: KPIEvent): Promise<ProcessedEvent> {
    const startTime = Date.now();
    const enrichments: Record<string, any> = {};
    const aggregationsUpdated: string[] = [];
    const alertsTriggered: string[] = [];
    
    try {
      // Stage 1: Validation and enrichment
      const enrichedEvent = await this.enrichEvent(event);
      Object.assign(enrichments, enrichedEvent);
      
      // Stage 2: Real-time metric updates
      await this.updateRealTimeMetrics(event);
      
      // Stage 3: Aggregation updates
      const updatedAggregations = await this.updateAggregations(event);
      aggregationsUpdated.push(...updatedAggregations);
      
      // Stage 4: Trigger analysis based on event type
      await this.triggerEventAnalysis(event);
      
      // Stage 5: Check for alerts
      const triggeredAlerts = await this.checkEventAlerts(event);
      alertsTriggered.push(...triggeredAlerts);
      
      const processingTime = Date.now() - startTime;
      
      return {
        original_event: event,
        processed_at: new Date(),
        processing_time_ms: processingTime,
        enrichments,
        aggregations_updated: aggregationsUpdated,
        alerts_triggered: alertsTriggered,
        status: 'processed'
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      return {
        original_event: event,
        processed_at: new Date(),
        processing_time_ms: processingTime,
        enrichments,
        aggregations_updated: aggregationsUpdated,
        alerts_triggered: alertsTriggered,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enrich event with additional context
   */
  private async enrichEvent(event: KPIEvent): Promise<Record<string, any>> {
    const enrichments: Record<string, any> = {};
    
    try {
      // Add timestamp-based enrichments
      const timestamp = new Date(event.timestamp);
      enrichments.hour_of_day = timestamp.getHours();
      enrichments.day_of_week = timestamp.getDay();
      enrichments.is_weekend = timestamp.getDay() === 0 || timestamp.getDay() === 6;
      
      // Add session-based enrichments
      if (event.session_id) {
        const sessionEvents = await this.getSessionEvents(event.session_id);
        enrichments.session_event_count = sessionEvents.length;
        enrichments.session_duration_ms = this.calculateSessionDuration(sessionEvents);
      }
      
      // Event-type specific enrichments
      switch (event.type) {
        case 'search':
          if (event.metadata.query) {
            enrichments.query_length = event.metadata.query.length;
            enrichments.query_word_count = event.metadata.query.split(/\s+/).length;
          }
          break;
          
        case 'generation':
          if (event.metadata.generation_time_ms) {
            enrichments.generation_speed_category = this.categorizeGenerationSpeed(
              event.metadata.generation_time_ms
            );
          }
          break;
          
        case 'user_interaction':
          enrichments.interaction_category = this.categorizeUserInteraction(
            event.metadata.action, event.metadata.element
          );
          break;
      }
      
      return enrichments;
      
    } catch (error) {
      console.warn('Error enriching event:', error);
      return enrichments;
    }
  }

  /**
   * Update real-time metrics
   */
  private async updateRealTimeMetrics(event: KPIEvent): Promise<void> {
    try {
      const metricUpdates: Array<{ name: string; value: number }> = [];
      
      // Generate metric updates based on event type
      switch (event.type) {
        case 'search':
          metricUpdates.push(
            { name: 'search_count', value: 1 },
            { name: 'search_response_time', value: event.metadata.response_time_ms || 0 },
            { name: 'search_results_count', value: event.metadata.results_count || 0 }
          );
          break;
          
        case 'generation':
          metricUpdates.push(
            { name: 'generation_count', value: 1 },
            { name: 'generation_time', value: event.metadata.generation_time_ms || 0 },
            { name: 'generation_quality', value: event.metadata.quality_score || 0 }
          );
          break;
          
        case 'user_interaction':
          metricUpdates.push(
            { name: 'user_interaction_count', value: 1 }
          );
          if (event.metadata.time_on_page_ms) {
            metricUpdates.push({ name: 'time_on_page', value: event.metadata.time_on_page_ms });
          }
          break;
          
        case 'system_performance':
          metricUpdates.push(
            { name: `system_${event.metadata.metric_name}`, value: event.metadata.metric_value || 0 }
          );
          break;
      }
      
      // Update real-time metrics
      for (const update of metricUpdates) {
        await this.updateRealTimeMetric(update.name, update.value);
      }
      
    } catch (error) {
      console.warn('Error updating real-time metrics:', error);
    }
  }

  /**
   * Update a specific real-time metric
   */
  private async updateRealTimeMetric(metricName: string, value: number): Promise<void> {
    const existing = this.realTimeMetrics.get(metricName);
    const now = new Date();
    
    if (existing) {
      const previousValue = existing.current_value;
      const newValue = (existing.current_value + value) / 2; // Simple moving average
      const changePercent = previousValue > 0 ? ((newValue - previousValue) / previousValue) * 100 : 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(changePercent) > 5) {
        trend = changePercent > 0 ? 'up' : 'down';
      }
      
      this.realTimeMetrics.set(metricName, {
        metric_name: metricName,
        current_value: newValue,
        previous_value: previousValue,
        change_percent: changePercent,
        trend,
        last_updated: now,
        time_window_minutes: 5
      });
    } else {
      this.realTimeMetrics.set(metricName, {
        metric_name: metricName,
        current_value: value,
        previous_value: 0,
        change_percent: 0,
        trend: 'stable',
        last_updated: now,
        time_window_minutes: 5
      });
    }
  }

  /**
   * Update aggregations for different time windows
   */
  private async updateAggregations(event: KPIEvent): Promise<string[]> {
    const updatedAggregations: string[] = [];
    
    try {
      for (const timeWindow of this.timeWindows) {
        const windowBounds = this.getTimeWindowBounds(new Date(event.timestamp), timeWindow);
        
        // Define aggregations to update based on event type
        const aggregationsToUpdate = this.getAggregationsForEvent(event, timeWindow);
        
        for (const aggregation of aggregationsToUpdate) {
          await this.updateAggregation(aggregation, windowBounds);
          updatedAggregations.push(`${aggregation.metric_name}_${timeWindow}`);
        }
      }
      
      return updatedAggregations;
      
    } catch (error) {
      console.warn('Error updating aggregations:', error);
      return updatedAggregations;
    }
  }

  /**
   * Trigger event-specific analysis
   */
  private async triggerEventAnalysis(event: KPIEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'search':
          // Trigger search quality analysis if we have enough data
          if (event.metadata.results_count !== undefined) {
            // This would typically be triggered by a separate service
            console.log(`🔍 Search event processed: ${event.metadata.query} (${event.metadata.results_count} results)`);
          }
          break;
          
        case 'data_quality':
          // Trigger data quality analysis
          await dataQualityAnalyzer.analyzeProductCompleteness();
          break;
          
        case 'system_performance':
          // System performance is already being monitored
          break;
      }
      
    } catch (error) {
      console.warn('Error triggering event analysis:', error);
    }
  }

  /**
   * Check for event-based alerts
   */
  private async checkEventAlerts(event: KPIEvent): Promise<string[]> {
    const triggeredAlerts: string[] = [];
    
    try {
      // Check for performance alerts
      if (event.type === 'search' && event.metadata.response_time_ms > 3000) {
        triggeredAlerts.push('slow_search_response');
      }
      
      if (event.type === 'generation' && event.metadata.generation_time_ms > 10000) {
        triggeredAlerts.push('slow_generation');
      }
      
      if (event.type === 'system_performance') {
        const metricName = event.metadata.metric_name;
        const value = event.metadata.metric_value;
        
        if (metricName === 'cpu_usage' && value > 85) {
          triggeredAlerts.push('high_cpu_usage');
        }
        
        if (metricName === 'memory_usage' && value > 90) {
          triggeredAlerts.push('high_memory_usage');
        }
      }
      
      return triggeredAlerts;
      
    } catch (error) {
      console.warn('Error checking event alerts:', error);
      return triggeredAlerts;
    }
  }

  /**
   * Check for processing pipeline alerts
   */
  private async checkProcessingAlerts(): Promise<void> {
    try {
      // Check processing latency
      if (this.processingStats.avg_processing_time_ms > this.config.alertThresholds.processingLatency) {
        console.warn(`🚨 High processing latency: ${this.processingStats.avg_processing_time_ms}ms`);
      }
      
      // Check error rate
      const totalEvents = this.processingStats.events_processed + this.processingStats.events_failed;
      if (totalEvents > 0) {
        const errorRate = (this.processingStats.events_failed / totalEvents) * 100;
        if (errorRate > this.config.alertThresholds.errorRate) {
          console.warn(`🚨 High error rate: ${errorRate.toFixed(2)}%`);
        }
      }
      
      // Check queue size
      if (this.processingStats.queue_size > this.config.alertThresholds.queueSize) {
        console.warn(`🚨 Large queue size: ${this.processingStats.queue_size} events`);
      }
      
    } catch (error) {
      console.warn('Error checking processing alerts:', error);
    }
  }

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics(): RealTimeMetric[] {
    return Array.from(this.realTimeMetrics.values());
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): ProcessingStats {
    return { ...this.processingStats };
  }

  /**
   * Get events for a session
   */
  private async getSessionEvents(sessionId: string): Promise<KPIEvent[]> {
    try {
      const { data: events, error } = await supabase
        .from('kpi_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });
      
      if (error) {
        console.warn(`Failed to fetch session events: ${error.message}`);
        return [];
      }
      
      return events || [];
      
    } catch (error) {
      console.warn('Error fetching session events:', error);
      return [];
    }
  }

  /**
   * Calculate session duration
   */
  private calculateSessionDuration(events: KPIEvent[]): number {
    if (events.length < 2) return 0;
    
    const firstEvent = new Date(events[0].timestamp);
    const lastEvent = new Date(events[events.length - 1].timestamp);
    
    return lastEvent.getTime() - firstEvent.getTime();
  }

  /**
   * Categorize generation speed
   */
  private categorizeGenerationSpeed(timeMs: number): string {
    if (timeMs < 1000) return 'fast';
    if (timeMs < 5000) return 'normal';
    if (timeMs < 10000) return 'slow';
    return 'very_slow';
  }

  /**
   * Categorize user interaction
   */
  private categorizeUserInteraction(action: string, element: string): string {
    if (action === 'click' && element.includes('result')) return 'result_click';
    if (action === 'click' && element.includes('button')) return 'button_click';
    if (action === 'scroll') return 'page_scroll';
    if (action === 'search') return 'search_action';
    return 'other_interaction';
  }

  /**
   * Get time window bounds
   */
  private getTimeWindowBounds(timestamp: Date, window: string): { start: Date; end: Date } {
    const start = new Date(timestamp);
    const end = new Date(timestamp);
    
    switch (window) {
      case 'minute':
        start.setSeconds(0, 0);
        end.setSeconds(59, 999);
        break;
      case 'hour':
        start.setMinutes(0, 0, 0);
        end.setMinutes(59, 59, 999);
        break;
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }
    
    return { start, end };
  }

  /**
   * Get aggregations to update for an event
   */
  private getAggregationsForEvent(event: KPIEvent, timeWindow: string): EventAggregation[] {
    const aggregations: EventAggregation[] = [];
    const windowBounds = this.getTimeWindowBounds(new Date(event.timestamp), timeWindow);
    
    // Common aggregations for all events
    aggregations.push({
      id: `event_count_${timeWindow}_${event.type}`,
      metric_name: 'event_count',
      aggregation_type: 'count',
      time_window: timeWindow as any,
      dimensions: { event_type: event.type, source: event.source },
      value: 1,
      event_count: 1,
      window_start: windowBounds.start,
      window_end: windowBounds.end,
      last_updated: new Date()
    });
    
    // Event-specific aggregations
    switch (event.type) {
      case 'search':
        if (event.metadata.response_time_ms) {
          aggregations.push({
            id: `search_response_time_${timeWindow}`,
            metric_name: 'search_response_time',
            aggregation_type: 'avg',
            time_window: timeWindow as any,
            dimensions: {},
            value: event.metadata.response_time_ms,
            event_count: 1,
            window_start: windowBounds.start,
            window_end: windowBounds.end,
            last_updated: new Date()
          });
        }
        break;
        
      case 'generation':
        if (event.metadata.generation_time_ms) {
          aggregations.push({
            id: `generation_time_${timeWindow}`,
            metric_name: 'generation_time',
            aggregation_type: 'avg',
            time_window: timeWindow as any,
            dimensions: { ai_model: event.metadata.ai_model || 'unknown' },
            value: event.metadata.generation_time_ms,
            event_count: 1,
            window_start: windowBounds.start,
            window_end: windowBounds.end,
            last_updated: new Date()
          });
        }
        break;
    }
    
    return aggregations;
  }

  /**
   * Update a specific aggregation
   */
  private async updateAggregation(
    aggregation: EventAggregation, 
    windowBounds: { start: Date; end: Date }
  ): Promise<void> {
    try {
      // This would typically update a time-series database
      // For now, we'll just log the aggregation update
      console.log(`📊 Updating aggregation: ${aggregation.metric_name} (${aggregation.aggregation_type}) = ${aggregation.value}`);
      
    } catch (error) {
      console.warn('Error updating aggregation:', error);
    }
  }

  /**
   * Store processed events
   */
  private async storeProcessedEvents(events: ProcessedEvent[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('processed_events')
        .insert(events.map(event => ({
          original_event_id: event.original_event.id,
          event_type: event.original_event.type,
          processed_at: event.processed_at.toISOString(),
          processing_time_ms: event.processing_time_ms,
          enrichments: event.enrichments,
          aggregations_updated: event.aggregations_updated,
          alerts_triggered: event.alerts_triggered,
          status: event.status,
          error_message: event.error_message
        })));
      
      if (error) {
        console.warn('Failed to store processed events:', error.message);
      }
      
    } catch (error) {
      console.warn('Error storing processed events:', error);
    }
  }

  /**
   * Start processing statistics tracking
   */
  private startProcessingStats(): void {
    const startTime = Date.now();
    
    setInterval(() => {
      this.processingStats.uptime_seconds = (Date.now() - startTime) / 1000;
    }, 1000);
  }
}

// Export singleton instance
export const eventProcessingPipeline = EventProcessingPipeline.getInstance();