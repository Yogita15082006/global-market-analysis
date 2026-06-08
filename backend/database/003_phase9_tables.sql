-- Phase 9 Institutional Terminal Tables

-- 1. Event Momentum Snapshots
CREATE TABLE IF NOT EXISTS event_momentum_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    relevance_score INTEGER NOT NULL,
    source_count INTEGER NOT NULL,
    confidence_score FLOAT,
    snapshot_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying historical momentum of an event
CREATE INDEX IF NOT EXISTS idx_momentum_event_time ON event_momentum_snapshots(event_id, snapshot_time);

-- 2. Daily Briefings
CREATE TABLE IF NOT EXISTS daily_briefings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_type VARCHAR(50) NOT NULL, -- morning, evening, weekly
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_briefings_type_date ON daily_briefings(brief_type, created_at);

-- 3. Watchlists
CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL DEFAULT 'demo-user',
    entity_type VARCHAR(50) NOT NULL, -- country, asset, event
    entity_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, entity_type, entity_name)
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);

-- 4. Intelligence Alerts
CREATE TABLE IF NOT EXISTS intelligence_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL DEFAULT 'demo-user',
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL, -- critical, high, medium
    message TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_unread ON intelligence_alerts(user_id, is_read);

-- 5. RPC Search logic for deep text search across events and analysis table
CREATE OR REPLACE FUNCTION search_events_deep(query_text text, max_limit int DEFAULT 50, row_offset int DEFAULT 0)
RETURNS TABLE (
    id BIGINT,
    title TEXT,
    description TEXT,
    source TEXT,
    url TEXT,
    published_at TIMESTAMP,
    is_analyzed BOOLEAN,
    relevance_score INTEGER,
    intelligence_priority TEXT,
    source_count INTEGER,
    created_at TIMESTAMP,
    analysis JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id, e.title, e.description, e.source, e.url, e.published_at, e.is_analyzed, 
        e.relevance_score, e.intelligence_priority, e.source_count, e.created_at,
        to_jsonb(a.*) as analysis
    FROM events e
    LEFT JOIN analysis a ON e.id = a.event_id
    WHERE 
        e.title ILIKE '%' || query_text || '%'
        OR e.description ILIKE '%' || query_text || '%'
        OR a.summary ILIKE '%' || query_text || '%'
        OR a.countries_impacted::text ILIKE '%' || query_text || '%'
        OR a.market_impacts::text ILIKE '%' || query_text || '%'
        OR a.strategic_significance ILIKE '%' || query_text || '%'
        OR a.impact_on_india ILIKE '%' || query_text || '%'
    ORDER BY e.relevance_score DESC, e.published_at DESC
    LIMIT max_limit OFFSET row_offset;
END;
$$;