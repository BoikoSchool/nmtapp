import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { TestSession } from '../types/database.types';
import { Loader2, Play, Circle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

export const StudentLobbyPage = () => {
    const [sessions, setSessions] = useState<TestSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSessions = async () => {
            // Fetch any session that is NOT finished
            const { data } = await supabase
                .from('test_sessions')
                .select('*')
                .neq('status', 'finished')
                .order('created_at', { ascending: false });
            setSessions(data || []);
            setLoading(false);
        };

        fetchSessions();
        // Setup realtime listener for new sessions status
        const channel = supabase.channel('public:test_sessions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'test_sessions' }, fetchSessions)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleJoin = async (sessionId: string) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setJoiningId(sessionId);

        // 1. Check if we already have an attempt
        const { data: existingAttempt } = await supabase
            .from('test_attempts')
            .select('id')
            .eq('session_id', sessionId)
            .eq('user_id', user.id)
            .single();

        if (existingAttempt) {
            navigate(`/session/${sessionId}`);
            return;
        }

        // 2. Create new attempt
        const { error } = await supabase.from('test_attempts').insert({
            session_id: sessionId,
            user_id: user.id,
            status: 'active'
        });

        if (error) {
            alert(error.message);
            setJoiningId(null);
        } else {
            navigate(`/session/${sessionId}`);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-green-500" /></div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Активні Сесії</h1>
            <p className="text-slate-500 mb-8">Приєднуйтесь до іспиту, коли викладач його розпочне.</p>

            <div className="space-y-4">
                {sessions.length === 0 ? (
                    <div className="bg-slate-50 p-12 rounded-2xl text-center border border-dashed border-slate-300">
                        <div className="inline-block p-4 bg-white rounded-full shadow-sm mb-4">
                            <Clock className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Немає активних сесій</h3>
                        <p className="text-slate-400 text-sm">Почекайте, поки викладач створить нову сесію.</p>
                    </div>
                ) : (
                    sessions.map(session => (
                        <div key={session.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-green-400 transition-all group">
                            <div className="flex justify-between items-center mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${session.status === 'active' ? 'bg-green-100 text-green-600 animate-pulse' :
                                    session.status === 'waiting' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                    {session.status === 'active' ? 'Йде іспит' : session.status === 'waiting' ? 'Очікування' : 'Пауза'}
                                </span>
                                <span className="text-slate-400 text-xs font-bold flex items-center gap-1">
                                    <Clock className="w-4 h-4" /> {session.duration_minutes} хв
                                </span>
                            </div>

                            <h3 className="text-xl font-extrabold text-slate-800 mb-1">{session.title}</h3>
                            <p className="text-slate-400 text-xs font-mono mb-6">ID: {session.id}</p>

                            <button
                                onClick={() => handleJoin(session.id)}
                                disabled={joiningId === session.id}
                                className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold uppercase tracking-wide hover:bg-green-500 hover:shadow-lg hover:shadow-green-200 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                            >
                                {joiningId === session.id ? <Loader2 className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                                {session.status === 'active' ? 'Приєднатися зараз' : 'Увійти в лобі'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
