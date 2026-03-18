-- 003_add_user_profile.sql
-- users 테이블에 프로필 컬럼 추가

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
