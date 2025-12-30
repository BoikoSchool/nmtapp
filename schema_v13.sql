-- ==========================================
-- SCHEMA V13: Robust Multi-Test Scoring
-- ==========================================

-- 1. Add results_data column to test_attempts to store detailed scores
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS results_data JSONB DEFAULT '{}';

-- 2. Improved Multi-Test Finalization Function
CREATE OR REPLACE FUNCTION finalize_exam_v7(p_attempt_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_session_id UUID;
    v_total_raw NUMERIC := 0;
    v_test_details JSONB := '[]';
    t_rec RECORD;
    q_rec RECORD;
    v_q_points NUMERIC;
    v_test_raw NUMERIC;
    v_test_scaled INTEGER;
    v_correct_count INTEGER;
    v_key TEXT;
    v_val TEXT;
BEGIN
    SET LOCAL search_path = public;
    
    -- Get Session ID
    SELECT session_id INTO v_session_id FROM test_attempts WHERE id = p_attempt_id;
    IF v_session_id IS NULL THEN RAISE EXCEPTION 'Attempt not found'; END IF;
    
    -- Lock attempt
    PERFORM * FROM test_attempts WHERE id = p_attempt_id FOR UPDATE;

    -- Iterate over each TEST in the session
    FOR t_rec IN (
        SELECT st.test_id, t.title as test_title, s.name as subject_name
        FROM session_tests st
        JOIN tests t ON t.id = st.test_id
        JOIN subjects s ON s.id = t.subject_id
        WHERE st.session_id = v_session_id
        ORDER BY st.display_order
    ) LOOP
        v_test_raw := 0;
        
        -- Score Questions for this Test
        FOR q_rec IN (
            SELECT sa.question_id, sa.answer_data, ak.correct_answer, q.type, q.points_weight
            FROM student_answers sa
            JOIN questions q ON q.id = sa.question_id
            JOIN question_answer_keys ak ON ak.question_id = sa.question_id
            JOIN test_questions tq ON tq.question_id = q.id
            WHERE sa.attempt_id = p_attempt_id AND tq.test_id = t_rec.test_id
        ) LOOP
            v_q_points := 0;
            
            CASE q_rec.type
                WHEN 'single_choice' THEN
                    IF q_rec.answer_data->>'answer' = q_rec.correct_answer->>'answer' THEN
                        v_q_points := q_rec.points_weight;
                    END IF;
                
                WHEN 'matching' THEN
                    v_correct_count := 0;
                    FOR v_key, v_val IN SELECT * FROM jsonb_each_text(q_rec.correct_answer) LOOP
                        IF (q_rec.answer_data->>v_key) = v_val THEN
                            v_correct_count := v_correct_count + 1;
                        END IF;
                    END LOOP;
                    v_q_points := v_correct_count;
                
                WHEN 'short_answer' THEN
                    -- Simple string trim and case-insensitive check
                    -- Expecting answer_data like {"text": "123"}
                    -- Expecting correct_answer like {"answer": "123"} or {"text": "123"}
                    IF lower(trim(q_rec.answer_data->>'text')) = lower(trim(COALESCE(q_rec.correct_answer->>'answer', q_rec.correct_answer->>'text'))) THEN
                        v_q_points := q_rec.points_weight;
                    END IF;

                WHEN 'sequence' THEN
                    IF q_rec.answer_data::jsonb = q_rec.correct_answer::jsonb THEN
                        v_q_points := q_rec.points_weight;
                    END IF;

                WHEN 'multiple_choice_3' THEN
                    SELECT count(*) INTO v_correct_count 
                    FROM jsonb_array_elements_text(q_rec.answer_data) val
                    WHERE val = ANY(SELECT jsonb_array_elements_text(q_rec.correct_answer));
                    v_q_points := v_correct_count;

                ELSE
                    v_q_points := 0;
            END CASE;
            
            UPDATE student_answers SET points_awarded = v_q_points WHERE attempt_id = p_attempt_id AND question_id = q_rec.question_id;
            v_test_raw := v_test_raw + v_q_points;
        END LOOP;

        -- Scale Score (100-200) for this Test
        SELECT scaled_score INTO v_test_scaled FROM score_mappings 
        WHERE test_id = t_rec.test_id AND raw_score = floor(v_test_raw)::INTEGER;
        
        IF v_test_scaled IS NULL THEN
             -- Capped at 200, baseline 100
             v_test_scaled := 100 + LEAST(100, round((v_test_raw / NULLIF((SELECT max_raw_score FROM tests WHERE id = t_rec.test_id), 0)) * 100));
        END IF;

        v_test_details := v_test_details || jsonb_build_object(
            'test_id', t_rec.test_id,
            'title', t_rec.test_title,
            'subject', t_rec.subject_name,
            'raw', v_test_raw,
            'scaled', v_test_scaled,
            'max_raw', (SELECT max_raw_score FROM tests WHERE id = t_rec.test_id)
        );
        
        v_total_raw := v_total_raw + v_test_raw;
    END LOOP;

    UPDATE test_attempts 
    SET raw_score_total = v_total_raw, 
        status = 'finished', 
        finished_at = NOW(),
        results_data = jsonb_build_object('tests', v_test_details)
    WHERE id = p_attempt_id;
    
    RETURN jsonb_build_object('status', 'success', 'results', v_test_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Security Policies for Admin reading results
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access test_attempts" ON test_attempts;
CREATE POLICY "Admin full access test_attempts" ON test_attempts FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admin full access student_answers" ON student_answers;
CREATE POLICY "Admin full access student_answers" ON student_answers FOR ALL USING (is_admin());

