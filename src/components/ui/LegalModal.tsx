import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useConsent } from '../../contexts/ConsentContext';
import { X, ShieldCheck, FileText, Lock, Scale, Server, Cpu, Check, RotateCcw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';

export const LegalModal: React.FC = () => {
  const { openLegalModal, setOpenLegalModal, activeLegalTab, setActiveLegalTab, consent, acceptAll, resetConsent } = useConsent();
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const scopedLenisRef = useRef<Lenis | null>(null);

  // Escuta tecla ESC para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openLegalModal) {
        setOpenLegalModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openLegalModal, setOpenLegalModal]);

  // Gestão de overflow do body + inicialização de Lenis escopado ao modal
  useEffect(() => {
    let rafId: number | null = null;
    let timer: NodeJS.Timeout | null = null;
    let destroyed = false;

    if (openLegalModal) {
      document.body.style.overflow = 'hidden';

      timer = setTimeout(() => {
        if (!destroyed && modalContainerRef.current && modalContentRef.current) {
          const scopedLenis = new Lenis({
            wrapper: modalContainerRef.current,
            content: modalContentRef.current,
            duration: 0.5,
            easing: (t) => 1 - Math.pow(1 - t, 4),
            orientation: 'vertical',
            touchMultiplier: 1.5,
          });
          scopedLenisRef.current = scopedLenis;

          function raf(time: number) {
            if (destroyed) return;
            scopedLenis.raf(time);
            rafId = requestAnimationFrame(raf);
          }
          rafId = requestAnimationFrame(raf);
        }
      }, 30);
    } else {
      document.body.style.overflow = '';
      if (rafId) cancelAnimationFrame(rafId);
      scopedLenisRef.current?.destroy();
      scopedLenisRef.current = null;
    }

    return () => {
      destroyed = true;
      document.body.style.overflow = '';
      if (timer) clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
      scopedLenisRef.current?.destroy();
      scopedLenisRef.current = null;
    };
  }, [openLegalModal]);

  if (!openLegalModal) return null;

  return createPortal(
    <AnimatePresence>
      {openLegalModal && (
        <>
          {/* Backdrop Fosco com Blur */}
          <motion.div
            onClick={() => setOpenLegalModal(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[110] will-change-[opacity]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.15 } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
          />

          {/* Modal Container Esculpido */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, y: 12, transition: { duration: 0.12, ease: [0.2, 0, 0, 1] } }}
            className="fixed inset-x-0 bottom-0 top-[4vh] sm:top-[6vh] z-[120] max-w-4xl mx-auto bg-bg-main border-x border-t border-border rounded-t-2xl sm:rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col transform-gpu will-change-[transform,opacity]"
          >
            {/* Header Fixo com Identidade Editorial */}
            <header className="shrink-0 bg-bg-main/95 backdrop-blur-md border-b border-border px-6 sm:px-10 py-5 z-20 flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                  <span className="inline-flex items-center gap-1 text-text-main">
                    <ShieldCheck size={13} strokeWidth={2} />
                    Governança Corporativa
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>LGPD • Lei 13.709/2018</span>
                </div>
                <h2 id="legal-modal-title" className="text-xl sm:text-2xl 2xl:text-3xl font-serif font-light tracking-tight text-text-main truncate">
                  Termos de Uso & Políticas de Privacidade
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setOpenLegalModal(false)}
                aria-label="Fechar janela jurídica"
                className="p-2.5 rounded-full hover:bg-text-main hover:text-bg-main text-text-muted transition-colors shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </header>

            {/* Abas Superiores de Navegação */}
            <nav className="shrink-0 bg-bg-island border-b border-border px-6 sm:px-10 flex gap-8 z-10" aria-label="Abas jurídicas">
              <button
                type="button"
                onClick={() => setActiveLegalTab('privacy')}
                className={`py-3.5 text-xs sm:text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeLegalTab === 'privacy'
                    ? 'border-text-main text-text-main'
                    : 'border-transparent text-text-muted hover:text-text-main opacity-70 hover:opacity-100'
                }`}
              >
                <Lock size={15} />
                1. Políticas de Privacidade & LGPD
              </button>
              <button
                type="button"
                onClick={() => setActiveLegalTab('terms')}
                className={`py-3.5 text-xs sm:text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeLegalTab === 'terms'
                    ? 'border-text-main text-text-main'
                    : 'border-transparent text-text-muted hover:text-text-main opacity-70 hover:opacity-100'
                }`}
              >
                <FileText size={15} />
                2. Termos de Serviço & SLA
              </button>
            </nav>

            {/* Conteúdo com Scroll Próprio e Lenis Ativo */}
            <div
              ref={modalContainerRef}
              className="flex-1 overflow-y-auto overscroll-contain px-6 sm:px-12 py-8 sm:py-10 no-scrollbar focus:outline-none"
              tabIndex={0}
            >
              <div ref={modalContentRef} className="max-w-3xl mx-auto space-y-8 pb-12">
                {activeLegalTab === 'privacy' && (
                  <article className="space-y-8 text-text-body">
                    {/* Badge Informativo de Consent Gate */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-bg-island border border-border flex items-start gap-3.5">
                      <div className="p-2 rounded-xl bg-text-main text-bg-main shrink-0 mt-0.5">
                        <ShieldCheck size={18} strokeWidth={2} />
                      </div>
                      <div className="space-y-1 text-xs leading-relaxed">
                        <h4 className="font-semibold text-text-main">
                          Princípio do Privacy by Default & Consent Gate Ativo
                        </h4>
                        <p className="text-text-muted">
                          Esta plataforma opera sob bloqueio técnico rigoroso de qualquer rastreador ou telemetria de terceiros até que haja manifestação de vontade expressa do titular. Seu status atual de consentimento: <strong className="uppercase font-mono text-bg-main px-1.5 py-0.5 rounded bg-text-main">{consent}</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-2xl sm:text-3xl font-serif font-normal text-text-main leading-tight">
                        1. Políticas de Privacidade e Conformidade com a LGPD
                      </h3>
                      <p className="text-sm sm:text-base text-text-muted font-serif leading-relaxed">
                        A presente Política de Privacidade e Termos de Uso tem como objetivo esclarecer como tratamos e protegemos seus dados, estabelecendo regras de integridade dos serviços desenvolvidos. Ao navegar nesta base, você concorda com as diretrizes descritas.
                      </p>
                    </div>

                    <div className="h-[1px] bg-border" />

                    <section className="space-y-3">
                      <h4 className="text-base sm:text-lg font-semibold text-text-main">
                        1.1. Coleta e Tratamento de Dados
                      </h4>
                      <p className="text-sm sm:text-base text-text-body/90 leading-relaxed">
                        Nosso compromisso com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) é absoluto. Coletamos estritamente o indispensável para a usabilidade e segurança da aplicação, operando sob os princípios de finalidade, necessidade e transparência.
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-base sm:text-lg font-semibold text-text-main">
                        1.2. Gerenciamento de Cookies e Scripts de Terceiros
                      </h4>
                      <p className="text-sm sm:text-base text-text-body/90 leading-relaxed">
                        Para assegurar conformidade integral com a LGPD, implementamos um sistema de <strong>Consent Gate</strong> nativo. Nenhum script de terceiros (incluindo ferramentas de analytics, monitoramento de performance ou rastreadores externos) é executado antes da aprovação explícita fornecida pelo usuário no banner de privacidade. É garantido o direito irrevogável de alterar ou redefinir suas preferências a qualquer momento.
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-base sm:text-lg font-semibold text-text-main">
                        1.3. Segurança e Limitação de Responsabilidade sobre Incidentes Cibernéticos
                      </h4>
                      <p className="text-sm sm:text-base text-text-body/90 leading-relaxed">
                        A Plataforma emprega padrões atualizados e rigorosos de segurança da informação, incorporando sanitização de dados, blindagem contra ataques XSS/CSRF, criptografia e infraestrutura resiliente. Contudo, nenhum ecossistema digital é categoricamente invulnerável.
                      </p>

                      <div className="p-5 rounded-2xl bg-bg-island border border-text-main text-xs sm:text-sm text-text-main italic leading-relaxed space-y-2">
                        <p>
                          "A Plataforma declara adotar padrões rigorosos e atualizados de segurança da informação aplicáveis ao mercado para proteger os dados armazenados. Não obstante, o Cliente reconhece que nenhum sistema tecnológico é integralmente inviolável. A Plataforma restará expressamente isenta de responsabilidade civil, solidária ou subsidiária por eventuais incidentes de segurança, vazamentos de dados ou acessos não autorizados decorrentes de ataques cibernéticos de alta complexidade, vulnerabilidades desconhecidas ('zero-day') ou falhas críticas e imprevisíveis na infraestrutura dos provedores de hospedagem terceirizados, desde que a Plataforma comprove a adoção prudente das melhores práticas de segurança preventivas e corretivas exigidas pela legislação vigente."
                        </p>
                        <p className="not-italic text-xs text-text-muted font-sans font-medium">
                          Em eventos de força maior, as responsabilidades limitam-se ao protocolo legal de notificação aos titulares e à Autoridade Nacional de Proteção de Dados (ANPD).
                        </p>
                      </div>
                    </section>
                  </article>
                )}

                {activeLegalTab === 'terms' && (
                  <article className="space-y-8 text-text-body">
                    <div className="space-y-3">
                      <h3 className="text-2xl sm:text-3xl font-serif font-normal text-text-main leading-tight">
                        2. Termos de Serviço e Uso da Aplicação
                      </h3>
                      <p className="text-sm sm:text-base text-text-muted font-serif leading-relaxed">
                        Diretrizes de disponibilidade, governança técnica, licenciamento e propriedade intelectual do sistema.
                      </p>
                    </div>

                    <div className="h-[1px] bg-border" />

                    <section className="space-y-3">
                      <h4 className="text-base sm:text-lg font-semibold text-text-main flex items-center gap-2">
                        <Server size={18} className="text-text-main" />
                        2.1. Cláusula de Nível de Serviço (SLA) e Força Maior
                      </h4>
                      <p className="text-sm sm:text-base text-text-body/90 leading-relaxed">
                        Empenhamos os mais altos padrões técnicos para manter disponibilidade ininterrupta. No entanto, para proteção dos ativos de informação e resposta a ameaças críticas, aplica-se o seguinte regime de contingência:
                      </p>

                      <div className="p-5 rounded-2xl bg-bg-island border border-text-main text-xs sm:text-sm text-text-main italic leading-relaxed">
                        "A Plataforma se compromete a empreender os melhores esforços para garantir a disponibilidade contínua dos serviços. Fica estabelecido, contudo, que interrupções de acesso causadas por eventos de força maior, incluindo, mas não se limitando a, ataques de negação de serviço (DDoS), instabilidades sistêmicas no provedor de hospedagem em nuvem ou falhas de infraestrutura de telecomunicações de terceiros, que resultem em indisponibilidade temporária de até 72 (setenta e duas) horas consecutivas, não configurarão falha na prestação de serviço, quebra contratual ou ensejarão qualquer tipo de penalidade, multa, abatimento ou direito a indenização ao Usuário/Cliente."
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-base sm:text-lg font-semibold text-text-main flex items-center gap-2">
                        <Cpu size={18} className="text-text-main" />
                        2.2. Propriedade Intelectual sobre Desenvolvimentos Customizados
                      </h4>
                      <p className="text-sm sm:text-base text-text-body/90 leading-relaxed">
                        Todo o código-fonte, arquitetura, design visual e organização dos serviços permanecem como propriedade intelectual intransferível da Plataforma e seus autores.
                      </p>

                      <div className="p-5 rounded-2xl bg-bg-island border border-text-main text-xs sm:text-sm text-text-main italic leading-relaxed">
                        "Quaisquer solicitações de customização, novas funcionalidades, módulos específicos ou integrações ('Features Customizadas') demandadas pelo Cliente e desenvolvidas pela Plataforma constituirão propriedade intelectual exclusiva, integral e definitiva da Plataforma e de seus desenvolvedores. Fica outorgada ao Cliente, restritamente durante a vigência deste instrumento, uma licença de uso revogável, intransferível e não exclusiva sobre a funcionalidade. A Plataforma reserva-se o direito irrevogável e irrestrito de reaproveitar, comercializar, modificar ou integrar o código-fonte, a arquitetura e a lógica de programação das referidas customizações em outros projetos ou para outros clientes, sem a necessidade de autorização prévia, compensação financeira ou repasse de royalties."
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-base sm:text-lg font-semibold text-text-main">
                        2.3. Atualizações destes Termos
                      </h4>
                      <p className="text-sm sm:text-base text-text-body/90 leading-relaxed">
                        Estes termos podem ser atualizados periodicamente para acompanhar inovações técnicas ou atualizações regulatórias da ANPD e da legislação brasileira.
                      </p>
                    </section>
                  </article>
                )}
              </div>
            </div>

            {/* Footer Fixo com Gestão de Consentimento */}
            <footer className="shrink-0 bg-bg-island/90 backdrop-blur-md border-t border-border px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4 text-xs z-20">
              <div className="flex items-center gap-2.5">
                <span className="text-text-muted">Seu consentimento:</span>
                <span className={`font-mono uppercase font-semibold px-2.5 py-1 rounded-md text-[11px] border ${
                  consent === 'granted'
                    ? 'bg-text-main text-bg-main border-text-main'
                    : consent === 'denied'
                    ? 'bg-bg-island text-text-main border-text-main'
                    : 'bg-bg-main text-text-main border-border'
                }`}>
                  {consent === 'granted' ? 'Aceito (Analytics Ativo)' : consent === 'denied' ? 'Recusado (Bloqueio Total)' : 'Pendente'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={resetConsent}
                  className="px-3.5 py-2 rounded-xl border border-border hover:bg-text-main hover:text-bg-main text-text-main font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Redefinir</span>
                </button>

                {consent !== 'granted' && (
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="px-4 py-2 rounded-xl bg-text-main text-bg-main font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Check size={14} />
                    <span>Conceder Aceite</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setOpenLegalModal(false)}
                  className="px-5 py-2 rounded-xl bg-text-main text-bg-main font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer border border-text-main"
                >
                  Concluir
                </button>
              </div>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
