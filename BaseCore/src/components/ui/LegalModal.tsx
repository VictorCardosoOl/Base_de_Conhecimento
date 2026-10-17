import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useConsent } from '../../contexts/ConsentContext';
import {
  X,
  ShieldCheck,
  FileText,
  Lock,
  Scale,
  Server,
  Cpu,
  Check,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { useScopedLenis } from '@/hooks/use-scoped-lenis';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const LegalModal: React.FC = () => {
  const {
    openLegalModal,
    setOpenLegalModal,
    activeLegalTab,
    setActiveLegalTab,
    consent,
    acceptAll,
    resetConsent,
  } = useConsent();
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);

  // Lenis scoped — gerenciado pelo hook centralizado (use-scoped-lenis.ts)
  useScopedLenis(modalContainerRef, modalContentRef, openLegalModal);

  // Handle open/close animations
  useGSAP(() => {
    if (openLegalModal) {
      setMounted(true);
    } else if (mounted) {
      // Animate out
      const tl = gsap.timeline({
        onComplete: () => setMounted(false)
      });
      if (backdropRef.current) tl.to(backdropRef.current, { opacity: 0, duration: 0.22, ease: 'power3.in' }, 0);
      if (dialogRef.current) tl.to(dialogRef.current, { y: '100vh', duration: 0.5, ease: 'power3.in' }, 0);
    }
  }, [openLegalModal]);

  useGSAP(() => {
    if (mounted && openLegalModal) {
      // Animate in
      if (backdropRef.current) gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.38, ease: 'power4.out' });
      if (dialogRef.current) gsap.fromTo(dialogRef.current, { y: '100vh' }, { y: 0, duration: 0.6, ease: 'power4.out' });
    }
  }, [mounted]);


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

  // Gestão de overflow do body
  useEffect(() => {
    if (openLegalModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [openLegalModal]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop Fosco com Blur */}
      <div
        ref={backdropRef}
        onClick={() => setOpenLegalModal(false)}
        className="fixed inset-0 bg-black/95 z-[110] will-change-[opacity]"
      />

      {/* Modal Container Esculpido */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        className="fixed inset-x-0 bottom-0 top-[4vh] sm:top-[6vh] z-[120] max-w-4xl mx-auto bg-bg-main border-x border-t border-border rounded-t-2xl sm:rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col transform-gpu will-change-[transform,opacity]"
      >
        {/* Header Fixo com Identidade Editorial */}
        <header className="shrink-0 bg-bg-main border-b border-border px-6 sm:px-10 py-5 z-20 flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
              <span className="inline-flex items-center gap-1 text-text-main">
                <ShieldCheck size={13} strokeWidth={2} />
                Governança Corporativa
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>LGPD • Lei 13.709/2018</span>
            </div>
            <h2
              id="legal-modal-title"
              className="text-xl sm:text-2xl 2xl:text-3xl font-serif font-light tracking-tight text-text-main truncate"
            >
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

            {/* Abas Superiores de NavegaÃ§Ã£o */}
            <nav
              className="shrink-0 bg-bg-island border-b border-border px-6 sm:px-10 flex gap-8 z-10"
              aria-label="Abas jurÃ­dicas"
            >
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
                1. PolÃ­ticas de Privacidade & LGPD
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
                2. Termos de ServiÃ§o & SLA
              </button>
            </nav>

            {/* ConteÃºdo com Scroll PrÃ³prio e Lenis Ativo */}
            <div
              ref={modalContainerRef}
              className="flex-1 overflow-y-auto overscroll-contain px-6 sm:px-12 py-8 sm:py-10 no-scrollbar focus:outline-none"
              tabIndex={0}
            >
              <div
                ref={modalContentRef}
                className="max-w-3xl mx-auto space-y-8 pb-12"
              >
                {activeLegalTab === 'privacy' && (
                  <article className="space-y-8 text-text-body">
                    {/* Badge Informativo de Consent Gate */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-bg-island border border-border flex items-start gap-3.5">
                      <div className="p-2 rounded-xl bg-text-main text-bg-main shrink-0 mt-0.5">
                        <ShieldCheck size={18} strokeWidth={2} />
                      </div>
                      <div className="space-y-1 text-xs leading-relaxed">
                        <h4 className="font-semibold text-text-main">
                          PrincÃ­pio do Privacy by Default & Consent Gate Ativo
                        </h4>
                        <p className="text-text-muted">
                          Esta plataforma opera sob bloqueio tÃ©cnico rigoroso
                          de qualquer rastreador ou telemetria de terceiros atÃ©
                          que haja manifestaÃ§Ã£o de vontade expressa do
                          titular. Seu status atual de consentimento:{' '}
                          <strong className="uppercase font-mono text-bg-main px-1.5 py-0.5 rounded bg-text-main">
                            {consent}
                          </strong>
                          .
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-2xl sm:text-3xl font-serif font-normal text-text-main leading-tight">
                        1. PolÃ­ticas de Privacidade e Conformidade com a LGPD
                      </h3>
                      <p className="text-sm sm:text-base text-text-muted font-serif leading-relaxed">
                        A presente PolÃ­tica de Privacidade e Termos de Uso tem
                        como objetivo esclarecer como tratamos e protegemos seus
                        dados, estabelecendo regras de integridade dos serviÃ§os
                        desenvolvidos. Ao navegar nesta base, vocÃª concorda com
                        as diretrizes descritas.
                      </p>
                    </div>

                    <div className="h-[1px] bg-border" />

                    <section className="space-y-3">
                      <h4 className="text-base sm:text-lg font-semibold text-text-main">
                        1.1. Coleta e Tratamento de Dados
                      </h4>
                      <p className="text-sm sm:text-base text-text-body/90 leading-relaxed">
                        Nosso compromisso com a Lei Geral de ProteÃ§Ã£o de Dados
                        (LGPD - Lei nÂº 13.709/2018) Ã© absoluto. Coletamos
                        estritamente o indispensÃ¡vel para a usabilidade e
                        seguranÃ§a da aplicaÃ§Ã£o, operando sob os princÃ­pios
                        de finalidade, necessidade e transparÃªncia.
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-base sm:text-lg font-semibold text-text-main">
                        1.2. Gerenciamento de Cookies e Scripts de Terceiros
                      </h4>
                      <p className="text-sm sm:text-base text-text-body/90 leading-relaxed">
                        Para assegurar conformidade integral com a LGPD,
                        implementamos um sistema de{' '}
                        <strong>Consent Gate</strong> nativo. Nenhum script de
                        terceiros (incluindo ferramentas de analytics,
                        monitoramento de performance ou rastreadores externos)
                        Ã© executado antes da aprovaÃ§Ã£o explÃ­cita fornecida
                        pelo usuÃ¡rio no banner de privacidade. Ã‰ garantido o
                        direito irrevogÃ¡vel de alterar ou redefinir suas
                        preferÃªncias a qualquer momento.
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-base sm:text-lg font-semibold text-text-main">
                        1.3. SeguranÃ§a e LimitaÃ§Ã£o de Responsabilidade sobre
                        Incidentes CibernÃ©ticos
                      </h4>
                      <p className="text-sm sm:text-base text-text-body/90 leading-relaxed">
                        A Plataforma emprega padrÃµes atualizados e rigorosos de
                        seguranÃ§a da informaÃ§Ã£o, incorporando sanitizaÃ§Ã£o
                        de dados, blindagem contra ataques XSS/CSRF,
                        criptografia e infraestrutura resiliente. Contudo,
                        nenhum ecossistema digital Ã© categoricamente
                        invulnerÃ¡vel.
                      </p>

                      <div className="p-5 rounded-2xl bg-bg-island border border-text-main text-xs sm:text-sm text-text-main italic leading-relaxed space-y-2">
                        <p>
                          "A Plataforma declara adotar padrÃµes rigorosos e
                          atualizados de seguranÃ§a da informaÃ§Ã£o aplicÃ¡veis
                          ao mercado para proteger os dados armazenados. NÃ£o
                          obstante, o Cliente reconhece que nenhum sistema
                          tecnolÃ³gico Ã© integralmente inviolÃ¡vel. A
                          Plataforma restarÃ¡ expressamente isenta de
                          responsabilidade civil, solidÃ¡ria ou subsidiÃ¡ria por
                          eventuais incidentes de seguranÃ§a, vazamentos de
                          dados ou acessos nÃ£o autorizados decorrentes de
                          ataques cibernÃ©ticos de alta complexidade,
                          vulnerabilidades desconhecidas ('zero-day') ou falhas
                          crÃ­ticas e imprevisÃ­veis na infraestrutura dos
                          provedores de hospedagem terceirizados, desde que a
                          Plataforma comprove a adoÃ§Ã£o prudente das melhores
                          prÃ¡ticas de seguranÃ§a preventivas e corretivas
                          exigidas pela legislaÃ§Ã£o vigente."
                        </p>
                        <p className="not-italic text-xs text-text-muted font-sans font-medium">
                          Em eventos de forÃ§a maior, as responsabilidades
                          limitam-se ao protocolo legal de notificaÃ§Ã£o aos
                          titulares e Ã  Autoridade Nacional de ProteÃ§Ã£o de
                          Dados (ANPD).
                        </p>
                      </div>
                    </section>
                  </article>
                )}

                {activeLegalTab === 'terms' && (
                  <article className="space-y-8 text-text-body">
                    <div className="space-y-3">
                      <h3 className="text-2xl sm:text-3xl font-serif font-normal text-text-main leading-tight">
                        2. Termos de ServiÃ§o e Uso da AplicaÃ§Ã£o
                      </h3>
                      <p className="text-sm sm:text-base text-text-muted font-serif leading-relaxed">
                        Diretrizes de disponibilidade, governanÃ§a tÃ©cnica,
                        licenciamento e propriedade intelectual do sistema.
                      </p>
                    </div>

                    <div className="h-[1px] bg-border" />

                    <section className="space-y-3">
                      <h4 className="text-base sm:text-lg font-semibold text-text-main flex items-center gap-2">
                        <Server size={18} className="text-text-main" />
                        2.1. ClÃ¡usula de NÃ­vel de ServiÃ§o (SLA) e ForÃ§a
                        Maior
                      </h4>
                      <p className="text-sm sm:text-base text-text-body/90 leading-relaxed">
                        Empenhamos os mais altos padrÃµes tÃ©cnicos para manter
                        disponibilidade ininterrupta. No entanto, para
                        proteÃ§Ã£o dos ativos de informaÃ§Ã£o e resposta a
                        ameaÃ§as crÃ­ticas, aplica-se o seguinte regime de
                        contingÃªncia:
                      </p>

                      <div className="p-5 rounded-2xl bg-bg-island border border-text-main text-xs sm:text-sm text-text-main italic leading-relaxed">
                        "A Plataforma se compromete a empreender os melhores
                        esforÃ§os para garantir a disponibilidade contÃ­nua dos
                        serviÃ§os. Fica estabelecido, contudo, que
                        interrupÃ§Ãµes de acesso causadas por eventos de forÃ§a
                        maior, incluindo, mas nÃ£o se limitando a, ataques de
                        negaÃ§Ã£o de serviÃ§o (DDoS), instabilidades sistÃªmicas
                        no provedor de hospedagem em nuvem ou falhas de
                        infraestrutura de telecomunicaÃ§Ãµes de terceiros, que
                        resultem em indisponibilidade temporÃ¡ria de atÃ© 72
                        (setenta e duas) horas consecutivas, nÃ£o configurarÃ£o
                        falha na prestaÃ§Ã£o de serviÃ§o, quebra contratual ou
                        ensejarÃ£o qualquer tipo de penalidade, multa,
                        abatimento ou direito a indenizaÃ§Ã£o ao
                        UsuÃ¡rio/Cliente."
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-base sm:text-lg font-semibold text-text-main flex items-center gap-2">
                        <Cpu size={18} className="text-text-main" />
                        2.2. Propriedade Intelectual sobre Desenvolvimentos
                        Customizados
                      </h4>
                      <p className="text-sm sm:text-base text-text-body/90 leading-relaxed">
                        Todo o cÃ³digo-fonte, arquitetura, design visual e
                        organizaÃ§Ã£o dos serviÃ§os permanecem como propriedade
                        intelectual intransferÃ­vel da Plataforma e seus
                        autores.
                      </p>

                      <div className="p-5 rounded-2xl bg-bg-island border border-text-main text-xs sm:text-sm text-text-main italic leading-relaxed">
                        "Quaisquer solicitaÃ§Ãµes de customizaÃ§Ã£o, novas
                        funcionalidades, mÃ³dulos especÃ­ficos ou integraÃ§Ãµes
                        ('Features Customizadas') demandadas pelo Cliente e
                        desenvolvidas pela Plataforma constituirÃ£o propriedade
                        intelectual exclusiva, integral e definitiva da
                        Plataforma e de seus desenvolvedores. Fica outorgada ao
                        Cliente, restritamente durante a vigÃªncia deste
                        instrumento, uma licenÃ§a de uso revogÃ¡vel,
                        intransferÃ­vel e nÃ£o exclusiva sobre a funcionalidade.
                        A Plataforma reserva-se o direito irrevogÃ¡vel e
                        irrestrito de reaproveitar, comercializar, modificar ou
                        integrar o cÃ³digo-fonte, a arquitetura e a lÃ³gica de
                        programaÃ§Ã£o das referidas customizaÃ§Ãµes em outros
                        projetos ou para outros clientes, sem a necessidade de
                        autorizaÃ§Ã£o prÃ©via, compensaÃ§Ã£o financeira ou
                        repasse de royalties."
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h4 className="text-base sm:text-lg font-semibold text-text-main">
                        2.3. AtualizaÃ§Ãµes destes Termos
                      </h4>
                      <p className="text-sm sm:text-base text-text-body/90 leading-relaxed">
                        Estes termos podem ser atualizados periodicamente para
                        acompanhar inovaÃ§Ãµes tÃ©cnicas ou atualizaÃ§Ãµes
                        regulatÃ³rias da ANPD e da legislaÃ§Ã£o brasileira.
                      </p>
                    </section>
                  </article>
                )}
              </div>
            </div>

            {/* Footer Fixo com GestÃ£o de Consentimento */}
            <footer className="shrink-0 bg-bg-island  border-t border-border px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4 text-xs z-20">
              <div className="flex items-center gap-2.5">
                <span className="text-text-muted">Seu consentimento:</span>
                <span
                  className={`font-mono uppercase font-semibold px-2.5 py-1 rounded-md text-[11px] border ${
                    consent === 'granted'
                      ? 'bg-text-main text-bg-main border-text-main'
                      : consent === 'denied'
                        ? 'bg-bg-island text-text-main border-text-main'
                        : 'bg-bg-main text-text-main border-border'
                  }`}
                >
                  {consent === 'granted'
                    ? 'Aceito (Analytics Ativo)'
                    : consent === 'denied'
                      ? 'Recusado (Bloqueio Total)'
                      : 'Pendente'}
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
          </div>
        </>
    ,
    document.body
  );
};
