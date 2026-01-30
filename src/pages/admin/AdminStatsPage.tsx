import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, TrendingUp, AlertTriangle, Users, BarChart, FileSpreadsheet } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Stats {
    tests: any[];
    questions: any[];
}

export const AdminStatsPage = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const { data, error } = await supabase.rpc('get_test_stats', {});
        if (error) {
            console.error('Stats Error:', error);
            setLoading(false);
            return;
        }
        setStats(data);
        setLoading(false);
    };

    const formatAnswerValue = (type: string, options: any, answerData: any) => {
        if (!answerData) return '';

        // Helper to find text by ID in arrays of {id, text} or simple objects
        const getLabel = (pool: any, key: any): string => {
            if (!key) return '';
            if (!pool) return String(key);

            // 1. If pool is array of {id, text}
            if (Array.isArray(pool)) {
                const found = pool.find(item => String(item?.id) === String(key) || String(item?.value) === String(key));
                if (found) return found.text || found.label || String(key);
            }

            // 2. If pool is { options: [...] }
            if (pool.options && Array.isArray(pool.options)) {
                const found = pool.options.find((item: any) => String(item?.id) === String(key));
                if (found) return found.text || String(key);
            }

            // 3. Fallback to simple object lookup
            const simplePool = pool.options || pool.leftSide || pool.rightSide || pool;
            if (typeof simplePool === 'object' && simplePool[key]) return String(simplePool[key]);

            return String(key);
        };

        try {
            switch (type) {
                case 'single_choice':
                    const sKey = answerData.answer || answerData.text || (typeof answerData === 'string' ? answerData : '');
                    return getLabel(options, sKey);

                case 'short_answer':
                    return answerData.text || answerData.answer || String(answerData);

                case 'multiple_choice_3':
                    const mKeys = Array.isArray(answerData) ? answerData : (answerData.answers || []);
                    return mKeys.map((k: string) => getLabel(options, k)).join('; ');

                case 'grouped_choice_3':
                    const gData = answerData as Record<string, any>;
                    return Object.entries(gData)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([gKey, aKey], idx) => {
                            const group = options?.groups?.[idx] || {};
                            const aText = getLabel(group.options || [], aKey);
                            return `Гр${gKey}: ${aText}`;
                        })
                        .join(' | ');

                case 'matching':
                    const matchingLeft = options?.leftSide || options?.prompts || [];
                    const matchingRight = options?.rightSide || options?.options || [];
                    if (!answerData || typeof answerData !== 'object') return '';
                    return Object.entries(answerData as Record<string, any>)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([qKey, aKey]) => {
                            const qText = getLabel(matchingLeft, qKey);
                            const aText = getLabel(matchingRight, aKey);
                            return `${qText} -> ${aText}`;
                        })
                        .join(' | ');

                case 'sequence':
                    // Sequence usually stored as {"1": "B", "2": "A"} or just array logic in some versions.
                    // Based on renderer, it's matching-like object key->val.
                    // But if it's imported as matching, it follows matching structure.
                    // If my import fixed it to type=sequence, check structure.
                    // transform_history.mjs sets correct_answer: {"1": "A", "2": "B"}
                    const seqOpts = options?.options || options || [];
                    if (typeof answerData === 'object' && !Array.isArray(answerData)) {
                        return Object.entries(answerData as Record<string, any>)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([pos, val]) => `${pos}: ${getLabel(seqOpts, val)}`)
                            .join(' -> ');
                    }
                    const seqKeys = Array.isArray(answerData) ? answerData : [];
                    return seqKeys.map((k: string) => getLabel(seqOpts, k)).join(' -> ');

                default:
                    if (typeof answerData === 'object') return JSON.stringify(answerData);
                    return getLabel(options, answerData);
            }
        } catch (e) {
            console.error('Format error:', e);
            return JSON.stringify(answerData);
        }
    };

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            const { data, error } = await supabase.rpc('get_detailed_export_data');
            if (error) throw error;

            if (!data || data.length === 0) {
                alert('Даних для експорту немає.');
                return;
            }

            // --- CSV Generation ---
            const headers = [
                'Студент', 'Email', 'Предмет (Блок)', 'Початок', 'Кінець',
                'Бал за блок (Raw)', 'Загальний Raw', 'Загальний NMT',
                'Питання', 'Тип', 'Відповідь студента', 'Правильна відповідь', 'Балів за питання'
            ];

            const rows = data.map((item: any) => [
                item.student_name,
                item.student_email,
                item.test_title,
                new Date(item.started_at).toLocaleString('uk-UA'),
                new Date(item.finished_at).toLocaleString('uk-UA'),
                item.test_raw_score,
                item.total_raw_score,
                // Find subject-specific scaled score from the blob if available?
                // Actually, SQL query returns:
                // test_raw_score (line 25 in SQL - raw score for THIS test)
                // total_raw_score (line 27 - sum of all tests in session)
                // total_scaled_score (line 28 - sum of scaled or just 200?) 
                // Wait, users wants the SUBJECT Scaled Score (100-200).
                // The current SQL `get_detailed_export_data` DOES NOT return the subject scaled score directly.
                // It only computes the raw score.
                // However, I can fetch the subject scaled score from `test_attempts.results_data`.
                // For now, I'll modify the SQL to extract it.
                // But first, let's look at what data we have in JS.
                // The `data` array comes from `get_detailed_export_data`.

                // Let's assume I fix the SQL first.
                item.subject_scaled_score || 'N/A',
                item.question_content.replace(/[\n\r]+/g, ' ').replace(/<[^>]*>/g, ''), // Strip HTML
                item.question_type,
                formatAnswerValue(item.question_type, item.question_options, item.student_answer),
                formatAnswerValue(item.question_type, item.question_options, item.correct_answer),
                item.points_awarded
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map((row: any[]) => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            // --- Download ---
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `nmt_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (err: any) {
            console.error('Export error:', err);
            alert('Помилка вивантаження: ' + err.message);
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
    if (!stats) return <div>Помилка завантаження статистики.</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-slate-800">Аналітика та статистика</h1>
                <button
                    onClick={handleExportCSV}
                    disabled={exporting}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-green-100 disabled:opacity-50"
                >
                    {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
                    Експорт (CSV)
                </button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-800">
                                {stats.tests.reduce((acc, t) => acc + t.total_attempts, 0)}
                            </div>
                            <div className="text-xs font-bold text-slate-400 uppercase">Спроб всього</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-800">
                                {stats.tests.length > 0
                                    ? (stats.tests.reduce((acc, t) => acc + t.avg_raw_score, 0) / stats.tests.length).toFixed(1)
                                    : 0
                                }
                            </div>
                            <div className="text-xs font-bold text-slate-400 uppercase">Середній бал (Raw)</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-800">
                                {stats.questions.filter(q => (q.correct_responses / Math.max(1, q.total_responses)) < 0.3).length}
                            </div>
                            <div className="text-xs font-bold text-slate-400 uppercase">Складних питань</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Difficult Questions */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <BarChart className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-xl font-bold text-slate-800">Аналіз питань (Difficulty)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Питання</th>
                                <th className="px-6 py-4">Тип</th>
                                <th className="px-6 py-4 text-center">Прогрес</th>
                                <th className="px-6 py-4 text-right">Успішність</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium">
                            {stats.questions
                                .sort((a, b) => (a.correct_responses / Math.max(1, a.total_responses)) - (b.correct_responses / Math.max(1, b.total_responses)))
                                .slice(0, 10).map((q, idx) => {
                                    const successRate = (q.correct_responses / Math.max(1, q.total_responses)) * 100;
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 max-w-md">
                                                <div className="text-sm text-slate-700 line-clamp-2 prose-sm">
                                                    <ReactMarkdown>{q.question_content}</ReactMarkdown>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-500 uppercase">
                                                    {q.question_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${successRate < 30 ? 'bg-red-400' : successRate < 70 ? 'bg-amber-400' : 'bg-green-400'}`}
                                                        style={{ width: `${successRate}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-slate-800">
                                                {successRate.toFixed(0)}%
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
