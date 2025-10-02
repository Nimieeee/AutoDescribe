-- Verify KPI table setup
-- Run this in Supabase SQL Editor to check everything is working

-- Check if kpi_events table exists and is accessible
SELECT 'kpi_events table exists' as status;
SELECT COUNT(*) as initial_count FROM kpi_events;

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'kpi_events' 
ORDER BY ordinal_position;

-- Test inserting a sample KPI event
INSERT INTO kpi_events (type, session_id, source, metadata) 
VALUES ('search', 'test_session_123', 'api', '{"query": "test search", "results_count": 5}');

-- Verify the insert worked
SELECT * FROM kpi_events ORDER BY created_at DESC LIMIT 1;

-- Check total count
SELECT COUNT(*) as total_events FROM kpi_events;