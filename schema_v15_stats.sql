CREATE OR REPLACE FUNCTION get_test_stats(p_test_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SET LOCAL search_path = public;

    WITH question_stats AS (
        SELECT 
            q.id as question_id,
            q.content as question_content,
            q.type as question_type,
            COALESCE((SELECT count(*) FROM student_answers sa WHERE sa.question_id = q.id), 0) as total_responses,
            COALESCE((SELECT count(*) FROM student_answers sa WHERE sa.question_id = q.id AND sa.points_awarded > 0), 0) as correct_responses,
            COALESCE(
                (SELECT jsonb_object_agg(key, val)
                 FROM (
                    SELECT 
                        COALESCE(sa2.answer_data->>'answer', sa2.answer_data->>'text', 'unanswered') as key,
                        count(*) as val
                    FROM student_answers sa2
                    WHERE sa2.question_id = q.id
                    GROUP BY key
                 ) s),
                 '{}'::jsonb
            ) as answer_distribution
        FROM questions q
        JOIN test_questions tq ON tq.question_id = q.id
        WHERE (p_test_id IS NULL OR tq.test_id = p_test_id)
        GROUP BY q.id, q.content, q.type
    ),
    test_metrics AS (
        SELECT 
            t.id as test_id,
            t.title as test_title,
            COALESCE((
                SELECT avg(ta.raw_score_total) 
                FROM test_attempts ta 
                JOIN session_tests st ON st.session_id = ta.session_id 
                WHERE st.test_id = t.id AND ta.status = 'finished'
            ), 0) as avg_raw_score,
            COALESCE((
                SELECT count(*) 
                FROM test_attempts ta 
                JOIN session_tests st ON st.session_id = ta.session_id 
                WHERE st.test_id = t.id AND ta.status = 'finished'
            ), 0) as total_attempts
        FROM tests t
        WHERE (p_test_id IS NULL OR t.id = p_test_id)
    )
    SELECT jsonb_build_object(
        'tests', COALESCE((SELECT jsonb_agg(tm) FROM test_metrics tm), '[]'::jsonb),
        'questions', COALESCE((SELECT jsonb_agg(qs) FROM question_stats qs), '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
