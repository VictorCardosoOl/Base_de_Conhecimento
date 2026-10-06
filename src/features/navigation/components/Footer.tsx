import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

const GithubIcon = ({ size = 20, strokeWidth = 1.5, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
  </svg>
);

const InstagramIcon = ({ size = 20, strokeWidth = 1.5, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
  </svg>
);

const MessageCircleIcon = ({ size = 20, strokeWidth = 1.5, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>
  </svg>
);

export const Footer = () => {
  return (
    <footer className="w-full bg-bg-main text-text-body font-sans selection:bg-selection border-t border-border mt-12 pt-16 pb-8">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-start gap-12">
        
        {/* Left Side: Logo & Columns */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 w-full lg:w-auto">
          {/* Logo / Icon */}
          <div className="flex-shrink-0">
            <BookOpen size={48} className="text-text-main" strokeWidth={1} />
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 lg:gap-24">
            
            {/* Column 1: Módulos */}
            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-widest font-semibold text-text-main mb-2">
                Módulos
              </span>
              <ul className="flex flex-col gap-3">
                <li><Link href="/?category=eSocial" className="text-sm text-text-muted hover:text-text-main transition-colors">eSocial</Link></li>
                <li><Link href="/?category=GRO" className="text-sm text-text-muted hover:text-text-main transition-colors">GRO / PGR</Link></li>
                <li><Link href="/?category=Eventos" className="text-sm text-text-muted hover:text-text-main transition-colors">Eventos SST</Link></li>
                <li><Link href="/?category=Informacoes" className="text-sm text-text-muted hover:text-text-main transition-colors">Informações</Link></li>
                <li><Link href="/?category=Coletivo" className="text-sm text-text-muted hover:text-text-main transition-colors">Coletivo</Link></li>
              </ul>
            </div>

            {/* Column 2: Explorar */}
            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-widest font-semibold text-text-main mb-2">
                Explorar
              </span>
              <ul className="flex flex-col gap-3">
                <li><Link href="/" className="text-sm text-text-muted hover:text-text-main transition-colors">Página Inicial</Link></li>
                <li><Link href="/sobre" className="text-sm text-text-muted hover:text-text-main transition-colors">O Projeto</Link></li>
                <li><Link href="/minha-lista" className="text-sm text-text-muted hover:text-text-main transition-colors">Trilhas & Lista</Link></li>
                <li><Link href="#" className="text-sm text-text-muted hover:text-text-main transition-colors">Diretrizes</Link></li>
                <li><Link href="/login" className="text-sm text-text-muted hover:text-text-main transition-colors">Login Admin</Link></li>
              </ul>
            </div>

            {/* Column 3: Contato */}
            <div className="flex flex-col gap-4">
              <span className="text-xs uppercase tracking-widest font-semibold text-text-main mb-2">
                Conecte-se
              </span>
              <div className="flex flex-col gap-4">
                <a href="mailto:contato@sst.com" className="text-sm text-text-muted hover:text-text-main transition-colors">
                  suporte@basesst.br
                </a>
                
                <div className="flex items-center gap-3 mt-2">
                  <a href="#" className="w-8 h-8 rounded-full border border-text-muted flex items-center justify-center text-text-muted hover:text-text-main hover:border-text-main transition-colors" aria-label="Instagram">
                    <InstagramIcon size={14} />
                  </a>
                  <a href="#" className="w-8 h-8 rounded-full border border-text-muted flex items-center justify-center text-text-muted hover:text-text-main hover:border-text-main transition-colors" aria-label="WhatsApp">
                    <MessageCircleIcon size={14} />
                  </a>
                  <a href="https://github.com/VictorCardosoOl/Base_de_Conhecimento" className="w-8 h-8 rounded-full border border-text-muted flex items-center justify-center text-text-muted hover:text-text-main hover:border-text-main transition-colors" aria-label="GitHub">
                    <GithubIcon size={14} />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Newsletter & Giant Text */}
        <div className="flex flex-col items-start lg:items-end w-full lg:w-auto flex-grow justify-between">
          
          <div className="w-full max-w-sm mb-12 lg:mb-0">
            <span className="text-xs uppercase tracking-widest font-semibold text-text-main mb-4 block lg:text-right">
              Receba Atualizações
            </span>
            <div className="relative">
              <input 
                type="email" 
                placeholder="Seu e-mail" 
                className="w-full bg-transparent border border-text-main rounded-full py-3 px-6 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-text-main"
              />
              <button 
                type="button" 
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-text-main hover:opacity-70 transition-opacity"
                aria-label="Inscrever-se"
              >
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="mt-auto w-full text-left lg:text-right">
            <h2 className="font-serif text-[12vw] sm:text-[10vw] lg:text-[7vw] xl:text-[8vw] leading-[0.85] tracking-tighter text-text-main uppercase">
              Base<br />SST
            </h2>
          </div>
          
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 mt-20 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] uppercase tracking-widest text-text-muted">
        <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
          <span>Design by Victor Cardoso</span>
          <span>© {new Date().getFullYear()} Base SST</span>
        </div>
        <div className="flex items-center gap-6 flex-wrap justify-center md:justify-end">
          <Link href="#" className="hover:text-text-main transition-colors">Termos</Link>
          <Link href="#" className="hover:text-text-main transition-colors">Privacidade</Link>
          <Link href="#" className="hover:text-text-main transition-colors">Cookies</Link>
        </div>
      </div>
    </footer>
  );
};
