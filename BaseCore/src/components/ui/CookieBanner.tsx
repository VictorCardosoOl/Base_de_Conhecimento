import React, { useRef, useState } from 'react';
import { useConsent } from '../../contexts/ConsentContext';
import { ShieldCheck, Cookie, FileText } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const CookieBanner: React.FC = () => {
  const {
    consent,
    acceptAll,
    rejectAll,
    setOpenLegalModal,
    setActiveLegalTab,
  } = useConsent();

  const containerRef = useRef<HTMLElement>(null);
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
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.22,
        ease: 'power3.in',
        onComplete: action
      });
    } else {
      action();
    }
  };

  // Não renderiza se o usuário já expressou consentimento e não está fechando
  if (consent !== 'pending' && !isClosing) return null;

  return (
    <aside
      ref={containerRef}
      role="region"
      aria-label="Consentimento de Cookies e Privacidade"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[80] p-5 rounded-2xl bg-bg-island border border-border shadow-2xl text-text-main transform-gpu will-change-[transform,opacity]"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-bg-island border border-border text-text-main shrink-0 mt-0.5">
          <Cookie size={20} strokeWidth={1.75} />
        </div>

        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-text-main">
              Privacidade & Conformidade LGPD
            </h3>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-text-main text-bg-main">
              <ShieldCheck size={11} />
              Protegido
            </span>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Utilizamos cookies e tecnologias estritamente necessárias para o
            funcionamento e, sob sua autorização expressa, telemetria de
            desempenho anônima. Nenhuma ferramenta de terceiros é executada
            sem o seu consentimento prévio.
          </p>

          <div className="flex items-center gap-3 pt-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveLegalTab('privacy');
                setOpenLegalModal(true);
              }}
              className="underline text-text-muted hover:text-text-main transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              <FileText size={12} />
              Políticas de Privacidade
            </button>
            <span className="text-border">•</span>
            <button
              type="button"
              onClick={() => {
                setActiveLegalTab('terms');
                setOpenLegalModal(true);
              }}
              className="underline text-text-muted hover:text-text-main transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              Termos de Uso
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleAction(acceptAll)}
              className="flex-1 px-3.5 py-2 text-xs font-semibold rounded-xl bg-text-main text-bg-main hover:opacity-90 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
            >
              Aceitar Todos
            </button>
            <button
              type="button"
              onClick={() => handleAction(rejectAll)}
              className="px-3.5 py-2 text-xs font-medium rounded-xl border border-border bg-bg-island hover:bg-text-main hover:text-bg-main text-text-main active:scale-[0.98] transition-all cursor-pointer"
            >
              Recusar
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
