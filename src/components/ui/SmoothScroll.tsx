import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';

interface SmoothScrollProps {
    children: React.ReactNode;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        // Inicialização do Lenis com acoplamento de velocidade e física
        const lenis = new Lenis({
            duration: 0.8,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Curva exponencial suave Awwwards
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.95,
            touchMultiplier: 1.5,
        });

        lenisRef.current = lenis;

        // O skew global foi removido para anular o Layout Thrashing.
        // Usamos requestAnimationFrame nativo ao invés do GSAP para não inchar o bundle
        let rafId: number;
        const updateLenis = (time: number) => {
            lenis.raf(time);
            rafId = requestAnimationFrame(updateLenis);
        };
        rafId = requestAnimationFrame(updateLenis);

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
};
