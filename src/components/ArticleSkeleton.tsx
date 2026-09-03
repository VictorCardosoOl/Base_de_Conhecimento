import React from 'react';

export const ArticleSkeleton: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 animate-pulse space-y-12">
            {/* Header Skeleton */}
            <div className="text-center space-y-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32 mx-auto" />
                <div className="h-12 md:h-20 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4 mx-auto" />
                <div className="h-24 bg-gray-100 dark:bg-gray-900 rounded-xl w-full max-w-2xl mx-auto" />
            </div>

            {/* Content Skeleton */}
            <div className="space-y-4 max-w-2xl mx-auto">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />

                <div className="pt-8 space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                </div>
            </div>
        </div>
    );
};
