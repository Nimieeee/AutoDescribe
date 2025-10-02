-- Minimal KPI table creation for Supabase
-- Copy and paste this into your Supabase SQL Editor and run it

-- Create the main KPI events table
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

-- Create basic indexes
CREATE INDEX idx_kpi_events_type ON kpi_events(type);
CREATE INDEX idx_kpi_events_timestamp ON kpi_events(timestamp);
CREATE INDEX idx_kpi_events_session_id ON kpi_events(session_id);

-- Enable RLS
ALTER TABLE kpi_events ENABLE ROW LEVEL SECURITY;

-- Create policy for access
CREATE POLICY "Allow all operations" ON kpi_events
  FOR ALL USING (true);

-- Verify table was created
SELECT 'kpi_events table created successfully' as status;
SELECT COUNT(*) as initial_count FROM kpi_events;