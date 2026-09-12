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

        let lastSkew = '';
        let skewRafId: number | null = null;

        // Escuta velocidade do scroll com throttling via rAF para não degradar o INP da thread principal
        lenis.on('scroll', (e: { velocity: number }) => {
            if (skewRafId !== null) return;
            skewRafId = requestAnimationFrame(() => {
                skewRafId = null;
                const clampedVelocity = Math.max(-10, Math.min(10, e.velocity));
                const skewDeg = (clampedVelocity * 0.08).toFixed(2);
                const nextSkew = `${skewDeg}deg`;
                if (nextSkew !== lastSkew) {
                    lastSkew = nextSkew;
                    document.documentElement.style.setProperty('--scroll-skew', nextSkew);
                }
            });
        });

        let rafId: number;
        function raf(time: number) {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        }

        rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            if (skewRafId !== null) cancelAnimationFrame(skewRafId);
            lenis.destroy();
            document.documentElement.style.removeProperty('--scroll-skew');
        };
    }, []);

    return <>{children}</>;
};
