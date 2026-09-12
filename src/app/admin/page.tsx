"use client";
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Edit, Trash2, Search, AlertCircle, Clock, CheckCircle2, MessageSquare, ShieldAlert } from 'lucide-react';
import { FAQ_DATA } from '@/constants/index';
import { AnalyticsService } from '@/services/analyticsService';

export default function AdminPage() {
    const navigate = useRouter();
    const [activeTab, setActiveTab] = useState<'articles' | 'analytics' | 'audit' | 'feedback'>('articles');

    const zeroResultSearches = useMemo(() => AnalyticsService.getZeroResultSearches(), []);
    const feedbackLogs = useMemo(() => AnalyticsService.getFeedbackLogs(), []);

    // GestÃ£o de Validade: Detecta artigos com mais de 6 ou 12 meses sem revisÃ£o
    const auditAlerts = useMemo(() => {
        return FAQ_DATA.map(item => {
            const reviewDate = new Date(item.lastReviewed || item.date);
            const now = new Date();
            const diffMonths = (now.getFullYear() - reviewDate.getFullYear()) * 12 + (now.getMonth() - reviewDate.getMonth());
            const maxValidity = item.validityMonths || 12;
            const isExpired = diffMonths >= maxValidity;
            const isNearExpired = diffMonths >= maxValidity - 3 && !isExpired;

            return {
                item,
                diffMonths: Math.max(1, diffMonths),
                maxValidity,
                isExpired,
                isNearExpired
            };
        }).filter(a => a.isExpired || a.isNearExpired);
    }, []);

    return (
        <div className="max-w-screen-2xl 3xl:max-w-[2100px] mx-auto space-y-8 2xl:space-y-12 p-4 2xl:p-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-text-main">Painel Administrativo & GovernanÃ§a</h1>
                    <p className="text-text-muted mt-1">GestÃ£o de artigos, auditoria de normas e inteligÃªncia de busca</p>
                    <div className="inline-block mt-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md text-xs">
                        âš ï¸ Modo DemonstraÃ§Ã£o (SSG/Git): Para persistir alteraÃ§Ãµes em produÃ§Ã£o, edite os arquivos Markdown em <code className="font-mono text-[11px]">src/content/artigos/</code>.
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => {
                            localStorage.removeItem('isAdmin');
                            sessionStorage.removeItem('sst_admin_session');
                            navigate('/login');
                        }}
                        className="flex items-center gap-2 border border-border text-text-main px-4 py-2 rounded-lg font-medium hover:bg-selection transition-colors text-sm"
                    >
                        Sair
                    </button>
                    <button 
                        onClick={() => navigate('/admin/editor')}
                        className="flex items-center gap-2 bg-text-main text-bg-main px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
                    >
                        <Plus size={16} /> Novo Artigo
                    </button>
                </div>
            </header>

            {/* Abas de NavegaÃ§Ã£o do Painel */}
            <div className="flex items-center gap-6 border-b border-border overflow-x-auto">
                <button
                    onClick={() => setActiveTab('articles')}
                    className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-[0.18em] transition-all relative ${activeTab === 'articles' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
                >
                    <FileText size={14} /> Artigos ({FAQ_DATA.length})
                    {activeTab === 'articles' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-main" />}
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-[0.18em] transition-all relative ${activeTab === 'analytics' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
                >
                    <Search size={14} /> Zero-Result Searches ({zeroResultSearches.length})
                    {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-main" />}
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-[0.18em] transition-all relative ${activeTab === 'audit' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
                >
                    <ShieldAlert size={14} /> Auditoria & Validade ({auditAlerts.length})
                    {activeTab === 'audit' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-main" />}
                </button>
                <button
                    onClick={() => setActiveTab('feedback')}
                    className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-[0.18em] transition-all relative ${activeTab === 'feedback' ? 'text-text-main' : 'text-text-muted hover:text-text-main'}`}
                >
                    <MessageSquare size={14} /> Feedbacks ({feedbackLogs.length})
                    {activeTab === 'feedback' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-text-main" />}
                </button>
            </div>

            {/* ConteÃºdo da Aba 1: Artigos */}
            {activeTab === 'articles' && (
                <div className="bg-bg-island border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-selection/30 border-b border-border text-sm text-text-muted uppercase tracking-wider">
                                    <th className="p-4 font-medium">Artigo</th>
                                    <th className="p-4 font-medium">Categoria</th>
                                    <th className="p-4 font-medium">Ãšltima RevisÃ£o</th>
                                    <th className="p-4 font-medium">Validade</th>
                                    <th className="p-4 font-medium text-right">AÃ§Ãµes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {FAQ_DATA.slice(0, 15).map((item) => (
                                    <tr key={item.id} className="hover:bg-selection/20 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <FileText size={16} className="text-text-muted shrink-0" />
                                                <span className="font-medium text-text-main line-clamp-1">{item.question}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-text-muted">
                                            <span className="px-2 py-1 bg-selection/30 rounded-md text-xs">{item.category}</span>
                                        </td>
                                        <td className="p-4 text-sm text-text-muted">{item.lastReviewed || item.date}</td>
                                        <td className="p-4 text-sm text-text-muted">
                                            <span className="px-2 py-0.5 rounded text-xs bg-stone-200 dark:bg-stone-800">
                                                {item.validityMonths || 12} meses
                                            </span>
                                        </td>
                                        <td className="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => navigate('/admin/editor')} className="p-2 text-text-muted hover:text-text-main rounded-lg hover:bg-selection transition-colors">
                                                    <Edit size={16} />
                                                </button>
                                                <button className="p-2 text-text-muted hover:text-red-600 rounded-lg hover:bg-red-500/20 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ConteÃºdo da Aba 2: Zero-Result Searches */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    <div className="p-6 rounded-xl bg-blue-500/5 border border-blue-500/20 text-text-main">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Search size={16} className="text-blue-600 dark:text-blue-400" />
                            Gaps de ConteÃºdo Corporativo (Consultas Sem Resultado)
                        </h3>
                        <p className="text-xs text-text-muted mt-1">
                            Estes sÃ£o os termos tÃ©cnicos buscados por colaboradores e clientes que retornaram zero artigos. Use esta lista para priorizar a criaÃ§Ã£o de novos procedimentos em Markdown.
                        </p>
                    </div>

                    <div className="bg-bg-island border border-border rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-selection/30 border-b border-border text-sm text-text-muted uppercase tracking-wider">
                                    <th className="p-4 font-medium">Termo Pesquisado</th>
                                    <th className="p-4 font-medium">OcorrÃªncias</th>
                                    <th className="p-4 font-medium">Ãšltima Tentativa</th>
                                    <th className="p-4 font-medium text-right">AÃ§Ã£o</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {zeroResultSearches.map((entry, idx) => (
                                    <tr key={idx} className="hover:bg-selection/20 transition-colors">
                                        <td className="p-4 font-semibold text-text-main font-mono text-sm">
                                            "{entry.query}"
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                                {entry.count} busca{entry.count > 1 ? 's' : ''}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-text-muted">
                                            {new Date(entry.lastSearched).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => navigate('/admin/editor')}
                                                className="px-3 py-1 text-xs font-semibold rounded-lg bg-text-main text-bg-main hover:opacity-90"
                                            >
                                                Criar Artigo
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ConteÃºdo da Aba 3: Auditoria de Validade */}
            {activeTab === 'audit' && (
                <div className="space-y-6">
                    <div className="p-6 rounded-xl bg-amber-500/5 border border-amber-500/20 text-text-main">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                            Controle de Vencimento e RecertificaÃ§Ã£o TÃ©cnica de SST
                        </h3>
                        <p className="text-xs text-text-muted mt-1">
                            Diretrizes normativas e previdenciÃ¡rias exigem revisÃ£o periÃ³dica de 6 ou 12 meses. Artigos com alerta devem ser revalidados pelo responsÃ¡vel tÃ©cnico.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {auditAlerts.map((alert, idx) => (
                            <div key={idx} className="p-5 rounded-xl border border-border bg-bg-island space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                    <h4 className="font-semibold text-text-main text-sm">{alert.item.question}</h4>
                                    <span className={`px-2 py-1 rounded text-xs font-bold shrink-0 ${alert.isExpired ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                                        {alert.isExpired ? 'Vencido' : 'PrÃ³ximo do Vencimento'}
                                    </span>
                                </div>
                                <div className="text-xs text-text-muted space-y-1">
                                    <p>Ãšltima VerificaÃ§Ã£o: <strong>{alert.item.lastReviewed || alert.item.date}</strong></p>
                                    <p>Periodicidade MÃ¡xima: <strong>{alert.maxValidity} meses</strong> (decorridos {alert.diffMonths} meses)</p>
                                    <p>ResponsÃ¡vel TÃ©cnico: <strong>{alert.item.verifiedBy || 'Engenharia de SST'}</strong></p>
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <button
                                        onClick={() => navigate('/admin/editor')}
                                        className="text-xs font-semibold text-text-main hover:underline flex items-center gap-1"
                                    >
                                        Revisar e Atualizar Selo <Edit size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ConteÃºdo da Aba 4: Feedbacks e DesatualizaÃ§Ãµes */}
            {activeTab === 'feedback' && (
                <div className="space-y-6">
                    <div className="p-6 rounded-xl bg-purple-500/5 border border-purple-500/20 text-text-main">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                            <MessageSquare size={16} className="text-purple-600 dark:text-purple-400" />
                            Backlog de Apontamentos da Comunidade e UsuÃ¡rios
                        </h3>
                        <p className="text-xs text-text-muted mt-1">
                            Feedbacks enviados atravÃ©s dos botÃµes de avaliaÃ§Ã£o rÃ¡pida nos procedimentos e formulÃ¡rio de "Reportar DesatualizaÃ§Ã£o".
                        </p>
                    </div>

                    <div className="space-y-3">
                        {feedbackLogs.map((fb, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-border bg-bg-island flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${fb.type === 'outdated_report' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                            {fb.type === 'outdated_report' ? 'DesatualizaÃ§Ã£o Reportada' : fb.type === 'useful_yes' ? 'AvaliaÃ§Ã£o Positiva' : 'AvaliaÃ§Ã£o Negativa'}
                                        </span>
                                        <span className="text-xs font-semibold text-text-main">{fb.question}</span>
                                    </div>
                                    {fb.details && (
                                        <p className="text-xs text-text-muted bg-stone-50 dark:bg-stone-900 p-2.5 rounded-lg border border-border mt-2 font-mono">
                                            "{fb.details}"
                                        </p>
                                    )}
                                </div>
                                <span className="text-[11px] text-text-muted shrink-0">
                                    {new Date(fb.timestamp).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


