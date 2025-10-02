// Simple test to verify KPI middleware integration
const express = require('express');
const cookieParser = require('cookie-parser');

// Mock the KPI event collector
const mockKPIEventCollector = {
  generateSessionId: () => `test_session_${Date.now()}`,
  collectSearchEvent: async (...args) => {
    console.log('📊 Search event collected:', args);
  },
  collectGenerationEvent: async (...args) => {
    console.log('📊 Generation event collected:', args);
  },
  collectUserInteractionEvent: async (...args) => {
    console.log('📊 User interaction event collected:', args);
  },
  collectSystemPerformanceEvent: async (...args) => {
    console.log('📊 System performance event collected:', args);
  },
  collectDataQualityEvent: async (...args) => {
    console.log('📊 Data quality event collected:', args);
  }
};

// Mock middleware functions
function sessionTrackingMiddleware(req, res, next) {
  const sessionId = req.headers['x-session-id'] || 
                   req.cookies?.sessionId || 
                   mockKPIEventCollector.generateSessionId();
  
  req.kpiSession = {
    sessionId,
    startTime: Date.now(),
    userId: req.headers['x-user-id']
  };
  
  console.log('📊 Session tracking middleware applied:', sessionId);
  next();
}

function searchTrackingMiddleware(req, res, next) {
  const startTime = Date.now();
  
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    if (req.kpiSession && data.success) {
      setImmediate(async () => {
        const query = req.query.q || '';
        const resultsCount = data.count || 0;
        const searchType = req.query.advanced === 'true' ? 'advanced' : 'basic';
        
        await mockKPIEventCollector.collectSearchEvent(
          query,
          resultsCount,
          responseTime,
          req.kpiSession.sessionId,
          searchType,
          req.kpiSession.userId
        );
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());

// Apply middleware
app.use(sessionTrackingMiddleware);

// Test search endpoint with middleware
app.get('/api/search-products', searchTrackingMiddleware, (req, res) => {
  const query = req.query.q;
  const mockResults = [
    { sku: 'TEST001', name: 'Test Product 1' },
    { sku: 'TEST002', name: 'Test Product 2' }
  ];
  
  res.json({
    success: true,
    products: mockResults,
    count: mockResults.length,
    search_type: 'basic'
  });
});

// Test client events endpoint
app.post('/api/kpi/client-events', (req, res) => {
  const { events } = req.body;
  const sessionId = req.headers['x-session-id'] || req.kpiSession?.sessionId;
  
  console.log('📊 Received client events:', events.length, 'events for session:', sessionId);
  
  events.forEach(event => {
    console.log('📊 Client event:', event.type, event.metadata);
  });
  
  res.json({
    success: true,
    processed: events.length,
    message: 'Client events processed successfully'
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🧪 KPI Middleware Test Server running on http://localhost:${PORT}`);
  console.log('Test endpoints:');
  console.log('  GET /api/search-products?q=test');
  console.log('  POST /api/kpi/client-events');
  
  // Run some tests
  setTimeout(async () => {
    console.log('\n🧪 Running automated tests...\n');
    
    // Test 1: Search endpoint
    const fetch = (await import('node-fetch')).default;
    
    try {
      const response = await fetch(`http://localhost:${PORT}/api/search-products?q=test`, {
        headers: {
          'x-session-id': 'test-session-123'
        }
      });
      const data = await response.json();
      console.log('✅ Search endpoint test passed:', data.success);
    } catch (error) {
      console.log('❌ Search endpoint test failed:', error.message);
    }
    
    // Test 2: Client events endpoint
    try {
      const response = await fetch(`http://localhost:${PORT}/api/kpi/client-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': 'test-session-123'
        },
        body: JSON.stringify({
          events: [
            {
              type: 'user_interaction',
              timestamp: new Date(),
              sessionId: 'test-session-123',
              metadata: {
                action: 'click',
                element: 'button',
                page: '/test'
              }
            }
          ]
        })
      });
      const data = await response.json();
      console.log('✅ Client events endpoint test passed:', data.success);
    } catch (error) {
      console.log('❌ Client events endpoint test failed:', error.message);
    }
    
    console.log('\n🧪 Tests completed. Press Ctrl+C to exit.');
  }, 1000);
});