-- Detailed Results Export RPC
-- Extracts full breakdown of student answers for spreadsheet export.

CREATE OR REPLACE FUNCTION get_detailed_export_data()
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SET LOCAL search_path = public;

    SELECT jsonb_agg(d)
    FROM (
        SELECT 
            p.full_name as student_name,
            u.email as student_email,
            t.title as test_title,
            ta.started_at,
            ta.finished_at,
            -- Calculate raw score for this SPECIFIC test
            (
                SELECT SUM(sa_inner.points_awarded)
                FROM student_answers sa_inner
                JOIN test_questions tq_inner ON tq_inner.question_id = sa_inner.question_id
                WHERE sa_inner.attempt_id = ta.id AND tq_inner.test_id = t.id
            ) as test_raw_score,
            -- Show global attempt scores as well for context
            ta.raw_score_total as total_raw_score,
            ta.scaled_score_200 as total_scaled_score,
            q.content as question_content,
            q.type as question_type,
            q.options as question_options,
            sa.answer_data as student_answer,
            ak.correct_answer as correct_answer,
            sa.points_awarded
        FROM test_attempts ta
        JOIN profiles p ON p.id = ta.user_id
        JOIN auth.users u ON u.id = ta.user_id
        JOIN test_sessions ts ON ts.id = ta.session_id
        JOIN session_tests st ON st.session_id = ts.id
        JOIN tests t ON t.id = st.test_id
        JOIN student_answers sa ON sa.attempt_id = ta.id
        JOIN questions q ON q.id = sa.question_id
        -- CRITICAL: Ensure we only show questions that belong to the current test iteration
        JOIN test_questions tq ON tq.test_id = t.id AND tq.question_id = q.id
        LEFT JOIN question_answer_keys ak ON ak.question_id = q.id
        WHERE ta.status = 'finished'
        ORDER BY ta.finished_at DESC, p.full_name, t.title, tq.order_priority
    ) d INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
