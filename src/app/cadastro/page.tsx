'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DitherVeil = dynamic(() => import('@/components/ui/DitherVeil'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-black/5 animate-pulse" />
});

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useRouter();

  const [honeypot, setHoneypot] = useState('');

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (honeypot) return; // Basic bot protection

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simular API delay
    setTimeout(() => {
      // Por enquanto, apenas redireciona para login após o "cadastro"
      navigate.push('/login');
    }, 1500);
  };

  return (
    <div className="flex items-center justify-center w-full min-h-[calc(100vh-200px)]">
      {/* Container Principal - Sem bordas, integrando-se à página como um corpo só */}
      <div className="w-full max-w-6xl bg-white text-black flex flex-col md:flex-row">
        
        {/* Lado Esquerdo: Formulário */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center relative z-10 bg-white">
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-sans tracking-tight mb-2 text-black">
              Criar Conta
            </h1>
            <p className="text-[13px] font-mono tracking-wide text-black/50">
              Preencha os dados abaixo para iniciar sua jornada
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4 flex-grow flex flex-col justify-center max-w-sm">
            {error && (
              <div id="cadastro-error" role="alert" aria-live="polite" className="bg-red-50 text-red-600 p-3 text-xs text-center border border-red-100 font-mono">
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
              <label htmlFor="nome" className="text-[10px] font-bold font-mono tracking-widest text-black/50 uppercase mb-1 block group-focus-within:text-black transition-colors">
                Nome Completo
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                aria-invalid={!!error}
                aria-describedby={error ? "cadastro-error" : undefined}
                className="w-full bg-transparent border-0 border-b border-black/20 py-2 px-0 text-sm text-black focus:outline-none focus:border-black focus:ring-0 transition-colors placeholder:text-black/20"
                placeholder="Seu nome"
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
                aria-describedby={error ? "cadastro-error" : undefined}
                className="w-full bg-transparent border-0 border-b border-black/20 py-2 px-0 text-sm text-black focus:outline-none focus:border-black focus:ring-0 transition-colors placeholder:text-black/20"
                placeholder="exemplo@email.com"
              />
            </div>

            <div className="relative group">
              <label htmlFor="password" className="text-[10px] font-bold font-mono tracking-widest text-black/50 uppercase mb-1 block group-focus-within:text-black transition-colors">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-invalid={!!error}
                aria-describedby={error ? "cadastro-error" : undefined}
                className="w-full bg-transparent border-0 border-b border-black/20 py-2 px-0 text-sm text-black focus:outline-none focus:border-black focus:ring-0 transition-colors placeholder:text-black/20"
                placeholder="Sua senha secreta"
              />
            </div>

            <div className="relative group">
              <label htmlFor="confirmPassword" className="text-[10px] font-bold font-mono tracking-widest text-black/50 uppercase mb-1 block group-focus-within:text-black transition-colors">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-invalid={!!error}
                aria-describedby={error ? "cadastro-error" : undefined}
                className="w-full bg-transparent border-0 border-b border-black/20 py-2 px-0 text-sm text-black focus:outline-none focus:border-black focus:ring-0 transition-colors placeholder:text-black/20"
                placeholder="Repita sua senha"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3.5 mt-2 rounded-full text-[12px] uppercase tracking-[0.2em] font-bold hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Criando...' : 'Cadastrar'}
            </button>
          </form>

          <div className="mt-5 text-center text-[11px] font-mono tracking-widest text-black/60 uppercase">
            Já possui uma conta?{' '}
            <a href="/login" className="text-black font-bold hover:underline">
              Entrar
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
