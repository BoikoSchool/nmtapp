
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

const SESSION_ID = '293d84e6-2bbd-4e95-8469-81640d05b7b4'; // From screenshot

async function debug() {
    console.log('--- Debugging Session:', SESSION_ID, '---');

    // 1. Check Session
    const { data: session, error: sessError } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('id', SESSION_ID)
        .single();

    if (sessError) console.error('Subject Error:', sessError);
    else console.log('Session Found:', session?.title, session?.status);

    // 2. Check Session Tests
    const { data: st, error: stError } = await supabase
        .from('session_tests')
        .select('test_id, tests(*)')
        .eq('session_id', SESSION_ID);

    if (stError) console.error('Session Tests Error:', stError);
    else {
        console.log('Session Tests Count:', st?.length);
        if (st && st.length > 0) {
            console.log('First Test Linked:', st[0]);
        } else {
            console.log('WARNING: No tests linked to this session!');
        }
    }

    // 3. Check Questions
    if (st && st.length > 0) {
        // @ts-ignore
        const testId = st[0].test_id;
        console.log('Checking Questions for Test:', testId);

        const { data: tq, error: tqError } = await supabase
            .from('test_questions')
            .select('question_id, questions(*)')
            .eq('test_id', testId);

        if (tqError) console.error('Test Questions Error:', tqError);
        else console.log('Questions found:', tq?.length);
    }
}

debug();
