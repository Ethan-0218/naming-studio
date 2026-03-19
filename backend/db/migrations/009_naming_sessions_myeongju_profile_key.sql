-- 클라이언트 명주 식별자(모바일 mock id, API UUID 등)를 그대로 저장하기 위해
-- FK 및 UUID 타입 제약을 완화합니다.

ALTER TABLE naming_sessions
    DROP CONSTRAINT IF EXISTS naming_sessions_myeongju_id_fkey;

ALTER TABLE naming_sessions
    ALTER COLUMN myeongju_id TYPE VARCHAR(64) USING myeongju_id::text;

CREATE INDEX IF NOT EXISTS idx_naming_sessions_myeongju_id
    ON naming_sessions (myeongju_id)
    WHERE myeongju_id IS NOT NULL;
