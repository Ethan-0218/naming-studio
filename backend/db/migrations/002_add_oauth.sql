-- 002_add_oauth.sql
-- users 테이블에 OAuth 컬럼 추가

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS apple_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20);
