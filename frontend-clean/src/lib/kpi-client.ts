// Client-side KPI tracking utility
import { v4 as uuidv4 } from 'uuid';

interface ClientKPIEvent {
  type: 'user_interaction' | 'page_view' | 'search' | 'generation_request';
  timestamp: Date;
  sessionId: string;
  metadata: Record<string, any>;
}

class ClientKPITracker {
  private sessionId: string;
  private startTime: number;
  private eventQueue: ClientKPIEvent[] = [];
  private isTracking: boolean = true;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.startTime = Date.now();
    this.setupEventListeners();
  }

  /**
   * Get or create session ID from localStorage
   */
  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'ssr-session';
    
    let sessionId = localStorage.getItem('kpi-session-id');
    if (!sessionId) {
      sessionId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('kpi-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * Setup automatic event listeners for common interactions
   */
  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Track page views
    this.trackPageView();

    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Track button clicks
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        this.trackUserInteraction('click', 'button', {
          button_text: button?.textContent?.trim(),
          button_id: button?.id,
          button_class: button?.className
        });
      }
      
      // Track link clicks
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target : target.closest('a');
        this.trackUserInteraction('click', 'link', {
          link_text: link?.textContent?.trim(),
          link_href: (link as HTMLAnchorElement)?.href,
          link_id: link?.id
        });
      }
      
      // Track form submissions
      if ((target as HTMLInputElement).type === 'submit') {
        const form = target.closest('form');
        this.trackUserInteraction('submit', 'form', {
          form_id: form?.id,
          form_class: form?.className
        });
      }
    });

    // Track search input interactions
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.type === 'search' || target.placeholder?.toLowerCase().includes('search')) {
        // Debounce search tracking
        clearTimeout((target as any).searchTimeout);
        (target as any).searchTimeout = setTimeout(() => {
          this.trackUserInteraction('search_input', 'search_field', {
            query_length: target.value.length,
            has_query: target.value.length > 0
          });
        }, 500);
      }
    });

    // Track time on page
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Date.now() - this.startTime;
      this.trackUserInteraction('page_exit', 'page', {
        time_on_page_ms: timeOnPage,
        page_url: window.location.pathname
      });
      this.flushEvents();
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        if (scrollDepth % 25 === 0) { // Track at 25%, 50%, 75%, 100%
          this.trackUserInteraction('scroll', 'page', {
            scroll_depth: scrollDepth,
            page_url: window.location.pathname
          });
        }
      }
    });
  }

  /**
   * Track page view
   */
  trackPageView() {
    if (typeof window === 'undefined') return;
    
    this.trackEvent({
      type: 'page_view',
      timestamp: new Date(),
      sessionId: this.sessionId,
      metadata: {
        page_url: window.location.pathname,
        page_title: document.title,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight
      }
    });
  }

  /**
   * Track user interaction
   */
  trackUserInteraction(action: string, element: string, additionalData: Record<string, any> = {}) {
    if (typeof window === 'undefined') return;
    
    this.trackEvent({
      type: 'user_interaction',
      timestamp: new Date(),
      sessionId: this.sessionId,
      metadata: {
        action,
        element,
        page: window.location.pathname,
        timestamp: Date.now(),
        ...additionalData
      }
    });
  }

  /**
   * Track search event
   */
  trackSearch(query: string, resultsCount: number, responseTime: number) {
    this.trackEvent({
      type: 'search',
      timestamp: new Date(),
      sessionId: this.sessionId,
      metadata: {
        query: query.length > 50 ? `${query.substring(0, 50)}...` : query, // Truncate long queries
        query_length: query.length,
        results_count: resultsCount,
        response_time_ms: responseTime,
        has_results: resultsCount > 0
      }
    });
  }

  /**
   * Track content generation request
   */
  trackGenerationRequest(sku: string, contentType: string) {
    this.trackEvent({
      type: 'generation_request',
      timestamp: new Date(),
      sessionId: this.sessionId,
      metadata: {
        sku,
        content_type: contentType,
        page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      }
    });
  }

  /**
   * Track custom event
   */
  trackEvent(event: ClientKPIEvent) {
    if (!this.isTracking) return;
    
    this.eventQueue.push(event);
    
    // Auto-flush when queue gets large
    if (this.eventQueue.length >= 10) {
      this.flushEvents();
    }
  }

  /**
   * Flush events to server
   */
  async flushEvents() {
    if (this.eventQueue.length === 0) return;
    
    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      // Send events to backend
      await fetch('/api/kpi/client-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({ events: eventsToSend })
      });
      
      console.log(`📊 Sent ${eventsToSend.length} client KPI events`);
    } catch (error) {
      console.error('Error sending KPI events:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...eventsToSend);
    }
  }

  /**
   * Enable/disable tracking
   */
  setTracking(enabled: boolean) {
    this.isTracking = enabled;
    if (enabled) {
      console.log('📊 KPI tracking enabled');
    } else {
      console.log('📊 KPI tracking disabled');
    }
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      queueLength: this.eventQueue.length,
      isTracking: this.isTracking
    };
  }
}

// Create singleton instance
let clientKPITracker: ClientKPITracker | null = null;

export function getKPITracker(): ClientKPITracker {
  if (!clientKPITracker) {
    clientKPITracker = new ClientKPITracker();
  }
  return clientKPITracker;
}

// React hook for KPI tracking
export function useKPITracking() {
  const tracker = getKPITracker();
  
  return {
    trackPageView: () => tracker.trackPageView(),
    trackUserInteraction: (action: string, element: string, data?: Record<string, any>) => 
      tracker.trackUserInteraction(action, element, data),
    trackSearch: (query: string, resultsCount: number, responseTime: number) => 
      tracker.trackSearch(query, resultsCount, responseTime),
    trackGenerationRequest: (sku: string, contentType: string) => 
      tracker.trackGenerationRequest(sku, contentType),
    flushEvents: () => tracker.flushEvents(),
    setTracking: (enabled: boolean) => tracker.setTracking(enabled),
    getSessionInfo: () => tracker.getSessionInfo()
  };
}

// Auto-initialize on import (only in browser)
if (typeof window !== 'undefined') {
  getKPITracker();
}