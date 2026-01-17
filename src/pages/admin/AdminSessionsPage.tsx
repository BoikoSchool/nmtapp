import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Test, TestSession } from '../../types/database.types';
import { Loader2, PlayCircle, PauseCircle, StopCircle, Plus, Clock, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const AdminSessionsPage = () => {
    const [sessions, setSessions] = useState<TestSession[]>([]);
    const [tests, setTests] = useState<Test[]>([]);

    // Timer state
    const [now, setNow] = useState(new Date());

    // Create Form
    const [newTitle, setNewTitle] = useState('');
    const [newDuration, setNewDuration] = useState(120);
    const [selectedTests, setSelectedTests] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchData();
        // Timer tick
        const timerInterval = setInterval(() => setNow(new Date()), 1000);
        // Data poll
        const dataInterval = setInterval(fetchData, 5000);

        return () => {
            clearInterval(timerInterval);
            clearInterval(dataInterval);
        };
    }, []);

    const fetchData = async () => {
        const [sessRes, testsRes] = await Promise.all([
            supabase.from('test_sessions').select('*, test_attempts(*, profiles(full_name))').order('created_at', { ascending: false }),
            supabase.from('tests').select('*, subjects(name)').order('title')
        ]);
        setSessions(sessRes.data || []);
        // @ts-ignore
        setTests(testsRes.data || []);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTests.length === 0) {
            alert("Оберіть хоча б один тест!");
            return;
        }
        setCreating(true);

        try {
            // 1. Create Session
            const { data: session, error: sessError } = await supabase
                .from('test_sessions')
                .insert({
                    title: newTitle,
                    duration_minutes: newDuration,
                    status: 'waiting',
                    group_id: (await supabase.auth.getUser()).data.user?.id // Temp: admin is owner
                })
                .select()
                .single();

            if (sessError) throw sessError;

            // 2. Link Tests
            const links = selectedTests.map(testId => ({
                session_id: session.id,
                test_id: testId
            }));

            const { error: linkError } = await supabase.from('session_tests').insert(links);
            if (linkError) throw linkError;

            setNewTitle('');
            setSelectedTests([]);
            fetchData();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setCreating(false);
        }
    };

    const updateStatus = async (id: string, status: 'active' | 'paused' | 'finished') => {
        // Optimistic Update
        setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s));

        const updateData: any = { status };
        const timestamp = new Date().toISOString();

        if (status === 'active') {
            const s = sessions.find(s => s.id === id);
            if (!s?.started_at) {
                updateData.started_at = timestamp;
            } else if (s.status === 'paused' && s.last_paused_at) {
                // Resume logic: shift started_at to account for pause duration
                // stored_started_at = stored_started_at + (now - last_paused_at)
                const pauseDurationMs = new Date(timestamp).getTime() - new Date(s.last_paused_at).getTime();
                const newStartedAt = new Date(new Date(s.started_at).getTime() + pauseDurationMs).toISOString();
                updateData.started_at = newStartedAt;
                updateData.last_paused_at = null; // clear pause
            }
        }

        if (status === 'finished') {
            // Use RPC to bulk finalize all students
            const { error } = await supabase.rpc('finish_session_bulk', { p_session_id: id });
            if (error) {
                alert('Error finishing session: ' + error.message);
                fetchData();
            } else {
                fetchData();
            }
            return;
        }

        if (status === 'paused') {
            updateData.last_paused_at = timestamp;
        }

        const { error } = await supabase.from('test_sessions').update(updateData).eq('id', id);

        if (error) {
            alert('Error updating status: ' + error.message);
            fetchData(); // Revert on error
        } else {
            fetchData(); // Confirm
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Видалити цю сесію? Всі результати студентів також будуть видалені.')) return;
        const { error } = await supabase.from('test_sessions').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchData();
    };

    const toggleTestSelection = (id: string) => {
        setSelectedTests(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const getTimerDisplay = (session: TestSession) => {
        if (session.status === 'waiting') return `${session.duration_minutes}:00`;
        if (session.status === 'finished') return 'Завершено';
        if (!session.started_at) return `${session.duration_minutes}:00`;

        const start = new Date(session.started_at).getTime();
        const durationMs = session.duration_minutes * 60 * 1000;

        // Calculate elapsed
        let elapsed = 0;
        if (session.status === 'paused' && session.last_paused_at) {
            elapsed = new Date(session.last_paused_at).getTime() - start;
        } else {
            elapsed = now.getTime() - start;
        }

        const remainingMs = Math.max(0, durationMs - elapsed);
        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-6xl">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Live Control Room</h2>

            {/* Scheduler */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-green-500" /> Запланувати Сесію
                </h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-400 mb-1">Назва Сесії</label>
                            <input
                                className="w-full p-2 border-2 border-slate-200 rounded-lg font-bold"
                                placeholder="НМТ 2024 (Основна сесія)"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-xs font-bold text-slate-400 mb-1">Тривалість (хв)</label>
                            <input
                                type="number"
                                className="w-full p-2 border-2 border-slate-200 rounded-lg font-bold"
                                value={newDuration}
                                onChange={e => setNewDuration(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">Оберіть тести для включення (Subjects Blocks)</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border-2 border-slate-100 rounded-xl p-2">
                            {tests.map((test: any) => (
                                <div
                                    key={test.id}
                                    onClick={() => toggleTestSelection(test.id)}
                                    className={cn(
                                        "p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col",
                                        selectedTests.includes(test.id)
                                            ? "border-green-500 bg-green-50"
                                            : "border-slate-100 hover:border-slate-300"
                                    )}
                                >
                                    <span className="text-[10px] font-bold uppercase text-slate-400">{test.subjects?.name}</span>
                                    <span className="font-bold text-slate-700 text-sm">{test.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button disabled={creating} className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-200 w-full md:w-auto">
                        {creating ? <Loader2 className="animate-spin" /> : 'Створити Сесію'}
                    </button>
                </form>
            </div>

            {/* Active Sessions */}
            <div className="grid grid-cols-1 gap-4">
                {sessions.map(session => (
                    <div key={session.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                                    session.status === 'active' ? "bg-green-100 text-green-600 animate-pulse" :
                                        session.status === 'paused' ? "bg-yellow-100 text-yellow-600" :
                                            session.status === 'finished' ? "bg-slate-100 text-slate-500" :
                                                "bg-blue-100 text-blue-600"
                                )}>
                                    {session.status}
                                </span>
                                <span className={cn("text-sm font-bold flex items-center gap-1",
                                    session.status === 'active' ? "text-slate-800 font-mono text-xl" : "text-slate-400"
                                )}>
                                    <Clock className="w-4 h-4" /> {getTimerDisplay(session)}
                                </span>
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-800">{session.title}</h3>
                            <div className="text-xs text-slate-400 font-mono mt-1">ID: {session.id}</div>

                            {/* Results Summary */}
                            {/* @ts-ignore */}
                            {session.test_attempts?.length > 0 && (
                                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Результати Студентів</div>
                                    <div className="space-y-2">
                                        {/* @ts-ignore */}
                                        {session.test_attempts.map((att: any) => (
                                            <div key={att.id} className="flex justify-between items-center text-sm border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        att.status === 'finished' ? "bg-green-500" : "bg-yellow-500 animate-pulse"
                                                    )} />
                                                    <span className="font-bold text-slate-700">{att.profiles?.full_name || 'Анонім'}</span>
                                                </div>
                                                <div className="text-right flex items-center gap-3">
                                                    {att.results_data?.tests && (
                                                        <div className="flex gap-4">
                                                            {/* @ts-ignore */}
                                                            {att.results_data.tests.map((res: any, idx: number) => (
                                                                <div key={idx} className="flex flex-col items-center">
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="font-black text-green-600 text-lg leading-none">{res.scaled}</span>
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{res.subject?.substring(0, 3)}</span>
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 font-medium">
                                                                        {res.raw}/{res.max_raw}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex gap-4">
                            {session.status === 'finished' ? (
                                <div className="text-slate-400 font-bold">Завершено</div>
                            ) : (
                                <>
                                    {session.status !== 'active' && (
                                        <button
                                            onClick={() => updateStatus(session.id, 'active')}
                                            className="flex flex-col items-center gap-1 text-green-500 hover:scale-110 transition-transform"
                                        >
                                            <PlayCircle className="w-12 h-12" />
                                            <span className="text-xs font-bold uppercase">Start</span>
                                        </button>
                                    )}

                                    {session.status === 'active' && (
                                        <button
                                            onClick={() => updateStatus(session.id, 'paused')}
                                            className="flex flex-col items-center gap-1 text-yellow-500 hover:scale-110 transition-transform"
                                        >
                                            <PauseCircle className="w-12 h-12" />
                                            <span className="text-xs font-bold uppercase">Pause</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => updateStatus(session.id, 'finished')}
                                        className="flex flex-col items-center gap-1 text-red-500 hover:scale-110 transition-transform ml-4"
                                    >
                                        <StopCircle className="w-12 h-12" />
                                        <span className="text-xs font-bold uppercase">Finish</span>
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => handleDelete(session.id)}
                                className="ml-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                                title="Видалити сесію"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
                {sessions.length === 0 && <p className="text-center text-slate-400 py-8">Немає активних сесій.</p>}
            </div>
        </div>
    );
};
