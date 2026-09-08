import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would add the actual login logic
        console.log('Login attempt:', { email, password });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-main)]">
            <button
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
                <ArrowLeft size={20} strokeWidth={1.5} />
                <span className="font-medium tracking-wide text-sm uppercase">Voltar</span>
            </button>

            <div className="w-full max-w-md reveal">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-serif text-[var(--text-main)] mb-3">Admin Login</h1>
                    <p className="text-[var(--text-muted)]">Acesse o painel de administração</p>
                </div>

                <form 
                    onSubmit={handleSubmit}
                    className="glass bg-[var(--bg-island)] border border-[var(--border)] p-8 md:p-10 rounded-2xl shadow-sm"
                >
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-body)] mb-2 uppercase tracking-wider">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                                    <User size={18} strokeWidth={1.5} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-[var(--border)] rounded-lg bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all"
                                    placeholder="admin@exemplo.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-body)] mb-2 uppercase tracking-wider">
                                Senha
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                                    <Lock size={18} strokeWidth={1.5} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-[var(--border)] rounded-lg bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-[var(--accent)] text-[var(--bg-main)] rounded-lg font-medium tracking-wide hover:opacity-90 transition-opacity mt-4"
                        >
                            Entrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
