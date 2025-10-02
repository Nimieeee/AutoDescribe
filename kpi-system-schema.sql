-- KPI Tracking System Database Schema
-- This schema extends the existing AutoDescribe database with KPI tracking tables

-- ============================================================================
-- CORE KPI EVENT TABLES
-- ============================================================================

-- Main KPI events table (already exists in kpi-tracking-schema.sql)
-- CREATE TABLE IF NOT EXISTS kpi_events (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   type VARCHAR(50) NOT NULL CHECK (type IN ('search', 'generation', 'review', 'data_quality', 'system_performance', 'user_interaction')),
--   timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   session_id VARCHAR(255) NOT NULL,
--   user_id VARCHAR(255),
--   source VARCHAR(50) NOT NULL CHECK (source IN ('api', 'dashboard', 'system', 'external')),
--   metadata JSONB NOT NULL DEFAULT '{}',
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- ============================================================================
-- DATA QUALITY METRICS TABLES
-- ============================================================================

-- Product data completeness metrics
CREATE TABLE IF NOT EXISTS data_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_products INTEGER NOT NULL,
  complete_products INTEGER NOT NULL,
  completeness_percentage DECIMAL(5,2) NOT NULL,
  completeness_by_field JSONB NOT NULL DEFAULT '{}',
  quality_score DECIMAL(5,2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data normalization metrics
CREATE TABLE IF NOT EXISTS data_normalization_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_products INTEGER NOT NULL,
  normalized_products INTEGER NOT NULL,
  normalization_percentage DECIMAL(5,2) NOT NULL,
  normalization_by_field JSONB NOT NULL DEFAULT '{}',
  consistency_score DECIMAL(5,2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attribute consistency analysis
CREATE TABLE IF NOT EXISTS attribute_consistency_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name VARCHAR(100) NOT NULL,
  total_values INTEGER NOT NULL,
  consistent_values INTEGER NOT NULL,
  consistency_percentage DECIMAL(5,2) NOT NULL,
  common_formats JSONB NOT NULL DEFAULT '[]',
  inconsistent_examples JSONB NOT NULL DEFAULT '[]',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RETRIEVAL QUALITY METRICS TABLES
-- ============================================================================

-- Retrieval quality metrics for search queries
CREATE TABLE IF NOT EXISTS retrieval_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  total_results INTEGER NOT NULL,
  precision_at_k JSONB NOT NULL DEFAULT '{}', -- {1: 0.8, 5: 0.6, 10: 0.4}
  recall_at_k JSONB NOT NULL DEFAULT '{}',
  mean_reciprocal_rank DECIMAL(5,4) NOT NULL DEFAULT 0,
  average_precision DECIMAL(5,4) NOT NULL DEFAULT 0,
  ndcg_at_k JSONB NOT NULL DEFAULT '{}',
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  session_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relevance judgments for query-result pairs
CREATE TABLE IF NOT EXISTS relevance_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  result_id VARCHAR(255) NOT NULL,
  relevance_score INTEGER NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 4),
  judged_by VARCHAR(255),
  judged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(query, result_id)
);

-- ============================================================================
-- USER EXPERIENCE METRICS TABLES
-- ============================================================================

-- Search success metrics
CREATE TABLE IF NOT EXISTS search_success_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  total_results INTEGER NOT NULL,
  clicked_results INTEGER NOT NULL DEFAULT 0,
  time_to_first_click_ms INTEGER,
  query_refinements INTEGER NOT NULL DEFAULT 0,
  success_indicators JSONB NOT NULL DEFAULT '{}',
  success_score DECIMAL(3,2) NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Click-through rate metrics
CREATE TABLE IF NOT EXISTS click_through_rate_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  total_searches INTEGER NOT NULL,
  searches_with_clicks INTEGER NOT NULL,
  total_results_shown INTEGER NOT NULL,
  total_clicks INTEGER NOT NULL,
  ctr_percentage DECIMAL(5,2) NOT NULL,
  avg_click_position DECIMAL(5,2) NOT NULL DEFAULT 0,
  time_period VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Query refinement patterns
CREATE TABLE IF NOT EXISTS query_refinement_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_query TEXT NOT NULL,
  refined_query TEXT NOT NULL,
  refinement_type VARCHAR(50) NOT NULL CHECK (refinement_type IN ('addition', 'removal', 'replacement', 'spelling')),
  time_between_queries_ms INTEGER NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  success_after_refinement BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User satisfaction scores
CREATE TABLE IF NOT EXISTS user_satisfaction_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  satisfaction_rating INTEGER NOT NULL CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback_text TEXT,
  completion_rate DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('search', 'generation', 'review')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM PERFORMANCE METRICS TABLES
-- ============================================================================

-- System performance metrics
CREATE TABLE IF NOT EXISTS system_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cpu_usage_percent DECIMAL(5,2) NOT NULL,
  memory_usage_percent DECIMAL(5,2) NOT NULL,
  memory_used_mb DECIMAL(10,2) NOT NULL,
  memory_total_mb DECIMAL(10,2) NOT NULL,
  disk_usage_percent DECIMAL(5,2),
  network_connections INTEGER,
  uptime_seconds BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API performance metrics
CREATE TABLE IF NOT EXISTS api_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  error_message TEXT,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Database performance metrics
CREATE TABLE IF NOT EXISTS database_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_type VARCHAR(20) NOT NULL CHECK (query_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  execution_time_ms INTEGER NOT NULL,
  rows_affected INTEGER NOT NULL,
  table_name VARCHAR(100),
  query_hash VARCHAR(64),
  error_message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance alerts
CREATE TABLE IF NOT EXISTS performance_alerts (
  id VARCHAR(255) PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('cpu_high', 'memory_high', 'api_slow', 'error_rate_high', 'database_slow')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('warning', 'critical')),
  message TEXT NOT NULL,
  current_value DECIMAL(10,2) NOT NULL,
  threshold_value DECIMAL(10,2) NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- EVENT PROCESSING PIPELINE TABLES
-- ============================================================================

-- Processed events tracking
CREATE TABLE IF NOT EXISTS processed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_event_id UUID,
  event_type VARCHAR(50) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_time_ms INTEGER NOT NULL,
  enrichments JSONB NOT NULL DEFAULT '{}',
  aggregations_updated JSONB NOT NULL DEFAULT '[]',
  alerts_triggered JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(20) NOT NULL CHECK (status IN ('processed', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event aggregations for time-series analysis
CREATE TABLE IF NOT EXISTS event_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  aggregation_type VARCHAR(20) NOT NULL CHECK (aggregation_type IN ('sum', 'count', 'avg', 'min', 'max', 'percentile')),
  time_window VARCHAR(20) NOT NULL CHECK (time_window IN ('minute', 'hour', 'day', 'week', 'month')),
  dimensions JSONB NOT NULL DEFAULT '{}',
  value DECIMAL(15,4) NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(metric_name, aggregation_type, time_window, dimensions, window_start)
);

-- Real-time metrics cache
CREATE TABLE IF NOT EXISTS real_time_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL UNIQUE,
  current_value DECIMAL(15,4) NOT NULL,
  previous_value DECIMAL(15,4) NOT NULL DEFAULT 0,
  change_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
  trend VARCHAR(10) NOT NULL DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_window_minutes INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- BUSINESS IMPACT METRICS TABLES
-- ============================================================================

-- Business impact metrics (for future implementation)
CREATE TABLE IF NOT EXISTS business_impact_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  conversion_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  average_order_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  revenue_per_session DECIMAL(10,2) NOT NULL DEFAULT 0,
  customer_lifetime_value DECIMAL(10,2),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- KPI Events indexes
CREATE INDEX IF NOT EXISTS idx_kpi_events_type ON kpi_events(type);
CREATE INDEX IF NOT EXISTS idx_kpi_events_timestamp ON kpi_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_kpi_events_session_id ON kpi_events(session_id);
CREATE INDEX IF NOT EXISTS idx_kpi_events_source ON kpi_events(source);

-- Data Quality indexes
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_timestamp ON data_quality_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_data_normalization_metrics_timestamp ON data_normalization_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_attribute_consistency_metrics_field ON attribute_consistency_metrics(field_name);

-- Retrieval Quality indexes
CREATE INDEX IF NOT EXISTS idx_retrieval_quality_metrics_query ON retrieval_quality_metrics(query);
CREATE INDEX IF NOT EXISTS idx_retrieval_quality_metrics_timestamp ON retrieval_quality_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_retrieval_quality_metrics_session ON retrieval_quality_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_relevance_judgments_query ON relevance_judgments(query);

-- User Experience indexes
CREATE INDEX IF NOT EXISTS idx_search_success_metrics_query ON search_success_metrics(query);
CREATE INDEX IF NOT EXISTS idx_search_success_metrics_session ON search_success_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_search_success_metrics_timestamp ON search_success_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_query_refinement_patterns_session ON query_refinement_patterns(session_id);
CREATE INDEX IF NOT EXISTS idx_user_satisfaction_scores_session ON user_satisfaction_scores(session_id);

-- System Performance indexes
CREATE INDEX IF NOT EXISTS idx_system_performance_metrics_timestamp ON system_performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_performance_metrics_endpoint ON api_performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_performance_metrics_timestamp ON api_performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_database_performance_metrics_timestamp ON database_performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_status ON performance_alerts(status);

-- Event Processing indexes
CREATE INDEX IF NOT EXISTS idx_processed_events_event_type ON processed_events(event_type);
CREATE INDEX IF NOT EXISTS idx_processed_events_processed_at ON processed_events(processed_at);
CREATE INDEX IF NOT EXISTS idx_event_aggregations_metric_time ON event_aggregations(metric_name, time_window, window_start);
CREATE INDEX IF NOT EXISTS idx_real_time_metrics_name ON real_time_metrics(metric_name);

-- Business Impact indexes
CREATE INDEX IF NOT EXISTS idx_business_impact_metrics_session ON business_impact_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_business_impact_metrics_timestamp ON business_impact_metrics(timestamp);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Overall system health view
CREATE OR REPLACE VIEW system_health_summary AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  AVG(cpu_usage_percent) as avg_cpu_usage,
  AVG(memory_usage_percent) as avg_memory_usage,
  COUNT(*) as measurement_count
FROM system_performance_metrics 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

-- Search performance summary view
CREATE OR REPLACE VIEW search_performance_summary AS
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as total_searches,
  AVG(success_score) as avg_success_score,
  AVG(time_to_first_click_ms) as avg_time_to_click,
  COUNT(CASE WHEN success_score >= 0.6 THEN 1 END) as successful_searches
FROM search_success_metrics 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

-- Data quality trend view
CREATE OR REPLACE VIEW data_quality_trend AS
SELECT 
  DATE_TRUNC('day', timestamp) as day,
  AVG(completeness_percentage) as avg_completeness,
  AVG(quality_score) as avg_quality_score,
  COUNT(*) as measurement_count
FROM data_quality_metrics 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY day DESC;

-- API performance summary view
CREATE OR REPLACE VIEW api_performance_summary AS
SELECT 
  endpoint,
  method,
  COUNT(*) as request_count,
  AVG(response_time_ms) as avg_response_time,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
  COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
  (COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*)) as error_rate
FROM api_performance_metrics 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint, method
ORDER BY request_count DESC;

-- ============================================================================
-- FUNCTIONS FOR KPI CALCULATIONS
-- ============================================================================

-- Function to calculate search success rate
CREATE OR REPLACE FUNCTION calculate_search_success_rate(
  start_time TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
  end_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_searches INTEGER;
  successful_searches INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_searches
  FROM search_success_metrics 
  WHERE timestamp BETWEEN start_time AND end_time;
  
  SELECT COUNT(*) INTO successful_searches
  FROM search_success_metrics 
  WHERE timestamp BETWEEN start_time AND end_time
    AND success_score >= 0.6;
  
  IF total_searches = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (successful_searches * 100.0 / total_searches);
END;
$$ LANGUAGE plpgsql;

-- Function to get system health score
CREATE OR REPLACE FUNCTION get_system_health_score(
  lookback_minutes INTEGER DEFAULT 60
) RETURNS JSONB AS $$
DECLARE
  avg_cpu DECIMAL(5,2);
  avg_memory DECIMAL(5,2);
  error_rate DECIMAL(5,2);
  health_score INTEGER;
  status TEXT;
BEGIN
  -- Get average CPU and memory usage
  SELECT AVG(cpu_usage_percent), AVG(memory_usage_percent)
  INTO avg_cpu, avg_memory
  FROM system_performance_metrics 
  WHERE timestamp >= NOW() - (lookback_minutes || ' minutes')::INTERVAL;
  
  -- Get API error rate
  SELECT 
    COALESCE(
      COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0),
      0
    )
  INTO error_rate
  FROM api_performance_metrics 
  WHERE timestamp >= NOW() - (lookback_minutes || ' minutes')::INTERVAL;
  
  -- Calculate health score
  health_score := 100;
  
  IF avg_cpu > 85 THEN health_score := health_score - 30;
  ELSIF avg_cpu > 70 THEN health_score := health_score - 15;
  END IF;
  
  IF avg_memory > 90 THEN health_score := health_score - 30;
  ELSIF avg_memory > 80 THEN health_score := health_score - 15;
  END IF;
  
  IF error_rate > 10 THEN health_score := health_score - 25;
  ELSIF error_rate > 5 THEN health_score := health_score - 10;
  END IF;
  
  -- Determine status
  IF health_score >= 85 THEN status := 'healthy';
  ELSIF health_score >= 70 THEN status := 'warning';
  ELSE status := 'critical';
  END IF;
  
  RETURN jsonb_build_object(
    'health_score', health_score,
    'status', status,
    'avg_cpu_usage', COALESCE(avg_cpu, 0),
    'avg_memory_usage', COALESCE(avg_memory, 0),
    'error_rate', COALESCE(error_rate, 0)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CLEANUP PROCEDURES
-- ============================================================================

-- Function to clean up old metrics data
CREATE OR REPLACE FUNCTION cleanup_old_metrics(
  retention_days INTEGER DEFAULT 90
) RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;
  
  -- Clean up old KPI events
  DELETE FROM kpi_events WHERE created_at < cutoff_date;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up old performance metrics
  DELETE FROM system_performance_metrics WHERE created_at < cutoff_date;
  DELETE FROM api_performance_metrics WHERE created_at < cutoff_date;
  DELETE FROM database_performance_metrics WHERE created_at < cutoff_date;
  
  -- Clean up old processed events
  DELETE FROM processed_events WHERE created_at < cutoff_date;
  
  -- Clean up resolved alerts older than 30 days
  DELETE FROM performance_alerts 
  WHERE status = 'resolved' AND resolved_at < NOW() - INTERVAL '30 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA AND CONFIGURATION
-- ============================================================================

-- Insert initial real-time metrics
INSERT INTO real_time_metrics (metric_name, current_value, previous_value) VALUES
  ('search_count', 0, 0),
  ('generation_count', 0, 0),
  ('user_interaction_count', 0, 0),
  ('system_cpu_usage', 0, 0),
  ('system_memory_usage', 0, 0)
ON CONFLICT (metric_name) DO NOTHING;

-- Create a scheduled job to clean up old data (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-kpi-metrics', '0 2 * * *', 'SELECT cleanup_old_metrics(90);');

COMMIT;