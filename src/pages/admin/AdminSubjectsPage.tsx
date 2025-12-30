import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Subject } from '../../types/database.types';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export const AdminSubjectsPage = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newIcon, setNewIcon] = useState('📚');
    const [creating, setCreating] = useState(false);

    const fetchSubjects = async () => {
        const { data } = await supabase.from('subjects').select('*').order('name');
        setSubjects(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setCreating(true);

        const { error } = await supabase.from('subjects').insert({
            name: newName,
            icon_url: newIcon
        });

        if (error) {
            alert(error.message);
        } else {
            setNewName('');
            fetchSubjects();
        }
        setCreating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Видалити цей предмет? Всі тести цього предмету також будуть видалені!')) return;

        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchSubjects();
    };

    return (
        <div className="max-w-4xl">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Керування Предметами</h2>

            {/* Create Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-green-500" /> Додати предмет
                </h3>
                <form onSubmit={handleCreate} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-400 mb-1">Назва</label>
                        <input
                            className="w-full p-2 border-2 border-slate-200 rounded-lg font-bold text-slate-700 focus:border-green-500 outline-none"
                            placeholder="Напр. Історія України"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                    </div>
                    <div className="w-24">
                        <label className="block text-xs font-bold text-slate-400 mb-1">Іконка</label>
                        <input
                            className="w-full p-2 border-2 border-slate-200 rounded-lg text-center text-xl"
                            placeholder="📚"
                            value={newIcon}
                            onChange={e => setNewIcon(e.target.value)}
                        />
                    </div>
                    <button
                        disabled={creating}
                        className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-200 disabled:opacity-50"
                    >
                        {creating ? <Loader2 className="animate-spin" /> : 'Створити'}
                    </button>
                </form>
            </div>

            {/* List */}
            {loading ? (
                <Loader2 className="animate-spin text-green-500 mx-auto" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjects.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl">
                                    {sub.icon_url}
                                </div>
                                <span className="font-bold text-slate-700">{sub.name}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(sub.id)}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    {subjects.length === 0 && <p className="text-slate-400 text-center col-span-2">Немає предметів.</p>}
                </div>
            )}
        </div>
    );
};
