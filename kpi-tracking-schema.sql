-- KPI Tracking System Database Schema
-- This schema supports comprehensive KPI tracking across Data Quality, User Experience, and Business Impact

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- KPI Events Table - Core event tracking
CREATE TABLE IF NOT EXISTS kpi_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('search', 'generation', 'review', 'data_quality', 'system_performance', 'user_interaction')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    source VARCHAR(50) NOT NULL DEFAULT 'api' CHECK (source IN ('api', 'dashboard', 'system', 'external')),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kpi_events_type ON kpi_events(type);
CREATE INDEX IF NOT EXISTS idx_kpi_events_timestamp ON kpi_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_kpi_events_session ON kpi_events(session_id);
CREATE INDEX IF NOT EXISTS idx_kpi_events_type_timestamp ON kpi_events(type, timestamp);

-- KPI Metrics Table - Time-series metrics storage
CREATE TABLE IF NOT EXISTS kpi_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    dimensions JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    aggregation_level VARCHAR(20) NOT NULL DEFAULT 'raw' CHECK (aggregation_level IN ('raw', 'minute', 'hour', 'day', 'week', 'month')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_name_timestamp ON kpi_metrics(metric_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_timestamp ON kpi_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_aggregation ON kpi_metrics(aggregation_level, timestamp);

-- Data Quality Metrics Table
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    total_products INTEGER NOT NULL,
    complete_products INTEGER NOT NULL,
    normalized_products INTEGER NOT NULL,
    quality_score DECIMAL(5,4) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 1),
    completeness_by_field JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_quality_timestamp ON data_quality_metrics(timestamp);

-- Search Quality Metrics Table
CREATE TABLE IF NOT EXISTS search_quality_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    query TEXT NOT NULL,
    results_count INTEGER NOT NULL,
    precision_at_k JSONB DEFAULT '{}', -- {1: 0.8, 5: 0.6, 10: 0.4}
    recall_at_k JSONB DEFAULT '{}',
    mrr DECIMAL(5,4),
    response_time_ms INTEGER NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_quality_timestamp ON search_quality_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_search_quality_session ON search_quality_metrics(session_id);

-- User Experience Metrics Table
CREATE TABLE IF NOT EXISTS user_experience_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    search_success_rate DECIMAL(5,4),
    time_to_first_click_ms INTEGER,
    click_through_rate DECIMAL(5,4),
    query_refinement_count INTEGER DEFAULT 0,
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_experience_timestamp ON user_experience_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_experience_session ON user_experience_metrics(session_id);

-- Business Impact Metrics Table
CREATE TABLE IF NOT EXISTS business_impact_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    conversion_rate DECIMAL(5,4),
    average_order_value DECIMAL(10,2),
    revenue_per_session DECIMAL(10,2),
    customer_lifetime_value DECIMAL(10,2),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_impact_timestamp ON business_impact_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_business_impact_session ON business_impact_metrics(session_id);

-- Alert Rules Table
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('greater_than', 'less_than', 'equals', 'not_equals')),
    threshold_value DECIMAL(15,6) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    time_window_minutes INTEGER NOT NULL DEFAULT 5,
    notification_channels TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert Instances Table
