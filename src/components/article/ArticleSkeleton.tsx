import React from 'react';
import { motion } from 'framer-motion';

export const ArticleSkeleton: React.FC = () => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto py-12 space-y-12 min-h-[50vh] relative overflow-hidden"
        >
            {/* Cortina editorial sutil e arquitetônica */}
            <div className="space-y-6 max-w-3xl mx-auto">
                <div className="space-y-2">
                    <div className="h-2 w-28 bg-stone-200 dark:bg-stone-800 rounded animate-pulse" />
                    <div className="h-10 bg-gradient-to-r from-stone-100 via-stone-200 to-stone-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 rounded-lg w-4/5 animate-pulse" />
                </div>

                <div className="h-px bg-border my-6" />

                <div className="space-y-3">
                    <div className="h-4 bg-stone-200/80 dark:bg-stone-800/80 rounded w-full animate-pulse" />
                    <div className="h-4 bg-stone-200/80 dark:bg-stone-800/80 rounded w-11/12 animate-pulse" />
                    <div className="h-4 bg-stone-200/80 dark:bg-stone-800/80 rounded w-5/6 animate-pulse" />
                </div>

                <div className="pt-6 space-y-4">
                    <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded w-1/3 animate-pulse" />
                    <div className="h-4 bg-stone-200/70 dark:bg-stone-800/70 rounded w-full animate-pulse" />
                    <div className="h-4 bg-stone-200/70 dark:bg-stone-800/70 rounded w-4/5 animate-pulse" />
                </div>
            </div>
        </motion.div>
    );
};

