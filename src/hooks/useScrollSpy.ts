import { useState, useEffect } from 'react';

export const useScrollSpy = () => {
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [scaleX, setScaleX] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setShowBackToTop(scrollY > 400);

            // Calculate progress
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
                setScaleX(scrollY / docHeight);
            } else {
                setScaleX(0);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // init
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return { scaleX, showBackToTop, scrollToTop };
};

