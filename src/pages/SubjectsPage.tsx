import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Subject } from '../types/database.types';
import { SubjectCard } from '../components/SubjectCard';
import { Loader2 } from 'lucide-react';

export const SubjectsPage = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const { data, error } = await supabase
                    .from('subjects')
                    .select('*')
                    .order('name');

                if (error) throw error;
                setSubjects(data || []);
            } catch (error) {
                console.error('Error fetching subjects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-green-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Обери предмет</h1>
                <p className="text-slate-500 text-lg">Почни підготовку до НМТ прямо зараз</p>
            </div>

            {subjects.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-400">Предметів поки що немає.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {subjects.map((subject) => (
                        <SubjectCard
                            key={subject.id}
                            subject={subject}
                            onClick={() => console.log('Navigate to', subject.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
