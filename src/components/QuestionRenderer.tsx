import React from 'react';
import type { Question } from '../types/database.types';
import { cn } from '../lib/utils';
import { Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface QuestionRendererProps {
    question: Question;
    value: any;
    onChange: (val: any) => void;
    readOnly?: boolean;
}

const LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Є', 'Ж'];

export const QuestionRendererComponent = ({ question, value, onChange, readOnly = false }: QuestionRendererProps) => {



    // 1. Single Choice
    if (question.type === 'single_choice') {
        let opts: any[] = [];
        if (Array.isArray(question.options)) {
            opts = question.options;
        } else if (typeof question.options === 'object') {
            opts = Object.entries(question.options || {}).map(([k, v]) => ({ id: k, text: v }));
        }

        return (
            <div className="space-y-3">
                {opts.map((opt: any, idx: number) => {
                    const label = LETTERS[idx] || opt.id;
                    const isSelected = value?.answer === opt.id;

                    return (
                        <label
                            key={opt.id}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer group",
                                isSelected
                                    ? "border-green-500 bg-green-50 shadow-md ring-1 ring-green-500"
                                    : "border-slate-100 hover:border-slate-300 hover:bg-slate-50",
                                readOnly && "pointer-events-none opacity-80"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 shrink-0 rounded-full border-2 flex items-center justify-center font-bold text-lg transition-colors",
                                isSelected
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-slate-200 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-500"
                            )}>
                                {label}
                            </div>
                            <div className="font-medium text-slate-700 text-lg leading-snug grow">
                                {opt.image && (
                                    <img
                                        src={opt.image}
                                        alt={`Option ${label}`}
                                        className="mb-3 max-h-40 rounded-lg border border-slate-200"
                                    />
                                )}
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{ p: ({ children }) => <span className="m-0">{children}</span> }}
                                >
                                    {opt.text}
                                </ReactMarkdown>
                            </div>

                            {/* Hidden Input */}
                            <input
                                type="radio"
                                name={`q-${question.id}`}
                                className="hidden"
                                checked={isSelected}
                                onChange={() => !readOnly && onChange({ answer: opt.id })}
                            />
                        </label>
                    );
                })}
            </div>
        );
    }

    // 2. Matching (Logic Pairs) AND Sequence (Ordering)
    if (question.type === 'matching' || question.type === 'sequence') {
        const data = question.options as { prompts: any[], options: any[] };
        const currentAnswers = value || {};

        const handleSelect = (promptId: string, optionId: string) => {
            if (readOnly) return;

            // Start with a copy of current answers
            const newAns = { ...currentAnswers };

            // Check if this optionId is already selected for another prompt, if so - clear it there
            // This ensures one-to-one mapping (unique column selection)
            Object.keys(newAns).forEach(key => {
                if (newAns[key] === optionId && key !== promptId) {
                    delete newAns[key];
                }
            });

            // If clicking the already selected option for this prompt, deselect it? 
            // Standard behavior usually allows re-selecting to confirm or just overwrites.
            // Let's just set it.
            newAns[promptId] = optionId;

            onChange(newAns);
        };

        return (
            <div className="grid grid-cols-1 gap-8">
                {/* Mobile/Simple View: List of Prompts with Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Prompts (Rows) */}
                    <div className="space-y-4">
                        {data.prompts?.map((prompt: any, idx: number) => (
                            <div key={prompt.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-4">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-200 text-slate-700 rounded-full text-xs font-bold shrink-0 mt-0.5">
                                    {idx + 1}
                                </span>
                                <div className="text-sm font-medium text-slate-800 leading-snug">
                                    {prompt.image && (
                                        <img
                                            src={prompt.image}
                                            alt={`Prompt ${idx + 1}`}
                                            className="mb-3 max-h-40 rounded-lg border border-slate-200 block"
                                        />
                                    )}
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{ p: ({ children }) => <span className="m-0 text-xl font-semibold">{children}</span> }}
                                    >
                                        {prompt.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Matrix */}
                    <div className="overflow-x-auto pb-2">
                        <div className="min-w-max">
                            {/* Headers */}
                            <div className="flex gap-2 mb-2 pl-[40px]"> {/* Reduced offset using just numbers */}
                                {data.options?.map((opt: any, idx: number) => (
                                    <div key={opt.id} className="w-12 text-center font-bold text-slate-400 text-xl">
                                        {LETTERS[idx] || opt.id}
                                    </div>
                                ))}
                            </div>

                            {/* Rows */}
                            {data.prompts?.map((prompt: any, idx: number) => (
                                <div key={prompt.id} className="flex items-center gap-2 mb-2">
                                    <div className="w-[40px] text-right pr-3 font-bold text-slate-500 text-lg">
                                        {idx + 1}
                                    </div>
                                    {data.options?.map((opt: any) => {
                                        // Specific check for matching pair uniqueness if needed, 
                                        // usually NMT allows 1 choice per row.
                                        const isSelected = currentAnswers[prompt.id] === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleSelect(prompt.id, opt.id)}
                                                className={cn(
                                                    "w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    isSelected
                                                        ? "bg-slate-800 border-slate-800 text-white"
                                                        : "border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-transparent"
                                                )}
                                            >
                                                {isSelected && <Check className="w-6 h-6" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="bg-white p-4 rounded-xl border border-slate-100">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-3">Варіанти відповідей</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.options?.map((opt: any, idx) => (
                            <div key={opt.id} className="flex items-start gap-3 text-sm">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 rounded-full text-xs font-bold shrink-0">
                                    {LETTERS[idx] || opt.id}
                                </span>
                                <div className="text-slate-700 leading-snug text-xl font-semibold">
                                    {opt.image && (
                                        <img
                                            src={opt.image}
                                            alt={`Option ${LETTERS[idx]}`}
                                            className="mb-3 max-h-40 rounded-lg border border-slate-200 block"
                                        />
                                    )}
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                        components={{ p: ({ children }) => <span className="m-0">{children}</span> }}
                                    >
                                        {opt.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 3. Grouped Choice 3 (Biology style)
    if (question.type === 'grouped_choice_3') {
        const data = question.options as { groups: any[] };
        const currentAnswers = value || {};

        const handleSelect = (groupId: string, optionId: string) => {
            if (readOnly) return;
            onChange({ ...currentAnswers, [groupId]: optionId });
        };

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.groups?.map((group: any, gIdx: number) => {
                    const groupId = String(gIdx + 1);
                    return (
                        <div key={groupId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                            <div className="bg-slate-50 p-3 border-b border-slate-200">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1 block">Група {groupId}</span>
                                <div className="text-sm font-bold text-slate-700 leading-tight">{group.title}</div>
                            </div>
                            <div className="p-2 space-y-1 grow">
                                {Array.isArray(group.options) && group.options.map((opt: any) => {
                                    const isSelected = String(currentAnswers[groupId]) === String(opt.id);
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleSelect(groupId, opt.id)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3",
                                                isSelected
                                                    ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                                                    : "border-transparent hover:bg-slate-50 text-slate-600"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0",
                                                isSelected ? "border-green-500 bg-green-500 text-white" : "border-slate-200"
                                            )}>
                                                {opt.id}
                                            </div>
                                            <div className="text-sm font-medium leading-tight">{opt.text}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // 4. Short Answer
    if (question.type === 'short_answer') {
        return (
            <div className="max-w-xs">
                <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Ваша відповідь</label>
                <input
                    type="number"
                    placeholder="Введіть число..."
                    className="w-full text-3xl font-bold p-4 border-2 border-slate-200 rounded-xl outline-none focus:border-green-500 focus:shadow-lg focus:shadow-green-100 transition-all text-center placeholder:text-slate-300"
                    value={value?.text || ''}
                    onChange={e => !readOnly && onChange({ text: e.target.value })}
                    readOnly={readOnly}
                />
            </div>
        );
    }

    // 5. Multiple Choice 3 (Select 3 out of 7)
    if (question.type === 'multiple_choice_3') {
        const optionList = question.options as any[];
        const currentAnswers = (value?.answers as string[]) || [];

        const toggleOption = (optId: string) => {
            if (readOnly) return;

            let newAnswers = [...currentAnswers];
            if (newAnswers.includes(optId)) {
                newAnswers = newAnswers.filter(id => id !== optId);
            } else {
                if (newAnswers.length >= 3) return; // Limit to 3 selections
                newAnswers.push(optId);
            }
            onChange({ answers: newAnswers });
        };

        return (
            <div className="grid grid-cols-1 gap-3">
                {optionList.map((opt, idx) => {
                    const isSelected = currentAnswers.includes(opt.id);
                    return (
                        <label
                            key={opt.id}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer group",
                                isSelected
                                    ? "border-green-500 bg-green-50 shadow-md ring-1 ring-green-500"
                                    : "border-slate-100 hover:border-slate-300 hover:bg-slate-50",
                                readOnly && "pointer-events-none opacity-80"
                            )}
                        >
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={isSelected}
                                onChange={() => toggleOption(opt.id)}
                            />
                            <div className={cn(
                                "w-10 h-10 shrink-0 rounded-lg border-2 flex items-center justify-center font-bold text-lg transition-colors",
                                isSelected
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-slate-200 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-500"
                            )}>
                                {LETTERS[idx] || opt.id}
                            </div>
                            <div className="font-medium text-slate-700 text-lg leading-snug grow">
                                {opt.image && (
                                    <img
                                        src={opt.image}
                                        alt={`Option ${opt.id}`}
                                        className="mb-3 max-h-40 rounded-lg border border-slate-200"
                                    />
                                )}
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                    components={{ p: ({ children }) => <span className="m-0">{children}</span> }}
                                >
                                    {opt.text}
                                </ReactMarkdown>
                            </div>
                            {isSelected && <Check className="w-6 h-6 text-green-600 shrink-0" />}
                        </label>
                    );
                })}
                <div className="mt-2 text-sm text-slate-500 font-medium">
                    Обрано: {currentAnswers.length} / 3
                </div>
            </div>
        );
    }

    return <div className="text-red-500 bg-red-50 p-4 rounded-lg">Unknown Question Type: {question.type}</div>
};

export const QuestionRenderer = React.memo(QuestionRendererComponent, (prev, next) => {
    // Custom comparison to ensure deep value equality if needed, 
    // but usually shallow compare of props is enough if objects are stable.
    // 'value' changes often when typing/selecting.
    return prev.question.id === next.question.id &&
        prev.value === next.value &&
        prev.readOnly === next.readOnly;
});
