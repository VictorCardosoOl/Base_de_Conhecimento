import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';

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
        // O GSAP ScrollTrigger deve ser usado localmente em cada componente se necessário.

        // Sincronizando o Lenis 100% com o Ticker do GSAP (Regra de Ouro)
        const updateLenis = (time: number) => {
            lenis.raf(time * 1000);
        };

        gsap.ticker.add(updateLenis);
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(updateLenis);
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
};
