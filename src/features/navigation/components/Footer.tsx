import React from 'react';

const GithubIcon = ({ size = 20, strokeWidth = 1.5, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
  </svg>
);

export const Footer = () => {
  return (
    <footer className="w-full bg-bg-main text-text-main pt-24 pb-8 px-6 md:px-12 2xl:px-16 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-end h-full w-full gap-12 max-w-screen-3xl mx-auto">
        
        {/* Left Side: Huge Typography */}
        <div className="flex flex-col font-sans font-black tracking-tighter leading-[0.8] uppercase text-[14vw] md:text-[10vw] md:-ml-2">
          <span className="block">BASE DE</span>
          <span className="block">CONHECIMENTO</span>
        </div>

        {/* Right Side: Icons and Copyright */}
        <div className="flex flex-col justify-between h-full items-end pb-2 md:pb-4 space-y-16 md:space-y-32">
          {/* Icons */}
          <div className="flex items-center gap-6 text-text-main">
            <a href="https://github.com/VictorCardosoOl/Base_de_Conhecimento" target="_blank" rel="noopener noreferrer" className="hover:opacity-50 transition-opacity" aria-label="GitHub">
              <GithubIcon size={22} strokeWidth={1.5} />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-right flex flex-col items-end">
            <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.2em] text-text-muted leading-relaxed text-right max-w-[220px]">
              © 2026 BASE DE CONHECIMENTO. TODOS OS DIREITOS RESERVADOS.
            </p>
            <p className="font-serif italic text-text-muted mt-2 text-xs tracking-wide opacity-80">
              Design Is Thinking Made Visual.
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};
