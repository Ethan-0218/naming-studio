-- 005_myeongju.sql
-- 명주(MyeongJu) 프로필 테이블

CREATE TABLE IF NOT EXISTS myeongju (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 사용자 입력 원본 (폼 재현 및 표시용)
    gender         VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    calendar_type  VARCHAR(5)  NOT NULL CHECK (calendar_type IN ('양력', '음력')),
    birth_year     SMALLINT    NOT NULL,
    birth_month    SMALLINT    NOT NULL CHECK (birth_month BETWEEN 1 AND 12),
    birth_day      SMALLINT    NOT NULL CHECK (birth_day   BETWEEN 1 AND 31),
    time_unknown   BOOLEAN     NOT NULL DEFAULT FALSE,
    birth_hour     SMALLINT,            -- 24h KST. NULL if time_unknown
    birth_minute   SMALLINT,            -- NULL if time_unknown
    region_name    VARCHAR(20),         -- 표시용 (e.g. '서울')
    region_offset  SMALLINT,            -- 지방시 보정 분. NULL = 해외

    -- 사주팔자 계산용 변환값 (매번 재계산 불필요)
    solar_date     DATE        NOT NULL, -- 음력이면 양력 변환, 아니면 원본
    solar_time     TIME,                 -- 지방시 보정 후 시각 (NULL if time_unknown)

    -- 사주 계산 결과 (캐시)
    ilgan_hangul   VARCHAR(5)  NOT NULL, -- e.g. '임'
    ilgan_hanja    VARCHAR(5)  NOT NULL, -- e.g. '壬'
    ohaeng         VARCHAR(5)  NOT NULL, -- e.g. '수'
    ilji_hangul    VARCHAR(5)  NOT NULL, -- e.g. '자'
    ilji_hanja     VARCHAR(5)  NOT NULL, -- e.g. '子'

    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_myeongju_user_id
    ON myeongju (user_id, created_at DESC);

-- Phase 2 연동용 FK 컬럼 (지금은 사용 안 함, 컬럼만 추가)
ALTER TABLE naming_sessions
    ADD COLUMN IF NOT EXISTS myeongju_id UUID
    REFERENCES myeongju(id) ON DELETE SET NULL;
