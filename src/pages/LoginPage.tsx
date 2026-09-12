import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulação assíncrona com validação de credenciais de teste para ambiente SSG/Demo
        const trimmedEmail = email.trim().toLowerCase();
        
        // Hash simples no client para evitar comparação de string pura em dump de memória
        const encoder = new TextEncoder();
        const data = encoder.encode(`${trimmedEmail}:${password}`);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // SHA-256 de "admin@admin.com:admin"
        const expectedHash = '4e803d52367ba4f3fb87440ba73693e55c3c0eb4d7e2f5f190e22709210c85c2';

        if (hashHex === expectedHash) {
            const sessionToken = btoa(`sst_session_${Date.now()}_${Math.random()}`);
            sessionStorage.setItem('sst_admin_session', sessionToken);
            localStorage.setItem('isAdmin', 'true');
            navigate('/admin');
        } else {
            setError('Credenciais incorretas. Consulte a documentação interna ou utilize as credenciais de teste fornecidas.');
            setIsLoading(false);
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
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-text-muted text-center leading-relaxed">
                        <strong className="text-text-main font-semibold">Acesso de Demonstração:</strong> Credenciais de teste locais: <code className="font-mono text-[11px] font-semibold text-text-main">admin@admin.com</code> / <code className="font-mono text-[11px] font-semibold text-text-main">admin</code>. O conteúdo oficial é versionado via Git/Markdown.
                    </div>
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
