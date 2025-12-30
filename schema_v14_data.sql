-- NMT 2025 Score Conversion Tables (100-200 Scale)
-- This script populates the score_mappings table with official 2025 data.

DO $$
DECLARE
    v_test_id UUID;
BEGIN
    -- 1. UKRAINIAN LANGUAGE (Max 45)
    SELECT id INTO v_test_id FROM tests WHERE title ILIKE '%Українська мова%' LIMIT 1;
    IF v_test_id IS NOT NULL THEN
        DELETE FROM score_mappings WHERE test_id = v_test_id;
        INSERT INTO score_mappings (test_id, raw_score, scaled_score) VALUES
        (v_test_id, 0, 0), (v_test_id, 1, 0), (v_test_id, 2, 0), (v_test_id, 3, 0), (v_test_id, 4, 0), (v_test_id, 5, 0), (v_test_id, 6, 0),
        (v_test_id, 7, 100), (v_test_id, 8, 105), (v_test_id, 9, 110), (v_test_id, 10, 115), (v_test_id, 11, 120),
        (v_test_id, 12, 125), (v_test_id, 13, 131), (v_test_id, 14, 134), (v_test_id, 15, 136), (v_test_id, 16, 138),
        (v_test_id, 17, 140), (v_test_id, 18, 142), (v_test_id, 19, 143), (v_test_id, 20, 144), (v_test_id, 21, 145),
        (v_test_id, 22, 146), (v_test_id, 23, 148), (v_test_id, 24, 149), (v_test_id, 25, 150), (v_test_id, 26, 152),
        (v_test_id, 27, 154), (v_test_id, 28, 156), (v_test_id, 29, 157), (v_test_id, 30, 159), (v_test_id, 31, 160),
        (v_test_id, 32, 162), (v_test_id, 33, 163), (v_test_id, 34, 165), (v_test_id, 35, 167), (v_test_id, 36, 170),
        (v_test_id, 37, 172), (v_test_id, 38, 175), (v_test_id, 39, 177), (v_test_id, 40, 180), (v_test_id, 41, 183),
        (v_test_id, 42, 186), (v_test_id, 43, 191), (v_test_id, 44, 195), (v_test_id, 45, 200);
    END IF;

    -- 2. MATHEMATICS (Max 32)
    SELECT id INTO v_test_id FROM tests WHERE title ILIKE '%Математика%' LIMIT 1;
    IF v_test_id IS NOT NULL THEN
        DELETE FROM score_mappings WHERE test_id = v_test_id;
        INSERT INTO score_mappings (test_id, raw_score, scaled_score) VALUES
        (v_test_id, 0, 0), (v_test_id, 1, 0), (v_test_id, 2, 0), (v_test_id, 3, 0), (v_test_id, 4, 0),
        (v_test_id, 5, 100), (v_test_id, 6, 107), (v_test_id, 7, 114), (v_test_id, 8, 121), (v_test_id, 9, 126),
        (v_test_id, 10, 131), (v_test_id, 11, 135), (v_test_id, 12, 138), (v_test_id, 13, 141), (v_test_id, 14, 143),
        (v_test_id, 15, 145), (v_test_id, 16, 147), (v_test_id, 17, 149), (v_test_id, 18, 151), (v_test_id, 19, 153),
        (v_test_id, 20, 155), (v_test_id, 21, 157), (v_test_id, 22, 159), (v_test_id, 23, 162), (v_test_id, 24, 165),
        (v_test_id, 25, 168), (v_test_id, 26, 171), (v_test_id, 27, 175), (v_test_id, 28, 180), (v_test_id, 29, 186),
        (v_test_id, 30, 191), (v_test_id, 31, 195), (v_test_id, 32, 200);
    END IF;

    -- 3. ENGLISH (Max 32)
    SELECT id INTO v_test_id FROM tests WHERE title ILIKE '%Англійська мова%' LIMIT 1;
    IF v_test_id IS NOT NULL THEN
        DELETE FROM score_mappings WHERE test_id = v_test_id;
        INSERT INTO score_mappings (test_id, raw_score, scaled_score) VALUES
        (v_test_id, 0, 0), (v_test_id, 1, 0), (v_test_id, 2, 0), (v_test_id, 3, 0), (v_test_id, 4, 0),
        (v_test_id, 5, 100), (v_test_id, 6, 108), (v_test_id, 7, 116), (v_test_id, 8, 124), (v_test_id, 9, 130),
        (v_test_id, 10, 134), (v_test_id, 11, 137), (v_test_id, 12, 139), (v_test_id, 13, 141), (v_test_id, 14, 143),
        (v_test_id, 15, 147), (v_test_id, 16, 149), (v_test_id, 17, 151), (v_test_id, 18, 153), (v_test_id, 19, 155),
        (v_test_id, 20, 159), (v_test_id, 21, 161), (v_test_id, 22, 164), (v_test_id, 23, 167), (v_test_id, 24, 171),
        (v_test_id, 25, 176), (v_test_id, 26, 182), (v_test_id, 27, 187), (v_test_id, 28, 191), (v_test_id, 29, 194),
        (v_test_id, 30, 196), (v_test_id, 31, 198), (v_test_id, 32, 200);
    END IF;

    -- 4. HISTORY OF UKRAINE (Max 54)
    SELECT id INTO v_test_id FROM tests WHERE title ILIKE '%Історія України%' LIMIT 1;
    IF v_test_id IS NOT NULL THEN
        DELETE FROM score_mappings WHERE test_id = v_test_id;
        INSERT INTO score_mappings (test_id, raw_score, scaled_score) VALUES
        (v_test_id, 0, 0), (v_test_id, 1, 0), (v_test_id, 2, 0), (v_test_id, 3, 0), (v_test_id, 4, 0), (v_test_id, 5, 0), (v_test_id, 6, 0), (v_test_id, 7, 0),
        (v_test_id, 8, 100), (v_test_id, 9, 106), (v_test_id, 10, 112), (v_test_id, 11, 117), (v_test_id, 12, 121), (v_test_id, 13, 124), (v_test_id, 14, 127), (v_test_id, 15, 130), (v_test_id, 16, 133), (v_test_id, 17, 135), (v_test_id, 18, 137), (v_test_id, 19, 139), (v_test_id, 20, 140), (v_test_id, 21, 141), (v_test_id, 22, 142), (v_test_id, 23, 143), (v_test_id, 24, 144), (v_test_id, 25, 145), (v_test_id, 26, 146), (v_test_id, 27, 147), (v_test_id, 28, 148), (v_test_id, 29, 149), (v_test_id, 30, 150), (v_test_id, 31, 152), (v_test_id, 32, 153), (v_test_id, 33, 155), (v_test_id, 34, 157), (v_test_id, 35, 158), (v_test_id, 36, 160), (v_test_id, 37, 162), (v_test_id, 38, 164), (v_test_id, 39, 167), (v_test_id, 40, 169), (v_test_id, 41, 171), (v_test_id, 42, 174), (v_test_id, 43, 176), (v_test_id, 44, 179), (v_test_id, 45, 181), (v_test_id, 46, 184), (v_test_id, 47, 186), (v_test_id, 48, 189), (v_test_id, 49, 191), (v_test_id, 50, 193), (v_test_id, 51, 195), (v_test_id, 52, 197), (v_test_id, 53, 199), (v_test_id, 54, 200);
    END IF;

    -- 5. BIOLOGY (Max 46)
    SELECT id INTO v_test_id FROM tests WHERE title ILIKE '%Біологія%' LIMIT 1;
    IF v_test_id IS NOT NULL THEN
        DELETE FROM score_mappings WHERE test_id = v_test_id;
        INSERT INTO score_mappings (test_id, raw_score, scaled_score) VALUES
        (v_test_id, 0, 0), (v_test_id, 1, 0), (v_test_id, 2, 0), (v_test_id, 3, 0), (v_test_id, 4, 0), (v_test_id, 5, 0), (v_test_id, 6, 0),
        (v_test_id, 7, 100), (v_test_id, 8, 105), (v_test_id, 9, 111), (v_test_id, 10, 116), (v_test_id, 11, 121), (v_test_id, 12, 125), (v_test_id, 13, 129), (v_test_id, 14, 133), (v_test_id, 15, 136), (v_test_id, 16, 138), (v_test_id, 17, 140), (v_test_id, 18, 141), (v_test_id, 19, 142), (v_test_id, 20, 143), (v_test_id, 21, 144), (v_test_id, 22, 145), (v_test_id, 23, 147), (v_test_id, 24, 148), (v_test_id, 25, 149), (v_test_id, 26, 151), (v_test_id, 27, 153), (v_test_id, 28, 155), (v_test_id, 29, 157), (v_test_id, 30, 158), (v_test_id, 31, 160), (v_test_id, 32, 162), (v_test_id, 33, 164), (v_test_id, 34, 166), (v_test_id, 35, 168), (v_test_id, 36, 171), (v_test_id, 37, 174), (v_test_id, 38, 177), (v_test_id, 39, 180), (v_test_id, 40, 183), (v_test_id, 41, 186), (v_test_id, 42, 189), (v_test_id, 43, 192), (v_test_id, 44, 195), (v_test_id, 45, 198), (v_test_id, 46, 200);
    END IF;

END $$;
