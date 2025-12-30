export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Subject {
    id: string;
    name: string;
    icon_url: string | null;
    created_at: string;
}

export interface Test {
    id: string;
    subject_id: string;
    title: string;
    // duration_minutes removed in V4
    max_raw_score: number;
    created_at: string;
    subjects?: Subject; // For joins
}

export interface Question {
    id: string;
    subject_id: string;
    type: 'single_choice' | 'multiple_choice_3' | 'sequence' | 'grouped_choice_3' | 'matching' | 'short_answer';
    content: string;
    options: Json;
    points_weight: number;
    explanation?: string;
    created_at: string;
}

export interface TestSession {
    id: string;
    // test_id removed in V4
    title: string; // Added V4
    status: 'waiting' | 'active' | 'paused' | 'finished';
    started_at: string | null;
    last_paused_at: string | null; // Added
    total_paused_duration: string | null; // Added
    ends_at: string | null;
    duration_minutes: number; // Moved here in V4
}

export interface SessionTest {
    session_id: string;
    test_id: string;
    test?: Test;
}

export interface TestAttempt {
    id: string;
    session_id: string;
    user_id: string;
    status: 'active' | 'finished';
    raw_score_total: number;
    scaled_score_200: number;
    results_data: Json; // Added
}
