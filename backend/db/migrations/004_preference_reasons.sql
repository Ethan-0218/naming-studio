-- 좋아요/싫어요 이유 수집을 위해 reasons 컬럼 추가
ALTER TABLE session_name_preferences
    ADD COLUMN IF NOT EXISTS reasons TEXT[] NOT NULL DEFAULT '{}';
