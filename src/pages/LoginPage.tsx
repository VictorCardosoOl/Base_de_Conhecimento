import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Usuário de teste: admin@admin.com / admin
        if (email === 'admin@admin.com' && password === 'admin') {
            localStorage.setItem('isAdmin', 'true');
            navigate('/admin');
        } else {
            setError('Credenciais inválidas. Use admin@admin.com e senha admin');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[70vh] p-4">
            <div className="bg-bg-island border border-border rounded-2xl shadow-sm p-8 max-w-md w-full">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-selection rounded-full flex items-center justify-center mb-4">
                        <Lock className="text-text-main" size={24} />
                    </div>
                    <h1 className="text-2xl font-serif text-text-main">Acesso Restrito</h1>
                    <p className="text-text-muted mt-2 text-center">Entre com suas credenciais para acessar o painel administrativo.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Email</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-transparent border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-text-main transition-colors"
                            placeholder="admin@admin.com"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Senha</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-transparent border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-text-main transition-colors"
                            placeholder="admin"
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-text-main text-bg-main py-3 rounded-lg font-medium hover:opacity-90 transition-opacity mt-4"
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
};
