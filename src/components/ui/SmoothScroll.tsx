import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';

interface SmoothScrollProps {
    children: React.ReactNode;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        // Inicialização do Lenis
        const lenis = new Lenis({
            duration: 0.5,
            easing: (t) => 1 - Math.pow(1 - t, 4),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 1.5,
        });

        lenisRef.current = lenis;

        let rafId: number;
        function raf(time: number) {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        }

        rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
};
