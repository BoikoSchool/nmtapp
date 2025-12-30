import React from 'react';
import type { Subject } from '../types/database.types';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface SubjectCardProps {
    subject: Subject;
    onClick: () => void;
    className?: string;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick, className }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center p-6 rounded-2xl",
                "bg-white shadow-xl border-b-4 border-slate-200 hover:border-slate-300",
                "transition-colors duration-200",
                className
            )}
        >
            <div className="w-24 h-24 mb-4 bg-slate-100 rounded-full flex items-center justify-center text-4xl shadow-inner">
                {subject.icon_url ? (
                    <span role="img" aria-label={subject.name}>{subject.icon_url}</span>
                ) : (
                    <span>📚</span>
                )}
            </div>

            <h3 className="text-xl font-bold text-slate-700 uppercase tracking-wide">
                {subject.name}
            </h3>

            <span className="mt-2 text-sm text-slate-400 font-medium">
                Почати курс
            </span>
        </motion.button>
    );
};
