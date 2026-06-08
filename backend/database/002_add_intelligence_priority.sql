-- Add intelligence_priority column to events table

ALTER TABLE events
ADD COLUMN IF NOT EXISTS intelligence_priority TEXT DEFAULT 'LOW';

-- Create an index to quickly filter out low priority
CREATE INDEX IF NOT EXISTS idx_events_intelligence_priority ON events(intelligence_priority);
