import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the supabase module first
const mockInsert = jest.fn();
const mockFrom = jest.fn();

jest.mock('../lib/supabase', () => ({
  supabase: { 
    from: jest.fn(() => ({ 
      insert: mockInsert 
    }))
  }
}));

import { 
  KPIEventCollector, 
  KPIEvent, 
  SearchEvent, 
  GenerationEvent, 
  ReviewEvent,
  DataQualityEvent,
  SystemPerformanceEvent,
  UserInteractionEvent
} from '../lib/kpi-event-collector';

describe('KPIEventCollector', () => {
  let collector: KPIEventCollector;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (mockInsert as jest.MockedFunction<any>).mockResolvedValue({ error: null });
    
    // Get fresh instance
    collector = KPIEventCollector.getInstance();
    
    // Clear any existing queue
    (collector as any).eventQueue = [];
    (collector as any).isProcessing = false;
  });

  afterEach(() => {
    // Clean up any timers
    jest.clearAllTimers();
  });

  describe('Event Schema Validation', () => {
    it('should validate required fields in KPI event', async () => {
      const invalidEvent = {
        type: 'search',
        // missing required fields
      } as KPIEvent;

      // Access private method for testing
      const validateEvent = (collector as any).validateEvent.bind(collector);
      
      expect(() => validateEvent(invalidEvent)).toThrow('Invalid KPI event: missing required fields');
    });

    it('should validate event type', async () => {
      const invalidEvent: KPIEvent = {
        type: 'invalid_type' as any,
        timestamp: new Date(),
        session_id: 'test_session',
        source: 'api',
        metadata: {}
      };

      const validateEvent = (collector as any).validateEvent.bind(collector);
      
      expect(() => validateEvent(invalidEvent)).toThrow('Invalid KPI event type: invalid_type');
    });

    it('should validate event source', async () => {
      const invalidEvent: KPIEvent = {
        type: 'search',
        timestamp: new Date(),
        session_id: 'test_session',
        source: 'invalid_source' as any,
        metadata: {}
      };

      const validateEvent = (collector as any).validateEvent.bind(collector);
      
      expect(() => validateEvent(invalidEvent)).toThrow('Invalid KPI event source: invalid_source');
    });

    it('should accept valid event types', async () => {
      const validTypes = ['search', 'generation', 'review', 'data_quality', 'system_performance', 'user_interaction'];
      
      for (const type of validTypes) {
        const validEvent: KPIEvent = {
          type: type as any,
          timestamp: new Date(),
          session_id: 'test_session',
          source: 'api',
          metadata: {}
        };

        const validateEvent = (collector as any).validateEvent.bind(collector);
        expect(() => validateEvent(validEvent)).not.toThrow();
      }
    });

    it('should accept valid event sources', async () => {
      const validSources = ['api', 'dashboard', 'system', 'external'];
      
      for (const source of validSources) {
        const validEvent: KPIEvent = {
          type: 'search',
          timestamp: new Date(),
          session_id: 'test_session',
          source: source as any,
          metadata: {}
        };

        const validateEvent = (collector as any).validateEvent.bind(collector);
        expect(() => validateEvent(validEvent)).not.toThrow();
      }
    });
  });

  describe('Event Normalization', () => {
    it('should normalize search events correctly', async () => {
      await collector.collectSearchEvent(
        'test query',
        5,
        150,
        'session_123',
        'basic',
        'user_456'
      );

      const queue = (collector as any).eventQueue;
      expect(queue).toHaveLength(1);
      
      const event = queue[0] as SearchEvent;
      expect(event.type).toBe('search');
      expect(event.source).toBe('api');
      expect(event.metadata.query).toBe('test query');
      expect(event.metadata.results_count).toBe(5);
      expect(event.metadata.response_time_ms).toBe(150);
      expect(event.metadata.has_results).toBe(true);
      expect(event.metadata.search_type).toBe('basic');
    });

    it('should normalize generation events correctly', async () => {
      await collector.collectGenerationEvent(
        'SKU123',
        'description',
        0.85,
        2500,
        'gpt-4',
        'session_123',
        'user_456',
        { prompt: 100, completion: 200 }
      );

      const queue = (collector as any).eventQueue;
      expect(queue).toHaveLength(1);
      
      const event = queue[0] as GenerationEvent;
      expect(event.type).toBe('generation');
      expect(event.source).toBe('api');
      expect(event.metadata.sku).toBe('SKU123');
      expect(event.metadata.content_type).toBe('description');
      expect(event.metadata.quality_score).toBe(0.85);
      expect(event.metadata.generation_time_ms).toBe(2500);
      expect(event.metadata.ai_model).toBe('gpt-4');
      expect(event.metadata.prompt_tokens).toBe(100);
      expect(event.metadata.completion_tokens).toBe(200);
    });

    it('should normalize review events correctly', async () => {
      await collector.collectReviewEvent(
        'content_123',
        'approve',
        'session_123',
        'user_456',
        5000,
        4.5
      );

      const queue = (collector as any).eventQueue;
      expect(queue).toHaveLength(1);
      
      const event = queue[0] as ReviewEvent;
      expect(event.type).toBe('review');
      expect(event.source).toBe('dashboard');
      expect(event.metadata.content_id).toBe('content_123');
      expect(event.metadata.action).toBe('approve');
      expect(event.metadata.review_time_ms).toBe(5000);
      expect(event.metadata.changes_made).toBe(false);
      expect(event.metadata.quality_rating).toBe(4.5);
    });

    it('should normalize data quality events correctly', async () => {
      await collector.collectDataQualityEvent(
        1000,
        850,
        900,
        0.85,
        'system_session'
      );

      const queue = (collector as any).eventQueue;
      expect(queue).toHaveLength(1);
      
      const event = queue[0] as DataQualityEvent;
      expect(event.type).toBe('data_quality');
      expect(event.source).toBe('system');
      expect(event.metadata.total_products).toBe(1000);
      expect(event.metadata.complete_products).toBe(850);
      expect(event.metadata.normalized_products).toBe(900);
      expect(event.metadata.quality_score).toBe(0.85);
    });

    it('should normalize system performance events correctly', async () => {
      await collector.collectSystemPerformanceEvent(
        'response_time',
        150,
        'ms',
        'system_session',
        'api_server'
      );

      const queue = (collector as any).eventQueue;
      expect(queue).toHaveLength(1);
      
      const event = queue[0] as SystemPerformanceEvent;
      expect(event.type).toBe('system_performance');
      expect(event.source).toBe('system');
      expect(event.metadata.metric_name).toBe('response_time');
      expect(event.metadata.metric_value).toBe(150);
      expect(event.metadata.metric_unit).toBe('ms');
      expect(event.metadata.system_component).toBe('api_server');
    });

    it('should normalize user interaction events correctly', async () => {
      await collector.collectUserInteractionEvent(
        'click',
        'search_button',
        'home',
        'session_123',
        'user_456',
        30000
      );

      const queue = (collector as any).eventQueue;
      expect(queue).toHaveLength(1);
      
      const event = queue[0] as UserInteractionEvent;
      expect(event.type).toBe('user_interaction');
      expect(event.source).toBe('dashboard');
      expect(event.metadata.action).toBe('click');
      expect(event.metadata.element).toBe('search_button');
      expect(event.metadata.page).toBe('home');
      expect(event.metadata.time_on_page_ms).toBe(30000);
    });
  });

  describe('PII Anonymization', () => {
    it('should hash user IDs', async () => {
      const event: KPIEvent = {
        type: 'search',
        timestamp: new Date(),
        session_id: 'session_123',
        user_id: 'user@example.com',
        source: 'api',
        metadata: { query: 'test' }
      };

      const anonymizePII = (collector as any).anonymizePII.bind(collector);
      const anonymized = anonymizePII(event);

      expect(anonymized.user_id).not.toBe('user@example.com');
      expect(anonymized.user_id).toBe('mockedhash123456'); // Based on our mock
    });

    it('should anonymize long search queries', async () => {
      const event: SearchEvent = {
        type: 'search',
        timestamp: new Date(),
        session_id: 'session_123',
        source: 'api',
        metadata: {
          query: 'this is a very long search query that contains sensitive information',
          results_count: 5,
          response_time_ms: 150,
          has_results: true
        }
      };

      const anonymizePII = (collector as any).anonymizePII.bind(collector);
      const anonymized = anonymizePII(event);

      expect(anonymized.metadata.query).toBe('thi...[68 chars]');
      expect(anonymized.metadata.query).not.toContain('sensitive information');
    });

    it('should preserve short search queries', async () => {
      const event: SearchEvent = {
        type: 'search',
        timestamp: new Date(),
        session_id: 'session_123',
        source: 'api',
        metadata: {
          query: 'short',
          results_count: 5,
          response_time_ms: 150,
          has_results: true
        }
      };

      const anonymizePII = (collector as any).anonymizePII.bind(collector);
      const anonymized = anonymizePII(event);

      expect(anonymized.metadata.query).toBe('short');
    });

    it('should remove PII fields from metadata', async () => {
      const event: KPIEvent = {
        type: 'user_interaction',
        timestamp: new Date(),
        session_id: 'session_123',
        source: 'dashboard',
        metadata: {
          action: 'click',
          email: 'user@example.com',
          phone: '123-456-7890',
          address: '123 Main St',
          name: 'John Doe',
          ip_address: '192.168.1.1',
          safe_field: 'safe_value'
        }
      };

      const anonymizePII = (collector as any).anonymizePII.bind(collector);
      const anonymized = anonymizePII(event);

      expect(anonymized.metadata.email).toBeUndefined();
      expect(anonymized.metadata.phone).toBeUndefined();
      expect(anonymized.metadata.address).toBeUndefined();
      expect(anonymized.metadata.name).toBeUndefined();
      expect(anonymized.metadata.ip_address).toBeUndefined();
      expect(anonymized.metadata.safe_field).toBe('safe_value');
      expect(anonymized.metadata.action).toBe('click');
    });

    it('should hash PII consistently', async () => {
      const hashPII = (collector as any).hashPII.bind(collector);
      
      const hash1 = hashPII('user@example.com');
      const hash2 = hashPII('user@example.com');
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16); // Truncated to 16 chars
    });
  });

  describe('Session Tracking', () => {
    it('should generate session IDs with correct format', () => {
      const sessionId1 = collector.generateSessionId();
      const sessionId2 = collector.generateSessionId();

      // With mocked crypto, they will be the same, but format should be correct
      expect(sessionId1).toMatch(/^session_\d+_[a-f0-9]{16}$/);
      expect(sessionId2).toMatch(/^session_\d+_[a-f0-9]{16}$/);
    });

    it('should track session consistency across events', async () => {
      const sessionId = collector.generateSessionId();

      await collector.collectSearchEvent('query1', 5, 100, sessionId);
      await collector.collectSearchEvent('query2', 3, 120, sessionId);
      await collector.collectUserInteractionEvent('click', 'result', 'search', sessionId);

      const queue = (collector as any).eventQueue;
      expect(queue).toHaveLength(3);
      
      queue.forEach((event: KPIEvent) => {
        expect(event.session_id).toBe(sessionId);
      });
    });

    it('should maintain session tracking accuracy with concurrent events', async () => {
      const sessionId1 = 'session_test_1';
      const sessionId2 = 'session_test_2';

      // Simulate concurrent events from different sessions
      const promises = [
        collector.collectSearchEvent('query1', 5, 100, sessionId1),
        collector.collectSearchEvent('query2', 3, 120, sessionId2),
        collector.collectUserInteractionEvent('click', 'result', 'search', sessionId1),
        collector.collectUserInteractionEvent('scroll', 'page', 'search', sessionId2)
      ];

      await Promise.all(promises);

      const queue = (collector as any).eventQueue;
      expect(queue).toHaveLength(4);
      
      const session1Events = queue.filter((e: KPIEvent) => e.session_id === sessionId1);
      const session2Events = queue.filter((e: KPIEvent) => e.session_id === sessionId2);
      
      expect(session1Events).toHaveLength(2);
      expect(session2Events).toHaveLength(2);
    });
  });

  describe('Event Collection Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const invalidEvent = {
        type: 'invalid_type',
        timestamp: new Date(),
        session_id: 'test_session',
        source: 'api',
        metadata: {}
      } as any;

      // Should not throw error
      await expect(collector.collectEvent(invalidEvent)).resolves.toBeUndefined();
      
      // Queue should remain empty
      const queue = (collector as any).eventQueue;
      expect(queue).toHaveLength(0);
    });

    it('should continue processing other events after validation error', async () => {
      const invalidEvent = {
        type: 'invalid_type',
        timestamp: new Date(),
        session_id: 'test_session',
        source: 'api',
        metadata: {}
      } as any;

      const validEvent: KPIEvent = {
        type: 'search',
        timestamp: new Date(),
        session_id: 'test_session',
        source: 'api',
        metadata: { query: 'test' }
      };

      await collector.collectEvent(invalidEvent);
      await collector.collectEvent(validEvent);

      const queue = (collector as any).eventQueue;
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('search');
    });

    it('should handle database flush errors gracefully', async () => {
      // Mock database error
      (mockInsert as jest.MockedFunction<any>).mockResolvedValueOnce({ error: new Error('Database connection failed') });

      await collector.collectSearchEvent('test', 1, 100, 'session_123');
      
      // Force flush to trigger error
      await collector.forceFlush();

      // Event should be re-added to queue for retry
      const queue = (collector as any).eventQueue;
      expect(queue).toHaveLength(1);
    });
  });

  describe('Queue Management', () => {
    it('should provide accurate queue status', async () => {
      await collector.collectSearchEvent('test1', 1, 100, 'session_123');
      await collector.collectSearchEvent('test2', 2, 150, 'session_123');

      const status = collector.getQueueStatus();
      expect(status.queueLength).toBe(2);
      expect(status.isProcessing).toBe(false);
    });

    it('should batch events when queue reaches batch size', async () => {
      // Set small batch size for testing
      (collector as any).batchSize = 2;

      await collector.collectSearchEvent('test1', 1, 100, 'session_123');
      await collector.collectSearchEvent('test2', 2, 150, 'session_123');

      // Should trigger flush automatically
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'search' }),
          expect.objectContaining({ type: 'search' })
        ])
      );
    });

    it('should handle force flush correctly', async () => {
      await collector.collectSearchEvent('test1', 1, 100, 'session_123');
      await collector.collectSearchEvent('test2', 2, 150, 'session_123');

      await collector.forceFlush();

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'search' }),
          expect.objectContaining({ type: 'search' })
        ])
      );

      // Queue should be empty after flush
      const status = collector.getQueueStatus();
      expect(status.queueLength).toBe(0);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = KPIEventCollector.getInstance();
      const instance2 = KPIEventCollector.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should maintain state across getInstance calls', async () => {
      const instance1 = KPIEventCollector.getInstance();
      await instance1.collectSearchEvent('test', 1, 100, 'session_123');

      const instance2 = KPIEventCollector.getInstance();
      const status = instance2.getQueueStatus();

      expect(status.queueLength).toBe(1);
    });
  });
});