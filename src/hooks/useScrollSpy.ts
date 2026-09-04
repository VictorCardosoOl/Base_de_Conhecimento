import { useState, useEffect } from 'react';
import { useScroll, useSpring } from 'framer-motion';

export const useScrollSpy = () => {
    const [showBackToTop, setShowBackToTop] = useState(false);
    
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return { scaleX, showBackToTop, scrollToTop };
};

