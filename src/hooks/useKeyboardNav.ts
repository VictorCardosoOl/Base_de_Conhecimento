import { useEffect } from 'react';
import { FAQItem } from '../types/index';

export const useKeyboardNav = (
    nav: { prev: FAQItem | null; next: FAQItem | null },
    handleNavAttempt: (direction: 'prev' | 'next') => void
) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                handleNavAttempt('prev');
            } else if (e.key === 'ArrowRight') {
                handleNavAttempt('next');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nav, handleNavAttempt]);
};

