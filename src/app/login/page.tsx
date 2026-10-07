'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { authenticateAdmin } from '@/actions/auth-actions';
import dynamic from 'next/dynamic';

const DitherVeil = dynamic(() => import('@/components/ui/DitherVeil'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-black/5 animate-pulse" />
});

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useRouter();

  const [honeypot, setHoneypot] = useState('');
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Anti-bot Honeypot check
    if (honeypot) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1500); // Simulate network delay
      return;
    }

    setError('');
    setIsLoading(true);

    const isValid = await authenticateAdmin(email, password);

    if (isValid) {
      // A sessão é criada no servidor como cookie httpOnly (ver auth-actions.ts)
      navigate.push('/admin');
    } else {
      setError(
        'Credenciais incorretas. Verifique seu e-mail e senha.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-[calc(100vh-200px)]">
      {/* Container Principal - Sem bordas, integrando-se à página como um corpo só */}
      <div className="w-full max-w-6xl bg-white text-black flex flex-col md:flex-row">
        
        {/* Lado Esquerdo: Formulário */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative z-10 bg-white">
          <div className="mb-12">
            <h1 className="text-4xl font-bold font-sans tracking-tight mb-3 text-black">
              Acesso Restrito
            </h1>
            <p className="text-[13px] font-mono tracking-wide text-black/50">
              Insira suas credenciais para entrar no painel
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8 flex-grow flex flex-col justify-center max-w-sm">
            {error && (
              <div id="login-error" role="alert" aria-live="polite" className="bg-red-50 text-red-600 p-3 text-xs text-center border border-red-100 font-mono">
                {error}
              </div>
            )}

            {/* Honeypot Field */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <label>Leave this field empty</label>
              <input
                type="text"
                name="contact_number"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="relative group">
              <label htmlFor="email" className="text-[10px] font-bold font-mono tracking-widest text-black/50 uppercase mb-1 block group-focus-within:text-black transition-colors">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-invalid={!!error}
                aria-describedby={error ? "login-error" : undefined}
                className="w-full bg-transparent border-0 border-b border-black/20 py-2.5 px-0 text-sm text-black focus:outline-none focus:border-black focus:ring-0 transition-colors placeholder:text-black/20"
                placeholder="exemplo@email.com"
              />
            </div>

            <div className="relative group">
              <div className="flex justify-between items-end mb-1">
                <label htmlFor="password" className="text-[10px] font-bold font-mono tracking-widest text-black/50 uppercase group-focus-within:text-black transition-colors">
                  Senha
                </label>
                <a href="#" className="text-[9px] font-bold font-mono tracking-widest text-black/40 hover:text-black uppercase transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-invalid={!!error}
                aria-describedby={error ? "login-error" : undefined}
                className="w-full bg-transparent border-0 border-b border-black/20 py-2.5 px-0 text-sm text-black focus:outline-none focus:border-black focus:ring-0 transition-colors placeholder:text-black/20"
                placeholder="Sua senha secreta"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-4 mt-4 rounded-full text-[12px] uppercase tracking-[0.2em] font-bold hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center text-[11px] font-mono tracking-widest text-black/60 uppercase">
            Não possui uma conta?{' '}
            <a href="/cadastro" className="text-black font-bold hover:underline">
              Criar conta
            </a>
          </div>
        </div>

        {/* Lado Direito: Gráfico abstrato integrado (Sem borda visível) */}
        <div className="hidden md:block md:w-1/2 relative min-h-[450px] bg-white">
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
            style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, filter: 'invert(1)', transform: 'scale(1.15)' }}
          />
        </div>

      </div>
    </div>
  );
}