CREATE TABLE IF NOT EXISTS alert_instances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    current_value DECIMAL(15,6) NOT NULL,
    threshold_value DECIMAL(15,6) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'suppressed')),
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_instances_rule ON alert_instances(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_instances_status ON alert_instances(status);

-- KPI Dashboard Summary View
CREATE OR REPLACE VIEW kpi_dashboard_summary AS
SELECT 
    DATE_TRUNC('day', timestamp) as date,
    COUNT(*) FILTER (WHERE type = 'search') as total_searches,
    COUNT(*) FILTER (WHERE type = 'generation') as total_generations,
    COUNT(*) FILTER (WHERE type = 'review') as total_reviews,
    COUNT(*) FILTER (WHERE type = 'user_interaction') as total_interactions,
    
    -- Search success rate
    CASE 
        WHEN COUNT(*) FILTER (WHERE type = 'search') > 0 THEN
            COUNT(*) FILTER (WHERE type = 'search' AND (metadata->>'has_results')::boolean = true) * 100.0 / 
            COUNT(*) FILTER (WHERE type = 'search')
        ELSE 0
    END as search_success_rate,
    
    -- Average response time
    CASE 
        WHEN COUNT(*) FILTER (WHERE type = 'search') > 0 THEN
            AVG((metadata->>'response_time_ms')::numeric) FILTER (WHERE type = 'search')
        ELSE 0
    END as avg_response_time_ms,
    
    -- Average quality score
    CASE 
        WHEN COUNT(*) FILTER (WHERE type = 'generation') > 0 THEN
            AVG((metadata->>'quality_score')::numeric) FILTER (WHERE type = 'generation')
        ELSE 0
    END as avg_quality_score,
    
    -- Conversion rate
    CASE 
        WHEN COUNT(*) FILTER (WHERE type = 'search') > 0 THEN
            COUNT(*) FILTER (WHERE type = 'generation') * 100.0 / 
            COUNT(*) FILTER (WHERE type = 'search')
        ELSE 0
    END as conversion_rate
    
FROM kpi_events 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

-- Data Quality Trends View
CREATE OR REPLACE VIEW data_quality_trends AS
SELECT 
    DATE_TRUNC('day', timestamp) as date,
    AVG(quality_score) as avg_quality_score,
    AVG(complete_products * 100.0 / NULLIF(total_products, 0)) as completion_rate,
    AVG(normalized_products * 100.0 / NULLIF(total_products, 0)) as normalization_rate,
    MAX(total_products) as total_products
FROM data_quality_metrics
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

-- Search Performance View
CREATE OR REPLACE VIEW search_performance_summary AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    COUNT(*) as total_searches,
    AVG(response_time_ms) as avg_response_time_ms,
    AVG(results_count) as avg_results_count,
    AVG(mrr) as avg_mrr,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time_ms
FROM search_quality_metrics
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

-- Business Impact Summary View
CREATE OR REPLACE VIEW business_impact_summary AS
SELECT 
    DATE_TRUNC('day', timestamp) as date,
    AVG(conversion_rate) as avg_conversion_rate,
    AVG(average_order_value) as avg_order_value,
    AVG(revenue_per_session) as avg_revenue_per_session,
    SUM(revenue_per_session) as total_revenue,
    COUNT(DISTINCT session_id) as unique_sessions
FROM business_impact_metrics
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY date DESC;

-- Data retention policies (automatically delete old data)
CREATE OR REPLACE FUNCTION cleanup_old_kpi_data() RETURNS void AS $$
BEGIN
    -- Keep raw events for 90 days
    DELETE FROM kpi_events WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Keep detailed metrics for 1 year
    DELETE FROM kpi_metrics WHERE created_at < NOW() - INTERVAL '1 year' AND aggregation_level = 'raw';
    
    -- Keep aggregated metrics for 2 years
    DELETE FROM kpi_metrics WHERE created_at < NOW() - INTERVAL '2 years' AND aggregation_level IN ('minute', 'hour');
    
    -- Keep daily/weekly/monthly aggregates indefinitely
    
    -- Clean up resolved alerts older than 30 days
    DELETE FROM alert_instances WHERE status = 'resolved' AND resolved_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run daily
-- Note: This requires pg_cron extension or external scheduler
-- SELECT cron.schedule('cleanup-kpi-data', '0 2 * * *', 'SELECT cleanup_old_kpi_data();');

-- Comments for documentation
COMMENT ON TABLE kpi_events IS 'Core event tracking table for all KPI-related activities';
COMMENT ON TABLE kpi_metrics IS 'Time-series metrics storage with multiple aggregation levels';
COMMENT ON TABLE data_quality_metrics IS 'Product data quality metrics over time';
COMMENT ON TABLE search_quality_metrics IS 'Search performance and quality measurements';
COMMENT ON TABLE user_experience_metrics IS 'User interaction and satisfaction metrics';
COMMENT ON TABLE business_impact_metrics IS 'Business KPIs including conversion and revenue';
COMMENT ON TABLE alert_rules IS 'Configuration for automated alerting system';
COMMENT ON TABLE alert_instances IS 'Active and historical alert instances';

-- Enable Row Level Security (optional - configure based on your needs)
ALTER TABLE kpi_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experience_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_instances ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust based on your authentication system)
CREATE POLICY "Allow authenticated users full access" ON kpi_events FOR ALL USING (true);
CREATE POLICY "Allow authenticated users full access" ON kpi_metrics FOR ALL USING (true);
CREATE POLICY "Allow authenticated users full access" ON data_quality_metrics FOR ALL USING (true);
CREATE POLICY "Allow authenticated users full access" ON search_quality_metrics FOR ALL USING (true);
CREATE POLICY "Allow authenticated users full access" ON user_experience_metrics FOR ALL USING (true);
CREATE POLICY "Allow authenticated users full access" ON business_impact_metrics FOR ALL USING (true);
CREATE POLICY "Allow authenticated users full access" ON alert_rules FOR ALL USING (true);
CREATE POLICY "Allow authenticated users full access" ON alert_instances FOR ALL USING (true);