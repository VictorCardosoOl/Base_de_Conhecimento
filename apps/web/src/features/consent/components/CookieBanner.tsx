import React, { useLayoutEffect, useRef, useState } from 'react';
import { useConsent } from '@/features/consent/ConsentContext';
import Link from 'next/link';
import { Cookie, FileText } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

/**
 * Enquanto o banner está visível, reserva no fim da página a altura que ele ocupa
 * (`--cookie-banner-h`, usada em global.css como padding e scroll-padding).
 * Assim nenhum conteúdo fica preso atrás dele: dá para rolar até o botão "Entrar"
 * no mobile, e o foco por teclado rola o campo para acima do banner.
 */
function useReserveSpace(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean
) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (!active || !el) return;

    const update = () => {
      // Do topo do banner até o fim da viewport (inclui a margem inferior).
      // offsetTop ignora o transform da animação de entrada.
      root.style.setProperty(
        '--cookie-banner-h',
        `${Math.max(0, Math.ceil(window.innerHeight - el.offsetTop))}px`
      );
    };
    update();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
      root.style.removeProperty('--cookie-banner-h');
    };
  }, [ref, active]);
}

export const CookieBanner: React.FC = () => {
  const { consent, acceptAll, rejectAll } = useConsent();

  const containerRef = useRef<HTMLElement>(null);
  useReserveSpace(containerRef, consent === 'pending');
  const [isClosing, setIsClosing] = useState(false);

  useGSAP(() => {
    if (consent === 'pending' && !isClosing && containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.38, ease: 'power4.out', overwrite: 'auto' }
      );
    }
  }, [consent, isClosing]);

  const handleAction = (action: () => void) => {
    setIsClosing(true);
    action();
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.22,
        ease: 'power3.in',
        onComplete: () => {
          setIsClosing(false);
        },
      });
    } else {
      setIsClosing(false);
    }
  };

  // Não renderiza se o usuário já expressou consentimento e não está fechando
  if (consent !== 'pending' && !isClosing) return null;

  return (
    <aside
      ref={containerRef}
      role="region"
      aria-label="Cookies e privacidade"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[80] max-h-[45dvh] overflow-y-auto overscroll-contain p-4 md:p-5 rounded-2xl bg-bg-island border border-border shadow-2xl text-text-main transform-gpu will-change-[transform,opacity]"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-bg-island border border-border text-text-main shrink-0 mt-0.5">
          <Cookie size={20} strokeWidth={1.75} aria-hidden="true" />
        </div>

        <div className="space-y-2 flex-1 min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-text-main">
            Cookies e privacidade
          </h2>

          <p className="text-xs text-text-muted leading-relaxed">
            Usamos cookies essenciais para manter sua sessão e guardamos preferências apenas
            neste aparelho. O monitoramento de erros e desempenho só é ativado se você
            permitir; você pode mudar a escolha quando quiser.
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs">
            <Link href="/cookies" className="ui-link inline-flex items-center gap-1 font-medium">
              <FileText size={12} aria-hidden="true" />
              Preferências de cookie
            </Link>
            <span aria-hidden="true" className="text-border">•</span>
            <Link href="/privacidade" className="ui-link font-medium">
              Política de Privacidade
            </Link>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleAction(acceptAll)}
              className="flex-1 ui-btn ui-btn--sm ui-btn--primary"
            >
              Permitir monitoramento
            </button>
            <button
              type="button"
              onClick={() => handleAction(rejectAll)}
              className="ui-btn ui-btn--sm"
            >
              Recusar
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
