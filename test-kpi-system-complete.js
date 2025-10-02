#!/usr/bin/env node

/**
 * Comprehensive KPI System Test
 * Tests all implemented KPI functionality including:
 * - Data Quality Analysis
 * - Retrieval Quality Metrics
 * - User Experience Analytics
 * - System Performance Monitoring
 * - Event Processing Pipeline
 * - KPI API Endpoints
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const KPI_BASE_URL = `${BASE_URL}/api/kpi`;

// Test configuration
const TEST_CONFIG = {
  sessionId: `test_session_${Date.now()}`,
  testQueries: ['laptop', 'wireless headphones', 'gaming chair'],
  testSKUs: ['B07VGRJDFY', 'B08N5WRWNW', 'B07ZPKN6YR']
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name} - ${details}`);
  }
  testResults.details.push({ name, passed, details });
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': TEST_CONFIG.sessionId,
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  
  const result = await makeRequest(`${KPI_BASE_URL}/health`);
  logTest('KPI Health Check', result.success && result.data.success);
  
  const serverHealth = await makeRequest(`${BASE_URL}/health`);
  logTest('Server Health Check', serverHealth.success);
}

async function testDataQualityEndpoints() {
  console.log('\n📊 Testing Data Quality Endpoints...');
  
  // Test completeness analysis
  const completeness = await makeRequest(`${KPI_BASE_URL}/data-quality/completeness`);
  logTest('Data Completeness Analysis', 
    completeness.success && completeness.data.success && 
    typeof completeness.data.data.completeness_percentage === 'number'
  );
  
  // Test normalization analysis
  const normalization = await makeRequest(`${KPI_BASE_URL}/data-quality/normalization`);
  logTest('Data Normalization Analysis', 
    normalization.success && normalization.data.success &&
    typeof normalization.data.data.normalization_percentage === 'number'
  );
  
  // Test attribute consistency
  const consistency = await makeRequest(`${KPI_BASE_URL}/data-quality/attribute-consistency/price`);
  logTest('Attribute Consistency Analysis', 
    consistency.success && consistency.data.success &&
    consistency.data.data.field_name === 'price'
  );
  
  // Test comprehensive report
  const report = await makeRequest(`${KPI_BASE_URL}/data-quality/report`);
  logTest('Data Quality Report', 
    report.success && report.data.success &&
    report.data.data.completeness && report.data.data.normalization
  );
}

async function testSystemPerformanceEndpoints() {
  console.log('\n⚡ Testing System Performance Endpoints...');
  
  // Test system health
  const health = await makeRequest(`${KPI_BASE_URL}/system/health`);
  logTest('System Health Status', 
    health.success && health.data.success &&
    ['healthy', 'warning', 'critical'].includes(health.data.data.overall_health)
  );
  
  // Test metrics collection
  const collect = await makeRequest(`${KPI_BASE_URL}/system/collect-metrics`, { method: 'POST' });
  logTest('System Metrics Collection', 
    collect.success && collect.data.success &&
    typeof collect.data.data.cpu_usage_percent === 'number'
  );
  
  // Test metrics retrieval
  const metrics = await makeRequest(`${KPI_BASE_URL}/system/metrics?type=system`);
  logTest('System Metrics Retrieval', 
    metrics.success && metrics.data.success &&
    Array.isArray(metrics.data.data)
  );
  
  // Test alerts
  const alerts = await makeRequest(`${KPI_BASE_URL}/system/alerts`);
  logTest('System Alerts', 
    alerts.success && alerts.data.success &&
    Array.isArray(alerts.data.data)
  );
}

async function testUserExperienceEndpoints() {
  console.log('\n👥 Testing User Experience Endpoints...');
  
  // Test search success rate
  const searchSuccess = await makeRequest(`${KPI_BASE_URL}/user-experience/search-success-rate?hours=1`);
  logTest('Search Success Rate', 
    searchSuccess.success && searchSuccess.data.success &&
    typeof searchSuccess.data.data.success_rate_percentage === 'number'
  );
  
  // Test click-through rate
  const ctr = await makeRequest(`${KPI_BASE_URL}/user-experience/click-through-rate?hours=1`);
  logTest('Click-Through Rate', 
    ctr.success && ctr.data.success &&
    Array.isArray(ctr.data.data)
  );
  
  // Test satisfaction recording
  const satisfaction = await makeRequest(`${KPI_BASE_URL}/user-experience/satisfaction`, {
    method: 'POST',
    body: JSON.stringify({
      session_id: TEST_CONFIG.sessionId,
      satisfaction_rating: 4,
      task_type: 'search',
      feedback_text: 'Test feedback'
    })
  });
  logTest('User Satisfaction Recording', 
    satisfaction.success && satisfaction.data.success
  );
  
  // Test query refinement patterns
  const patterns = await makeRequest(`${KPI_BASE_URL}/user-experience/query-refinement-patterns/${TEST_CONFIG.sessionId}`);
  logTest('Query Refinement Patterns', 
    patterns.success && patterns.data.success &&
    Array.isArray(patterns.data.data)
  );
}

async function testRetrievalQualityEndpoints() {
  console.log('\n🎯 Testing Retrieval Quality Endpoints...');
  
  // Test query performance
  const performance = await makeRequest(`${KPI_BASE_URL}/retrieval/query-performance?hours=1`);
  logTest('Query Performance Analysis', 
    performance.success && performance.data.success &&
    Array.isArray(performance.data.data)
  );
  
  // Test relevance judgment
  const judgment = await makeRequest(`${KPI_BASE_URL}/retrieval/relevance-judgment`, {
    method: 'POST',
    body: JSON.stringify({
      query: 'test query',
      result_id: 'test_result_123',
      relevance_score: 4,
      judged_by: 'test_system'
    })
  });
  logTest('Relevance Judgment', 
    judgment.success && judgment.data.success
  );
  
  // Test search evaluation
  const evaluation = await makeRequest(`${KPI_BASE_URL}/retrieval/evaluate-search`, {
    method: 'POST',
    body: JSON.stringify({
      query: 'laptop',
      results: [
        { id: 'result1', sku: 'SKU1', name: 'Test Laptop 1' },
        { id: 'result2', sku: 'SKU2', name: 'Test Laptop 2' }
      ],
      ground_truth_relevant: ['result1'],
      session_id: TEST_CONFIG.sessionId,
      response_time_ms: 150
    })
  });
  logTest('Search Results Evaluation', 
    evaluation.success && evaluation.data.success &&
    typeof evaluation.data.data.mean_reciprocal_rank === 'number'
  );
}

async function testEventCollection() {
  console.log('\n📝 Testing Event Collection...');
  
  // Test search event
  const searchEvent = await makeRequest(`${KPI_BASE_URL}/events/search`, {
    method: 'POST',
    body: JSON.stringify({
      query: 'test laptop',
      results_count: 5,
      response_time_ms: 150,
      session_id: TEST_CONFIG.sessionId,
      search_type: 'basic'
    })
  });
  logTest('Search Event Collection', 
    searchEvent.success && searchEvent.data.success
  );
  
  // Test generation event
  const generationEvent = await makeRequest(`${KPI_BASE_URL}/events/generation`, {
    method: 'POST',
    body: JSON.stringify({
      sku: 'TEST_SKU_123',
      content_type: 'description',
      quality_score: 0.85,
      generation_time_ms: 2500,
      ai_model: 'test-model',
      session_id: TEST_CONFIG.sessionId
    })
  });
  logTest('Generation Event Collection', 
    generationEvent.success && generationEvent.data.success
  );
  
  // Test user interaction event
  const interactionEvent = await makeRequest(`${KPI_BASE_URL}/events/user-interaction`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'click',
      element: 'search_result',
      page: 'search_page',
      session_id: TEST_CONFIG.sessionId,
      time_on_page_ms: 30000
    })
  });
  logTest('User Interaction Event Collection', 
    interactionEvent.success && interactionEvent.data.success
  );
}

async function testRealTimeAnalytics() {
  console.log('\n⚡ Testing Real-Time Analytics...');
  
  // Test real-time metrics
  const realTimeMetrics = await makeRequest(`${KPI_BASE_URL}/real-time/metrics`);
  logTest('Real-Time Metrics', 
    realTimeMetrics.success && realTimeMetrics.data.success &&
    Array.isArray(realTimeMetrics.data.data)
  );
  
  // Test processing stats
  const processingStats = await makeRequest(`${KPI_BASE_URL}/real-time/processing-stats`);
  logTest('Processing Statistics', 
    processingStats.success && processingStats.data.success &&
    typeof processingStats.data.data.events_processed === 'number'
  );
}

async function testSessionManagement() {
  console.log('\n🔑 Testing Session Management...');
  
  // Test session generation
  const sessionGen = await makeRequest(`${KPI_BASE_URL}/session/generate`);
  logTest('Session ID Generation', 
    sessionGen.success && sessionGen.data.success &&
    sessionGen.data.data.session_id.startsWith('session_')
  );
  
  // Test session events retrieval
  const sessionEvents = await makeRequest(`${KPI_BASE_URL}/events/session/${TEST_CONFIG.sessionId}`);
  logTest('Session Events Retrieval', 
    sessionEvents.success && sessionEvents.data.success &&
    Array.isArray(sessionEvents.data.data)
  );
}

async function testIntegrationWithMainAPI() {
  console.log('\n🔗 Testing Integration with Main API...');
  
  // Test search with KPI tracking
  const searchResult = await makeRequest(`${BASE_URL}/api/search-products?q=laptop&limit=5`, {
    headers: { 'x-session-id': TEST_CONFIG.sessionId }
  });
  logTest('Search API with KPI Tracking', 
    searchResult.success && searchResult.data.success &&
    Array.isArray(searchResult.data.products)
  );
  
  // Wait a moment for KPI processing
  await sleep(1000);
  
  // Test generation with KPI tracking
  if (searchResult.success && searchResult.data.products.length > 0) {
    const sku = searchResult.data.products[0].sku;
    const generationResult = await makeRequest(`${BASE_URL}/api/generate-with-rag`, {
      method: 'POST',
      headers: { 'x-session-id': TEST_CONFIG.sessionId },
      body: JSON.stringify({
        sku: sku,
        content_type: 'description'
      })
    });
    logTest('Generation API with KPI Tracking', 
      generationResult.success && generationResult.data.success
    );
  }
}

async function testDashboardDataIntegration() {
  console.log('\n📊 Testing Dashboard Data Integration...');
  
  // Test legacy KPI endpoint (for backward compatibility)
  const legacyKPIs = await makeRequest(`${BASE_URL}/api/kpis`);
  logTest('Legacy KPI Endpoint', 
    legacyKPIs.success && legacyKPIs.data.success
  );
  
  // Test that new endpoints provide data for dashboard
  const [dataQuality, systemHealth, userExperience] = await Promise.all([
    makeRequest(`${KPI_BASE_URL}/data-quality/report`),
    makeRequest(`${KPI_BASE_URL}/system/health`),
    makeRequest(`${KPI_BASE_URL}/user-experience/search-success-rate`)
  ]);
  
  logTest('Dashboard Data Integration', 
    dataQuality.success && systemHealth.success && userExperience.success
  );
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  // Test invalid endpoint
  const invalidEndpoint = await makeRequest(`${KPI_BASE_URL}/invalid-endpoint`);
  logTest('Invalid Endpoint Handling', 
    !invalidEndpoint.success || invalidEndpoint.status === 404
  );
  
  // Test invalid data
  const invalidData = await makeRequest(`${KPI_BASE_URL}/events/search`, {
    method: 'POST',
    body: JSON.stringify({
      // Missing required fields
      query: 'test'
    })
  });
  logTest('Invalid Data Handling', 
    !invalidData.success || invalidData.status === 400
  );
  
  // Test malformed JSON
  const malformedJSON = await makeRequest(`${KPI_BASE_URL}/events/search`, {
    method: 'POST',
    body: 'invalid json'
  });
  logTest('Malformed JSON Handling', 
    !malformedJSON.success || malformedJSON.status >= 400
  );
}

async function runPerformanceTests() {
  console.log('\n⚡ Running Performance Tests...');
  
  // Test concurrent requests
  const concurrentRequests = Array(10).fill().map(() => 
    makeRequest(`${KPI_BASE_URL}/system/health`)
  );
  
  const startTime = Date.now();
  const results = await Promise.all(concurrentRequests);
  const endTime = Date.now();
  
  const allSuccessful = results.every(r => r.success);
  const avgResponseTime = (endTime - startTime) / 10;
  
  logTest('Concurrent Requests Performance', 
    allSuccessful && avgResponseTime < 1000,
    `Avg response time: ${avgResponseTime}ms`
  );
  
  // Test event processing throughput
  const eventRequests = Array(20).fill().map((_, i) => 
    makeRequest(`${KPI_BASE_URL}/events/user-interaction`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'test_action',
        element: `test_element_${i}`,
        page: 'test_page',
        session_id: TEST_CONFIG.sessionId
      })
    })
  );
  
  const eventStartTime = Date.now();
  const eventResults = await Promise.all(eventRequests);
  const eventEndTime = Date.now();
  
  const eventsSuccessful = eventResults.every(r => r.success);
  const eventThroughput = 20 / ((eventEndTime - eventStartTime) / 1000);
  
  logTest('Event Processing Throughput', 
    eventsSuccessful && eventThroughput > 5,
    `Throughput: ${eventThroughput.toFixed(2)} events/sec`
  );
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive KPI System Test');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  try {
    await testHealthCheck();
    await testDataQualityEndpoints();
    await testSystemPerformanceEndpoints();
    await testUserExperienceEndpoints();
    await testRetrievalQualityEndpoints();
    await testEventCollection();
    await testRealTimeAnalytics();
    await testSessionManagement();
    await testIntegrationWithMainAPI();
    await testDashboardDataIntegration();
    await testErrorHandling();
    await runPerformanceTests();
    
  } catch (error) {
    console.error('\n❌ Test execution error:', error);
    testResults.failed++;
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Print results
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.total}`);
  console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   • ${test.name}${test.details ? ` - ${test.details}` : ''}`);
      });
  }
  
  console.log('\n🎯 KPI SYSTEM HEALTH CHECK:');
  const healthScore = (testResults.passed / testResults.total) * 100;
  if (healthScore >= 90) {
    console.log('🟢 EXCELLENT - KPI system is fully operational');
  } else if (healthScore >= 75) {
    console.log('🟡 GOOD - KPI system is mostly operational with minor issues');
  } else if (healthScore >= 50) {
    console.log('🟠 WARNING - KPI system has significant issues');
  } else {
    console.log('🔴 CRITICAL - KPI system requires immediate attention');
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Review any failed tests and fix underlying issues');
  console.log('2. Monitor KPI dashboard at http://localhost:3000/kpis');
  console.log('3. Check system performance metrics regularly');
  console.log('4. Verify data quality scores meet business requirements');
  console.log('5. Ensure user experience metrics are within acceptable ranges');
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});