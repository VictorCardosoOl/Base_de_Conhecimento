import React from 'react';
import { useConsent } from '../../contexts/ConsentContext';
import { ShieldCheck, Cookie, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CookieBanner: React.FC = () => {
  const { consent, acceptAll, rejectAll, setOpenLegalModal, setActiveLegalTab } = useConsent();

  // Não renderiza se o usuário já expressou consentimento (concedido ou negado)
  if (consent !== 'pending') return null;

  return (
    <AnimatePresence>
      <motion.aside
        role="region"
        aria-label="Consentimento de Cookies e Privacidade"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[80] p-5 rounded-2xl glass bg-bg-island/95 border border-border shadow-2xl backdrop-blur-xl text-text-main transform-gpu"
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
              Utilizamos cookies e tecnologias estritamente necessárias para o funcionamento e, sob sua autorização expressa, telemetria de desempenho anônima. Nenhuma ferramenta de terceiros é executada sem o seu consentimento prévio.
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
                onClick={acceptAll}
                className="flex-1 px-3.5 py-2 text-xs font-semibold rounded-xl bg-text-main text-bg-main hover:opacity-90 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
              >
                Aceitar Todos
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className="px-3.5 py-2 text-xs font-medium rounded-xl border border-border bg-bg-island hover:bg-text-main hover:text-bg-main text-text-main active:scale-[0.98] transition-all cursor-pointer"
              >
                Recusar
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
