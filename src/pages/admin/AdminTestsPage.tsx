import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Subject, Test } from '../../types/database.types';
import { Loader2, Plus, FileJson, Trash2 } from 'lucide-react';

export const AdminTestsPage = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Form State
    const [selectedSubject, setSelectedSubject] = useState('');
    const [title, setTitle] = useState('');
    // maxScore removed
    const [creating, setCreating] = useState(false);

    // Import State
    const [importingTestId, setImportingTestId] = useState<string | null>(null);
    const [jsonContent, setJsonContent] = useState('');
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [subRes, testRes] = await Promise.all([
            supabase.from('subjects').select('*').order('name'),
            supabase.from('tests').select('*, subjects(name)').order('created_at', { ascending: false })
        ]);

        setSubjects(subRes.data || []);
        // @ts-ignore - supabase types for join are tricky, trust me bro
        setTests(testRes.data || []);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        const { error } = await supabase.from('tests').insert({
            subject_id: selectedSubject,
            title,
            max_raw_score: 0 // Start at 0, grows with questions
        });

        if (error) alert(error.message);
        else {
            setTitle('');
            fetchData();
        }
        setCreating(false);
    };

    const transformImportData = (userJson: any[]) => {
        return userJson.map((item: any) => {
            const base = {
                content: item.questionText + (item.imageUrl ? `\n\n![Image](${item.imageUrl})` : ''),
                points_weight: item.points,
                explanation: item.explanation
            };

            if (item.type === 'single_choice') {
                return {
                    ...base,
                    type: 'single_choice',
                    options: item.options, // Array of {id, text}
                    correct_answer: { answer: item.correctAnswers[0] }
                };
            }

            if (item.type === 'matching') {
                // Convert array of {promptId, optionId} to object {promptId: optionId}
                const correctObj: any = {};
                item.correctAnswers.forEach((pair: any) => {
                    correctObj[pair.promptId] = pair.optionId;
                });

                return {
                    ...base,
                    type: 'matching',
                    options: {
                        prompts: item.matchPrompts,
                        options: item.options
                    },
                    correct_answer: correctObj
                };
            }

            if (item.type === 'numeric_input') {
                return {
                    ...base,
                    type: 'short_answer',
                    options: {},
                    correct_answer: { text: item.correctAnswers[0] }
                };
            }

            if (item.type === 'grouped_choice_3') {
                return {
                    ...base,
                    type: 'grouped_choice_3',
                    options: {
                        groups: item.groups
                    },
                    correct_answer: item.answer || item.correctAnswer || item.correctAnswers
                };
            }

            // Default fallback
            return {
                ...base,
                type: item.type,
                options: item.options,
                correct_answer: item.correctAnswers
            };
        });
    };

    const handleDelete = async (testId: string) => {
        if (!confirm('Ви впевнені? Ця дія видалить тест І ВСІ його питання безповоротно.')) return;
        setLoading(true);
        try {
            // 1. Get linked questions
            const { data: links, error: linkError } = await supabase
                .from('test_questions')
                .select('question_id')
                .eq('test_id', testId);

            if (linkError) throw linkError;

            const qIds = links?.map(l => l.question_id) || [];

            // 2. Delete questions (if any)
            if (qIds.length > 0) {
                const { error: qError } = await supabase.from('questions').delete().in('id', qIds);
                if (qError) throw qError;
            }

            // 3. Delete test
            const { error: tError } = await supabase.from('tests').delete().eq('id', testId);
            if (tError) throw tError;

            fetchData();
        } catch (e: any) {
            alert(`Помилка видалення: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!importingTestId) return;
        setImporting(true);
        try {
            const rawParsed = JSON.parse(jsonContent);
            // Auto-detect format: check if it has 'questionText'
            const isCustomFormat = Array.isArray(rawParsed) && rawParsed.length > 0 && rawParsed[0].questionText;

            const finalData = isCustomFormat ? transformImportData(rawParsed) : rawParsed;

            const { error } = await supabase.rpc('import_questions_to_test', {
                p_test_id: importingTestId,
                p_questions_json: finalData
            });

            if (error) throw error;
            alert(`Успішно імпортовано ${finalData.length} питань!`);
            setImportingTestId(null);
            setJsonContent('');
            fetchData(); // Refresh to update score
        } catch (e: any) {
            console.error(e);
            alert(`Помилка: ${e.message}`);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="max-w-5xl">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6">Керування Тестами</h2>

            {/* Create Test */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-green-500" /> Створити Тест
                </h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-400 mb-1">Предмет</label>
                        <select
                            className="w-full p-2 border-2 border-slate-200 rounded-lg font-bold text-slate-700 outline-none"
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                            required
                        >
                            <option value="">Оберіть предмет</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-400 mb-1">Назва тесту</label>
                        <input
                            className="w-full p-2 border-2 border-slate-200 rounded-lg font-bold text-slate-700 outline-none"
                            placeholder="Демонстраційний варіант"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    {/* Max Score removed - calculated automatically */}
                    <button disabled={creating} className="bg-green-500 text-white p-2.5 rounded-lg font-bold hover:bg-green-600 shadow-lg shadow-green-200 disabled:opacity-50">
                        {creating ? <Loader2 className="animate-spin" /> : 'Створити'}
                    </button>
                </form>
            </div>

            {/* Tests List */}
            {loading ? <Loader2 className="animate-spin mx-auto text-green-500" /> : (
                <div className="space-y-4">
                    {tests.map((test: any) => (
                        <div key={test.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">{test.subjects?.name}</div>
                                <h4 className="font-bold text-slate-800 text-lg">{test.title}</h4>
                                <div className="text-sm text-slate-500 flex gap-3 mt-1">
                                    <span>🏆 {test.max_raw_score} балів</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setImportingTestId(test.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                                >
                                    <FileJson className="w-4 h-4" /> Імпорт Питань
                                </button>
                                <button
                                    onClick={() => handleDelete(test.id)}
                                    className="px-4 py-2 bg-red-50 text-red-500 rounded-lg font-bold hover:bg-red-100 transition-colors"
                                    title="Видалити тест і питання"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Import Modal Overlay */}
            {importingTestId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Імпорт питань JSON</h3>
                        <textarea
                            className="w-full h-64 p-4 border-2 border-slate-200 rounded-xl font-mono text-xs focus:border-green-500 outline-none"
                            placeholder='[ { "type": "single_choice", "content": "Question?", "points": 1, "options": {}, "answer": "A" } ]'
                            value={jsonContent}
                            onChange={e => setJsonContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setImportingTestId(null)} className="px-4 py-2 text-slate-500 font-bold">Скасувати</button>
                            <button onClick={handleImport} disabled={importing} className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600">
                                {importing ? 'Імпортуємо...' : 'Завантажити'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
