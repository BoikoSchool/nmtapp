import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function importChemistry() {
    console.log('Starting Chemistry import...');

    // 1. Get Subject ID
    const { data: subjectData, error: sErr } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', 'Хімія')
        .single();

    if (sErr || !subjectData) {
        console.error('Subject "Хімія" not found. Please run schema_v32_chemistry_subject.sql first.');
        return;
    }
    const subjectId = subjectData.id;

    // 2. Get Test ID
    const { data: testData, error: tErr } = await supabase
        .from('tests')
        .select('id')
        .eq('title', 'НМТ Хімія (2026)')
        .single();

    if (tErr || !testData) {
        console.error('Test "НМТ Хімія (2026)" not found. Please run schema_v32_chemistry_subject.sql first.');
        return;
    }
    const testId = testData.id;

    const questionsPath = path.resolve('chemistry_questions.json');
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

    for (const q of questions) {
        process.stdout.write(`Importing question ${q.id}... `);

        // Insert Question
        const { data: newQ, error: qErr } = await supabase
            .from('questions')
            .insert({
                subject_id: subjectId,
                type: q.type,
                content: q.content,
                options: q.options,
                points_weight: q.points_weight
            })
            .select('id')
            .single();

        if (qErr) {
            console.error(`\nError inserting question ${q.id}:`, qErr.message);
            continue;
        }

        // Insert Key
        const { error: kErr } = await supabase
            .from('question_answer_keys')
            .insert({
                question_id: newQ.id,
                correct_answer: q.correct_answer
            });

        if (kErr) {
            console.error(`\nError inserting key for question ${q.id}:`, kErr.message);
        }

        // Link to Test
        const { error: lErr } = await supabase
            .from('test_questions')
            .insert({
                test_id: testId,
                question_id: newQ.id
            });

        if (lErr) {
            console.error(`\nError linking question ${q.id} to test:`, lErr.message);
        } else {
            console.log('Done.');
        }
    }

    console.log('Finished importing Chemistry questions.');
}

importChemistry();
