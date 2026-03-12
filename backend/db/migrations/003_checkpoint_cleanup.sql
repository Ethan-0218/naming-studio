-- 003_checkpoint_cleanup.sql
-- LangGraph 체크포인트 정리 함수
-- 각 세션(thread_id)에서 최신 체크포인트 1개만 남기고 나머지를 삭제합니다.

-- 반환 타입 변경을 위해 기존 함수를 먼저 삭제합니다.
DROP FUNCTION IF EXISTS cleanup_old_checkpoints(INTEGER);

CREATE OR REPLACE FUNCTION cleanup_old_checkpoints(older_than_days INTEGER DEFAULT 30)
RETURNS TABLE(pruned_writes BIGINT, pruned_checkpoints BIGINT, pruned_sessions BIGINT) AS $$
DECLARE
    v_pruned_writes BIGINT := 0;
    v_pruned_checkpoints BIGINT := 0;
    v_pruned_sessions BIGINT := 0;
BEGIN
    -- 1. 모든 세션: 최신 체크포인트 외 checkpoint_writes 삭제
    --    (가장 많이 쌓이는 테이블)
    DELETE FROM checkpoint_writes
    WHERE (thread_id, checkpoint_ns, checkpoint_id) NOT IN (
        SELECT thread_id, checkpoint_ns, MAX(checkpoint_id)
        FROM checkpoints
        GROUP BY thread_id, checkpoint_ns
    );
    GET DIAGNOSTICS v_pruned_writes = ROW_COUNT;

    -- 2. 모든 세션: 최신 체크포인트 외 이전 checkpoints 행 삭제
    --    LangGraph는 최신 1개만 있으면 state 복원 가능
    DELETE FROM checkpoints
    WHERE (thread_id, checkpoint_ns, checkpoint_id) NOT IN (
        SELECT thread_id, checkpoint_ns, MAX(checkpoint_id)
        FROM checkpoints
        GROUP BY thread_id, checkpoint_ns
    );
    GET DIAGNOSTICS v_pruned_checkpoints = ROW_COUNT;

    -- 3. X일 이상 미활동 세션: checkpoint_blobs까지 전체 삭제
    DELETE FROM checkpoint_blobs
    WHERE thread_id IN (
        SELECT thread_id FROM checkpoints
        WHERE (metadata->>'created_at')::timestamptz < NOW() - (older_than_days || ' days')::INTERVAL
    );

    DELETE FROM checkpoints
    WHERE (metadata->>'created_at')::timestamptz < NOW() - (older_than_days || ' days')::INTERVAL;
    GET DIAGNOSTICS v_pruned_sessions = ROW_COUNT;

    RETURN QUERY SELECT v_pruned_writes, v_pruned_checkpoints, v_pruned_sessions;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_checkpoints IS
    '모든 세션에서 최신 체크포인트 1개만 남기고 나머지를 정리합니다. '
    'older_than_days 이상 된 세션은 blobs 포함 전체 삭제합니다. '
    '앱 시작 시 자동 실행됩니다.';
