-- 001_init.sql
-- 세션 영속화를 위한 초기 스키마

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS naming_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    stage VARCHAR(50) NOT NULL DEFAULT 'welcome',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    naming_direction TEXT,
    user_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_name_preferences (
    session_id VARCHAR(64) NOT NULL REFERENCES naming_sessions(id) ON DELETE CASCADE,
    preference_type VARCHAR(10) NOT NULL CHECK (preference_type IN ('liked', 'disliked', 'shown')),
    name VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (session_id, preference_type, name)
);
