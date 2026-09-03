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
            duration: 1.2, // Duração da inércia (padrão é 1.2) - ajustável para "mais pesado"
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing exponencial suave
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        lenisRef.current = lenis;

        // Loop de animação (RAF)
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        // Conectar eventos globais se necessário ou expor a instância
        // window.lenis = lenis; // Opcional para debug

        return () => {
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
};
