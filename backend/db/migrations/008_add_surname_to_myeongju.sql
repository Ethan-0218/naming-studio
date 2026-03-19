-- 008_add_surname_to_myeongju.sql
-- 성씨(surname) 컬럼 추가

ALTER TABLE myeongju
    ADD COLUMN IF NOT EXISTS surname       VARCHAR(10) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS surname_hanja VARCHAR(10) NOT NULL DEFAULT '';
