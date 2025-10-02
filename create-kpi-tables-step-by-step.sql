-- Step-by-step KPI table creation for Supabase
-- Run each section separately in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: Create main KPI events table
-- ============================================================================
CREATE TABLE kpi_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL,
  user_id TEXT,
  source TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Create system performance metrics table
-- ============================================================================
CREATE TABLE system_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cpu_usage_percent DECIMAL(5,2) NOT NULL,
  memory_usage_percent DECIMAL(5,2) NOT NULL,
  memory_used_mb DECIMAL(10,2) NOT NULL,
  memory_total_mb DECIMAL(10,2) NOT NULL,
  uptime_seconds BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Create API performance metrics table
-- ============================================================================
CREATE TABLE api_performance_metrics (
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

-- ============================================================================
-- STEP 4: Create data quality metrics table
-- ============================================================================
CREATE TABLE data_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_products INTEGER NOT NULL,
  complete_products INTEGER NOT NULL,
  completeness_percentage DECIMAL(5,2) NOT NULL,
  completeness_by_field JSONB NOT NULL DEFAULT '{}',
  quality_score DECIMAL(5,2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 5: Create search success metrics table
-- ============================================================================
CREATE TABLE search_success_metrics (
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

-- ============================================================================
-- STEP 6: Create processed events table
-- ============================================================================
CREATE TABLE processed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_event_id UUID,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processing_time_ms INTEGER NOT NULL,
  enrichments JSONB NOT NULL DEFAULT '{}',
  aggregations_updated JSONB NOT NULL DEFAULT '[]',
  alerts_triggered JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 7: Create indexes
-- ============================================================================
CREATE INDEX idx_kpi_events_type ON kpi_events(type);
CREATE INDEX idx_kpi_events_timestamp ON kpi_events(timestamp);
CREATE INDEX idx_kpi_events_session_id ON kpi_events(session_id);
CREATE INDEX idx_system_performance_timestamp ON system_performance_metrics(timestamp);
CREATE INDEX idx_api_performance_timestamp ON api_performance_metrics(timestamp);
CREATE INDEX idx_data_quality_timestamp ON data_quality_metrics(timestamp);
CREATE INDEX idx_search_success_timestamp ON search_success_metrics(timestamp);

-- ============================================================================
-- STEP 8: Enable RLS and create policies
-- ============================================================================
ALTER TABLE kpi_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_success_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_events ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now)
CREATE POLICY "Allow all operations" ON kpi_events FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON system_performance_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON api_performance_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON data_quality_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON search_success_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON processed_events FOR ALL USING (true);

-- ============================================================================
-- STEP 9: Verify tables were created
-- ============================================================================
SELECT 'kpi_events' as table_name, COUNT(*) as count FROM kpi_events
UNION ALL
SELECT 'system_performance_metrics' as table_name, COUNT(*) as count FROM system_performance_metrics
UNION ALL
SELECT 'api_performance_metrics' as table_name, COUNT(*) as count FROM api_performance_metrics
UNION ALL
SELECT 'data_quality_metrics' as table_name, COUNT(*) as count FROM data_quality_metrics
UNION ALL
SELECT 'search_success_metrics' as table_name, COUNT(*) as count FROM search_success_metrics
UNION ALL
SELECT 'processed_events' as table_name, COUNT(*) as count FROM processed_events;