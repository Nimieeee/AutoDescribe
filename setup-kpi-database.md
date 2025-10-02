# KPI Database Setup Guide

## Option 1: Supabase SQL Editor (Recommended)

1. **Open your Supabase project dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the contents of `kpi-system-schema-supabase.sql`**
4. **Click "Run" to execute the schema**

## Option 2: Step-by-Step Manual Setup

If you encounter issues with the full schema, run these commands one by one in your Supabase SQL editor:

### Step 1: Create Core KPI Events Table
```sql
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
```

### Step 2: Create Data Quality Tables
```sql
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
```

### Step 3: Create System Performance Tables
```sql
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
```

### Step 4: Create User Experience Tables
```sql
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
```

### Step 5: Create Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_kpi_events_type ON kpi_events(type);
CREATE INDEX IF NOT EXISTS idx_kpi_events_timestamp ON kpi_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_kpi_events_session_id ON kpi_events(session_id);
CREATE INDEX IF NOT EXISTS idx_system_performance_metrics_timestamp ON system_performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_performance_metrics_timestamp ON api_performance_metrics(timestamp);
```

### Step 6: Enable RLS and Create Policies
```sql
ALTER TABLE kpi_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_success_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_satisfaction_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON kpi_events
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON data_quality_metrics
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON system_performance_metrics
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON api_performance_metrics
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON search_success_metrics
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Allow all for authenticated users" ON user_satisfaction_scores
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
```

## Verification

After running the schema, verify it worked by running:

```sql
SELECT 'KPI Events table created' as status, count(*) as count FROM kpi_events;
SELECT 'Data Quality Metrics table created' as status, count(*) as count FROM data_quality_metrics;
SELECT 'System Performance Metrics table created' as status, count(*) as count FROM system_performance_metrics;
```

## Troubleshooting

If you get errors:

1. **"relation already exists"** - This is normal, the `IF NOT EXISTS` clause handles this
2. **"permission denied"** - Make sure you're running this as the database owner in Supabase
3. **"syntax error"** - Try running the commands one section at a time

## Testing the Setup

Once the schema is installed, you can test the KPI system:

```bash
# Run the comprehensive test
node test-kpi-system-complete.js

# Or start the server and check the KPI dashboard
npm run dev
# Then visit: http://localhost:3000/kpis
```

## Next Steps

1. **Start the backend server** with KPI monitoring enabled
2. **Access the KPI dashboard** at `/kpis` (password: `atdb-465@`)
3. **Monitor system performance** in real-time
4. **Generate some test data** by using the search and generation features
5. **Watch the KPIs update** as you use the system