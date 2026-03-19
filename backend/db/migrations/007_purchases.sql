-- 007_purchases.sql
-- 인앱결제(IAP) 구매 이력 테이블

CREATE TABLE IF NOT EXISTS purchases (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- AI 작명 구매 시 연결할 세션. 스스로 이름짓기 프리미엄은 NULL.
    session_id      VARCHAR(64) REFERENCES naming_sessions(id) ON DELETE SET NULL,
    product_id      VARCHAR(100) NOT NULL,
    product_type    VARCHAR(50)  NOT NULL CHECK (
                        product_type IN (
                            'self_naming_premium',
                            'ai_naming_1',
                            'ai_naming_5',
                            'ai_naming_unlimited',
                            'ai_naming_unlimited_u1',
                            'ai_naming_unlimited_u2',
                            'ai_naming_unlimited_u3',
                            'ai_naming_unlimited_u4',
                            'ai_naming_unlimited_u5',
                            'ai_naming_unlimited_u5plus'
                        )),
    -- 'completed' | 'refunded'
    status          VARCHAR(20)  NOT NULL DEFAULT 'completed',
    transaction_id  VARCHAR(255) UNIQUE,   -- 중복 결제 방지 (idempotency)
    receipt_data    TEXT,                  -- Apple/Google raw receipt (보관용)
    amount_krw      INT          NOT NULL,
    purchased_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id
    ON purchases (user_id, purchased_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchases_session_id
    ON purchases (session_id)
    WHERE session_id IS NOT NULL;
