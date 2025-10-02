-- KPI Tracking System Schema for Supabase
-- Run this in your Supabase SQL editor

-- ============================================================================
-- CORE KPI EVENT TABLES
-- ============================================================================

-- Main KPI events table
CREATE TABLE IF NOT EXISTS kpi_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('search', 'generation', 'review', 'data_quality', 'system_performance', 'user_interaction')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL,
  user_id TEXT,
  source TEXT NOT NULL CHECK (source IN ('api', 'dashboard', 'system', 'external')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- ============================================================================
-- RETRIEVAL QUALITY METRICS TABLES
-- ============================================================================

-- Retrieval quality metrics for search queries
CREATE TABLE IF NOT EXISTS retrieval_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  total_results INTEGER NOT NULL,
  precision_at_k JSONB NOT NULL DEFAULT '{}',
  recall_at_k JSONB NOT NULL DEFAULT '{}',
  mean_reciprocal_rank DECIMAL(5,4) NOT NULL DEFAULT 0,
  average_precision DECIMAL(5,4) NOT NULL DEFAULT 0,
  ndcg_at_k JSONB NOT NULL DEFAULT '{}',
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relevance judgments for query-result pairs
CREATE TABLE IF NOT EXISTS relevance_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  result_id TEXT NOT NULL,
  relevance_score INTEGER NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 4),
  judged_by TEXT,
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
  session_id TEXT NOT NULL,
  total_results INTEGER NOT NULL,
  clicked_results INTEGER NOT NULL DEFAULT 0,
  time_to_first_click_ms INTEGER,
  query_refinements INTEGER NOT NULL DEFAULT 0,
  success_indicators JSONB NOT NULL DEFAULT '{}',
  success_score DECIMAL(3,2) NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Query refinement patterns
CREATE TABLE IF NOT EXISTS query_refinement_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_query TEXT NOT NULL,
  refined_query TEXT NOT NULL,
  refinement_type TEXT NOT NULL CHECK (refinement_type IN ('addition', 'removal', 'replacement', 'spelling')),
  time_between_queries_ms INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  success_after_refinement BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User satisfaction scores
CREATE TABLE IF NOT EXISTS user_satisfaction_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id TEXT,
  satisfaction_rating INTEGER NOT NULL CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback_text TEXT,
  completion_rate DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  task_type TEXT NOT NULL CHECK (task_type IN ('search', 'generation', 'review')),
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
  uptime_seconds BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API performance metrics
CREATE TABLE IF NOT EXISTS api_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  error_message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance alerts
CREATE TABLE IF NOT EXISTS performance_alerts (
  id TEXT PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('cpu_high', 'memory_high', 'api_slow', 'error_rate_high', 'database_slow')),
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  message TEXT NOT NULL,
  current_value DECIMAL(10,2) NOT NULL,
  threshold_value DECIMAL(10,2) NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- EVENT PROCESSING PIPELINE TABLES
-- ============================================================================

-- Processed events tracking
CREATE TABLE IF NOT EXISTS processed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_event_id UUID,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_time_ms INTEGER NOT NULL,
  enrichments JSONB NOT NULL DEFAULT '{}',
  aggregations_updated JSONB NOT NULL DEFAULT '[]',
  alerts_triggered JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('processed', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Real-time metrics cache
CREATE TABLE IF NOT EXISTS real_time_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL UNIQUE,
  current_value DECIMAL(15,4) NOT NULL,
  previous_value DECIMAL(15,4) NOT NULL DEFAULT 0,
  change_percent DECIMAL(8,2) NOT NULL DEFAULT 0,
  trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_window_minutes INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- KPI Events indexes
CREATE INDEX IF NOT EXISTS idx_kpi_events_type ON kpi_events(type);
CREATE INDEX IF NOT EXISTS idx_kpi_events_timestamp ON kpi_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_kpi_events_session_id ON kpi_events(session_id);

-- Data Quality indexes
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_timestamp ON data_quality_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_data_normalization_metrics_timestamp ON data_normalization_metrics(timestamp);

-- Retrieval Quality indexes
CREATE INDEX IF NOT EXISTS idx_retrieval_quality_metrics_query ON retrieval_quality_metrics(query);
CREATE INDEX IF NOT EXISTS idx_retrieval_quality_metrics_timestamp ON retrieval_quality_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_relevance_judgments_query ON relevance_judgments(query);

-- User Experience indexes
CREATE INDEX IF NOT EXISTS idx_search_success_metrics_session ON search_success_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_search_success_metrics_timestamp ON search_success_metrics(timestamp);

-- System Performance indexes
CREATE INDEX IF NOT EXISTS idx_system_performance_metrics_timestamp ON system_performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_performance_metrics_endpoint ON api_performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_performance_metrics_timestamp ON api_performance_metrics(timestamp);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE kpi_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_normalization_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrieval_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE relevance_judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_success_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_refinement_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_satisfaction_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access
CREATE POLICY "Allow all for authenticated users" ON kpi_events
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON data_quality_metrics
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON data_normalization_metrics
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON retrieval_quality_metrics
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON relevance_judgments
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON search_success_metrics
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON query_refinement_patterns
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON user_satisfaction_scores
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON system_performance_metrics
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON api_performance_metrics
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON performance_alerts
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON processed_events
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON real_time_metrics
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert initial real-time metrics
INSERT INTO real_time_metrics (metric_name, current_value, previous_value) VALUES
  ('search_count', 0, 0),
  ('generation_count', 0, 0),
  ('user_interaction_count', 0, 0),
  ('system_cpu_usage', 0, 0),
  ('system_memory_usage', 0, 0)
ON CONFLICT (metric_name) DO NOTHING;

-- Verify the setup
SELECT 'KPI Events table created' as status, count(*) as count FROM kpi_events;
SELECT 'Data Quality Metrics table created' as status, count(*) as count FROM data_quality_metrics;
SELECT 'System Performance Metrics table created' as status, count(*) as count FROM system_performance_metrics;
SELECT 'Real-time Metrics initialized' as status, count(*) as count FROM real_time_metrics;