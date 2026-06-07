-- EVENTS TABLE
CREATE TABLE events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    source TEXT,
    url TEXT,
    category TEXT,
    country TEXT,
    published_at TIMESTAMP,
    is_analyzed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ANALYSIS TABLE
CREATE TABLE analysis (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    summary TEXT,
    sentiment TEXT,
    importance_score INTEGER,
    key_points JSONB,
    generated_at TIMESTAMP DEFAULT NOW()
);

-- CHAT HISTORY TABLE
CREATE TABLE chat_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID,
    question TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- SAVED EVENTS TABLE
CREATE TABLE saved_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID,
    event_id BIGINT REFERENCES events(id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT NOW()
);