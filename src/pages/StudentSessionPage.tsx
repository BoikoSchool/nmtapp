import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Pause, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { cn } from '../lib/utils';
import type { TestSession, Question, Test } from '../types/database.types';
import { QuestionRenderer } from '../components/QuestionRenderer';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Import CSS directly here or in App.tsx

// Memoized component to prevent re-rendering of Markdown on every timer tick
const QuestionDisplay = React.memo(({
    question,
    answer,
    onAnswer,
    onNext,
    onPrev,
    isFirst,
    isLast,
    isFinished
}: {
    question: Question,
    answer: any,
    onAnswer: (val: any) => void,
    onNext: () => void,
    onPrev: () => void,
    isFirst: boolean,
    isLast: boolean,
    isFinished: boolean
}) => {
    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-200">
            {/* Question Content */}
            <div className="prose prose-slate max-w-none prose-xl prose-img:rounded-xl prose-img:shadow-md prose-img:max-h-[400px] prose-p:text-2xl prose-p:text-slate-800 prose-p:font-semibold">
                <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                        img: ({ node, ...props }) => <img {...props} className="max-w-full h-auto rounded-xl border border-slate-200 my-4" />,
                        p: ({ children }) => <p className="text-xl font-semibold text-slate-800 leading-relaxed mb-6">{children}</p>
                    }}
                >
                    {question.content}
                </ReactMarkdown>
            </div>

            {/* Renderer */}
            <QuestionRenderer
                question={question}
                value={answer}
                onChange={onAnswer}
                readOnly={isFinished}
            />

            {/* Navigation Buttons (Sticky Footer) */}
            <div className="sticky bottom-0 bg-white z-10 pt-6 pb-2 border-t border-slate-100 flex justify-between mt-8 -mx-6 px-6 md:-mx-8 md:px-8 rounded-b-3xl">
                <button
                    onClick={onPrev}
                    disabled={isFirst}
                    className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                    Назад
                </button>
                <button
                    onClick={onNext}
                    className="px-8 py-3 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-200 transition-all active:scale-95"
                >
                    {isLast ? 'До навігації' : 'Далі'}
                </button>
            </div>
        </div>
    );
});

