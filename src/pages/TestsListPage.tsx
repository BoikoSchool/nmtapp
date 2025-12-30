import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Test, Subject } from '../types/database.types';
import { ChevronLeft, GraduationCap, PlayCircle, Loader2 } from 'lucide-react';

export const TestsListPage = () => {
    const { subjectId } = useParams<{ subjectId: string }>();
    const navigate = useNavigate();
    const [tests, setTests] = useState<Test[]>([]);
    const [subject, setSubject] = useState<Subject | null>(null);
    const [loading, setLoading] = useState(true);
    const [creatingSession, setCreatingSession] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!subjectId) return;
            try {
                // Fetch Subject Details
                const { data: subjectData } = await supabase
                    .from('subjects')
                    .select('*')
                    .eq('id', subjectId)
                    .single();
                setSubject(subjectData);

                // Fetch Tests for Subject
                const { data: testsData } = await supabase
                    .from('tests')
                    .select('*')
                    .eq('subject_id', subjectId)
                    .order('created_at', { ascending: false });

                setTests(testsData || []);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [subjectId]);

    const handleStartTest = async (testId: string) => {
        setCreatingSession(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert("Будь ласка, увійдіть, щоб почати тест.");
                return;
            }

            // 2. Create Session
            const { data: session, error } = await supabase
                .from('test_sessions')
                .insert({
                    test_id: testId,
                    status: 'active',
                    started_at: new Date().toISOString(),
                    group_id: user.id // Self-study convention
                })
                .select()
                .single();

            if (error) throw error;

            // 3. Create Attempt
            const { error: attemptError } = await supabase
                .from('test_attempts')
                .insert({
                    session_id: session.id,
                    user_id: user.id,
                    status: 'active'
                });

            if (attemptError) throw attemptError;

            // Navigate to Session
            navigate(`/session/${session.id}`);

        } catch (e: any) {
            console.error(e);
            alert(`Помилка старту тесту: ${e.message}`);
        } finally {
            setCreatingSession(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center h-[50vh] items-center"><Loader2 className="animate-spin text-green-500 w-8 h-8" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
                <button
                    onClick={() => navigate('/')}
                    className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="text-4xl bg-slate-100 p-4 rounded-2xl">
                    {subject?.icon_url || '📚'}
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">{subject?.name || 'Предмет'}</h1>
                    <p className="text-slate-500 font-medium">Оберіть тест для проходження</p>
                </div>
            </div>

            {/* Tests Grid */}
            <div className="grid gap-4">
                {tests.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-400">Тестів поки що немає.</p>
                    </div>
                ) : (
                    tests.map(test => (
                        <div key={test.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-green-400 hover:shadow-md transition-all flex justify-between items-center group">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-green-600 transition-colors">{test.title}</h3>
                                <div className="flex gap-4 text-slate-500 text-sm font-medium">
                                    <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> {test.max_raw_score} балів</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleStartTest(test.id)}
                                disabled={creatingSession}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-green-200 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creatingSession ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                                Почати
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
