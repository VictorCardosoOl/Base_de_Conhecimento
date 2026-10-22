'use client';
import React, { useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { useBrowserSnapshot } from '@/hooks/use-browser-snapshot';

// O efeito usa WebGL/canvas: só no navegador.
const DitherVeil = dynamic(() => import('@/components/ui/DitherVeil'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black/5" />,
});

/**
 * O efeito exige WebGL: sem ele (navegador antigo, WebGL desligado), o componente
 * lança erro ao montar e derrubaria a tela de login inteira. Nesses casos, sem imagem.
 */
function readWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// A coluna da imagem só aparece a partir do breakpoint `md` do Tailwind.
const WIDE_QUERY = '(min-width: 768px)';

function subscribeWide(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function readWide(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(WIDE_QUERY).matches;
}

const readNarrowOnServer = () => false;

/**
 * Layout das telas de acesso (login, cadastro, recuperação de senha): formulário à
 * esquerda e imagem com efeito de pontilhado à direita. Em telas pequenas a imagem some e
 * o efeito nem é carregado (economiza WebGL, bateria e dados no celular). Visual do
 * GitHub; as cores seguem os tokens do tema para continuar legível no modo escuro.
 */
export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  const hasWebGL = useBrowserSnapshot(readWebGLSupport, false);
  const isWide = useSyncExternalStore(subscribeWide, readWide, readNarrowOnServer);
  return (
    <div className="flex items-center justify-center w-full min-h-[calc(100vh-200px)]">
      <div className="glass-card glass-chroma w-full max-w-6xl !rounded-[2.5rem] overflow-hidden text-text-main flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center relative z-10">
          <div className="w-full max-w-md mx-auto">{children}</div>
        </div>
        <div
          aria-hidden="true"
          data-testid="auth-visual"
          className="hidden md:block md:w-1/2 relative min-h-[450px] bg-white"
        >
          {hasWebGL && isWide && (
            <DitherVeil
              src="https://images.unsplash.com/photo-1737071371043-761e02b1ef95?q=80&w=1400&auto=format&fit=crop"
              pattern="floyd"
              pixelSize={2}
              inkColor="#000000"
              paperColor="#ffffff"
              revealRadius={200}
              softness={0.6}
              linger={1}
              fit="contain"
              rimColor="#ffffff"
              palette="duotone"
              levels={2}
              contrast={1.15}
              brightness={0}
              rim={0}
              reverse={false}
              wander={false}
              clickBurst
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                inset: 0,
                filter: 'invert(1)',
                transform: 'scale(1.15)',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