export const StudentSessionPage = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Data State
    const [session, setSession] = useState<TestSession | null>(null);
    const [tests, setTests] = useState<Test[]>([]); // The blocks (e.g. Math, History)
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [attemptId, setAttemptId] = useState<string | null>(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const [activeTestId, setActiveTestId] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Timer State (Local countdown)
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (sessionId && user) loadSessionData();

        // Realtime Listener
        const channel = supabase.channel(`session_updates_${sessionId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'test_sessions',
                filter: `id=eq.${sessionId}`
            }, (payload: any) => {
                setSession(prev => prev ? { ...prev, ...payload.new } : payload.new as TestSession);

                if (payload.new.status === 'finished') {
                    // Finalize silently if not already finished
                    if (attemptId) {
                        supabase.rpc('finalize_exam_v7', { p_attempt_id: attemptId }).then(() => {
                            loadSessionData();
                        });
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, user]);

    // Timer Effect
    useEffect(() => {
        if (!session || session.status !== 'active') return;

        const tick = () => {
            if (!session.started_at) return;
            const start = new Date(session.started_at).getTime();
            const duration = session.duration_minutes * 60 * 1000; // minutes to ms
            const end = start + duration;
            const now = new Date().getTime();

            const remaining = Math.max(0, end - now);
            setTimeRemaining(remaining);

            if (remaining <= 0 && session.status === 'active') {
                // Auto-finalize on timeout
                if (attemptId) {
                    supabase.rpc('finalize_exam_v7', { p_attempt_id: attemptId }).then(() => {
                        loadSessionData();
                    });
                }
            }
        };

        tick(); // Immediate update
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [session]);

    // Formatting helper
    const formatTime = (ms: number | null) => {
        if (ms === null) return '--:--:--';
        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleFinish = async () => {
        if (!attemptId) return;
        if (!confirm('Ви впевнені, що хочете завершити тест?')) return;

        try {
            setLoading(true);
            const { error } = await supabase.rpc('finalize_exam_v7', { p_attempt_id: attemptId });
            if (error) throw error;

            // Reload data to show finished state or results
            await loadSessionData();
        } catch (e: any) {
            alert('Помилка при завершенні: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const loadSessionData = async () => {
        try {
            // 1. Fetch Session Info
            const { data: sess, error: sessError } = await supabase
                .from('test_sessions')
                .select('*, test_attempts(*)')
                .eq('id', sessionId)
                .eq('test_attempts.user_id', user!.id)
                .single();
            if (sessError) throw sessError;
            setSession(sess as any);

            // 2. Fetch Tests (Blocks) linked to this session
            const { data: sessionTests, error: stError } = await supabase
                .from('session_tests')
                .select('test_id, tests(*, subjects(name))')
                .eq('session_id', sessionId)
                .order('display_order');

            if (stError) throw stError;

            // @ts-ignore
            const loadedTests = sessionTests.map((st: any) => st.tests);
            setTests(loadedTests);
            if (loadedTests.length > 0) setActiveTestId(loadedTests[0].id);

            // 3. Fetch Questions for ALL tests in this session
            const testIds = loadedTests.map((t: any) => t.id);
            const { data: testQuestions, error: tqError } = await supabase
                .from('test_questions')
                .select('test_id, order_priority, questions(*)')
                .in('test_id', testIds)
                .order('order_priority', { ascending: true }); // Ensure correct display order

            if (tqError) throw tqError;

            // @ts-ignore
            const allQs = testQuestions.map((tq: any) => ({ ...tq.questions, test_id: tq.test_id }));
            setQuestions(allQs);

            // 4. Fetch or Create Attempt
            let { data: attempt } = await supabase
                .from('test_attempts')
                .select('id')
                .eq('session_id', sessionId)
                .eq('user_id', user!.id)
                .single();

            if (!attempt) {
                // Join session
                const { data: newAttempt, error: createError } = await supabase
                    .from('test_attempts')
                    .insert({ session_id: sessionId, user_id: user!.id })
                    .select('id')
                    .single();
                if (createError) throw createError;
                attempt = newAttempt;
            }

            setAttemptId(attempt.id);

            // 5. Fetch Existing Answers
            const { data: savedAnswers } = await supabase
                .from('student_answers')
                .select('question_id, answer_data')
                .eq('attempt_id', attempt.id);

            const ansMap: Record<string, any> = {};
            savedAnswers?.forEach(a => ansMap[a.question_id] = a.answer_data);
            setAnswers(ansMap);

            setLoading(false);
        } catch (e: any) {
            alert(e.message);
            navigate('/live');
        }
    };

    const saveAnswerDebounced = async (qId: string, val: any) => {
        if (!attemptId || isFinished) return;
        // Upsert answer
        await supabase.from('student_answers').upsert({
            attempt_id: attemptId,
            question_id: qId,
            answer_data: val
        });
    };

    // Filter questions for current active tab
    const activeQuestions = questions.filter((q: any) => q.test_id === activeTestId);
    const currentQuestion = activeQuestions[currentQuestionIndex];

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-green-500" /></div>;
    if (!session) return null;

    // --- STATES ---
    // @ts-ignore
    const myAttempt = session.test_attempts?.[0];
    const isFinished = session.status === 'finished' || myAttempt?.status === 'finished';

    if (session.status === 'waiting') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Очікування початку</h1>
                    <p className="text-slate-500 font-medium mb-6">Викладач ще не розпочав сесію. Будь ласка, зачекайте.</p>
                    <div className="bg-slate-100 p-4 rounded-xl">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Сесія</div>
                        <div className="font-bold text-slate-700">{session.title}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (session.status === 'paused') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Pause className="w-10 h-10 text-yellow-600" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Іспит Призупинено</h1>
                    <p className="text-slate-500 font-medium">Викладач тимчасово зупинив виконання тесту.</p>
                </div>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Іспит Завершено</h1>
                    <p className="text-slate-500 font-medium mb-6">Ваші відповіді збережено.</p>

                    {/* Display Results if available */}
                    {/* @ts-ignore */}
                    {session.test_attempts?.[0]?.results_data?.tests && (
                        <div className="space-y-4 mb-8 text-left">
                            <div className="text-xs font-bold text-slate-400 uppercase border-b pb-2">Результати по блоках</div>
                            {/* @ts-ignore */}
                            {session.test_attempts[0].results_data.tests.map((res: any) => (
                                <div key={res.test_id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div>
                                        <div className="font-bold text-slate-700">{res.subject}</div>
                                        <div className="text-xs text-slate-400">{res.title}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-slate-600 leading-none">{res.raw}/{res.max_raw}</div>
                                        </div>
                                        <div className="text-right border-l pl-4">
                                            <div className="text-2xl font-black text-green-600 leading-none">{res.scaled}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase">НМТ</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button onClick={() => navigate('/')} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">
                        На Головну
                    </button>
                </div>
            </div>
        );
    }

    // --- ACTIVE TEST UI ---
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="font-extrabold text-slate-800 text-lg sm:text-xl truncate max-w-[200px]">{session.title}</div>

                {/* Timer (Realtime) */}
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-mono font-bold">
                    <Clock className="w-5 h-5" />
                    <span>{formatTime(timeRemaining)}</span>
                </div>

                <button
                    onClick={handleFinish}
                    className="bg-red-50 text-red-500 px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                >
                    Завершити
                </button>
            </header>

            {/* Subject Tabs */}
            <div className="bg-white border-b border-slate-200 px-6 overflow-x-auto">
                <div className="flex gap-6">
                    {tests.map((test: any) => (
                        <button
                            key={test.id}
                            onClick={() => { setActiveTestId(test.id); setCurrentQuestionIndex(0); }}
                            className={cn(
                                "py-4 font-bold text-sm uppercase tracking-wide border-b-4 transition-all whitespace-nowrap",
                                activeTestId === test.id
                                    ? "border-green-500 text-green-600"
                                    : "border-transparent text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {test.subjects?.name}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Questions Navigation (Sidebar) */}
                <aside className="md:col-span-3 order-2 md:order-1">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 sticky top-24">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-4">Навігація</div>
                        <div className="grid grid-cols-5 gap-2">
                            {activeQuestions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={cn(
                                        "aspect-square rounded-lg font-bold text-sm flex items-center justify-center transition-all",
                                        idx === currentQuestionIndex ? "bg-slate-900 text-white" :
                                            answers[q.id] ? "bg-green-100 text-green-700" :
                                                "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Question Area */}
                <div className="md:col-span-9 order-1 md:order-2">
                    {currentQuestion ? (
                        <QuestionDisplay
                            question={currentQuestion}
                            answer={answers[currentQuestion.id]}
                            onAnswer={(val) => {
                                if (isFinished) return;
                                setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
                                saveAnswerDebounced(currentQuestion.id, val);
                            }}
                            onPrev={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            onNext={() => setCurrentQuestionIndex(prev => Math.min(activeQuestions.length - 1, prev + 1))}
                            isFirst={currentQuestionIndex === 0}
                            isLast={currentQuestionIndex === activeQuestions.length - 1}
                            isFinished={isFinished}
                        />
                    ) : (
                        <div className="text-center py-12 text-slate-400">Питань у цьому блоці немає.</div>
                    )}
                </div>
            </main>
        </div>
    );
};
