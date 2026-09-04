import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';

interface SmoothScrollProps {
    children: React.ReactNode;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        // InicializaÃ§Ã£o do Lenis
        const lenis = new Lenis({
            duration: 1.2, // DuraÃ§Ã£o da inÃ©rcia (padrÃ£o Ã© 1.2) - ajustÃ¡vel para "mais pesado"
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing exponencial suave
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        lenisRef.current = lenis;

        // Loop de animaÃ§Ã£o (RAF)
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        // Conectar eventos globais se necessÃ¡rio ou expor a instÃ¢ncia
        // window.lenis = lenis; // Opcional para debug

        return () => {
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
};
