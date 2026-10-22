"use client";
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { FilePenLine, FileText, MessageSquare, Plus, ShieldAlert, UserCheck, UserCircle, Users } from 'lucide-react';
import { FAQ_DATA } from '@/features/articles/catalog';
import { validityOf } from '@/features/articles/article-meta';
import { LogoutButton } from '@/features/auth/components/LogoutButton';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/StateMessage';
import { Tabs, tabPanelProps } from '@/components/ui/Tabs';
import { BarList, RingGauge } from '@/components/ui/glass/GlassMetrics';
import { CorrectionsQueue } from './CorrectionsQueue';
import { CommentsModeration } from './CommentsModeration';

type Tab = 'corrections' | 'comments' | 'validity' | 'articles';

/**
 * Painel de governança do conteúdo (editor e admin). Tudo o que aparece aqui é real:
 * sugestões e comentários vêm do servidor; validade e acervo, do catálogo publicado.
 * `canManageUsers` vem da página (papel confirmado no AuthService); o link é só navegação.
 */
export function AdminDashboard({ canManageUsers = false }: { canManageUsers?: boolean }) {
    const [tab, setTab] = useState<Tab>('corrections');
    const [openCorrections, setOpenCorrections] = useState<number | null>(null);
    const [commentCount, setCommentCount] = useState<number | null>(null);
    const [query, setQuery] = useState('');

    const audit = useMemo(
        () =>
            FAQ_DATA.filter((item) => item.category !== 'Sobre')
                .map((item) => ({ item, validity: validityOf(item) }))
                .filter((entry) => entry.validity && entry.validity.state !== 'ok')
                .sort((a, b) => (b.validity!.months - b.validity!.maxMonths) - (a.validity!.months - a.validity!.maxMonths)),
        []
    );
    const expired = audit.filter((entry) => entry.validity!.state === 'expired').length;
    const healthy = FAQ_DATA.length ? Math.round(((FAQ_DATA.length - expired) / FAQ_DATA.length) * 100) : 100;
    const byCategory = useMemo(() => {
        const counts = new Map<string, number>();
        for (const item of FAQ_DATA) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
        return Array.from(counts, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
    }, []);
    const articles = useMemo(() => {
        const term = query.trim().toLowerCase();
        return term
            ? FAQ_DATA.filter((item) => `${item.question} ${item.category} ${item.id}`.toLowerCase().includes(term))
            : FAQ_DATA;
    }, [query]);

    const kpis = [
        { label: 'Sugestões em revisão', value: openCorrections, icon: FilePenLine, tab: 'corrections' as const },
        { label: 'Comentários publicados', value: commentCount, icon: MessageSquare, tab: 'comments' as const },
        { label: 'Alertas de validade', value: audit.length, icon: ShieldAlert, tab: 'validity' as const },
        { label: 'Artigos publicados', value: FAQ_DATA.length, icon: FileText, tab: 'articles' as const },
    ];

    return (
        <div className="max-w-screen-2xl mx-auto space-y-8 p-1 sm:p-4">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
                <div>
                    <p className="ui-eyebrow">Painel</p>
                    <h1 className="ui-page-title mt-2">Governança do conteúdo</h1>
                    <p className="text-text-muted mt-2 max-w-2xl">
                        Sugestões de correção dos leitores, moderação de comentários e validade dos artigos. O conteúdo é publicado em Markdown pelo repositório.
                    </p>
                </div>
                <nav aria-label="Administração" className="flex flex-wrap gap-2">
                    {canManageUsers && (
                        <ButtonLink href="/admin/usuarios" size="sm">
                            <Users size={15} aria-hidden="true" /> Usuários
                        </ButtonLink>
                    )}
                    <ButtonLink href="/admin/solicitacoes" size="sm">
                        <UserCheck size={15} aria-hidden="true" /> Solicitações
                    </ButtonLink>
                    <ButtonLink href="/conta" size="sm">
                        <UserCircle size={15} aria-hidden="true" /> Minha conta
                    </ButtonLink>
                    <LogoutButton className="ui-btn ui-btn--sm ui-btn--ghost" />
                    <ButtonLink href="/admin/editor" size="sm" variant="primary">
                        <Plus size={15} aria-hidden="true" /> Novo rascunho
                    </ButtonLink>
                </nav>
            </header>

            <section aria-label="Indicadores" className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="glass-card col-span-2 lg:row-span-2 p-6 flex flex-col items-center justify-center gap-3 text-center">
                    <p className="ui-label">Saúde do acervo</p>
                    <RingGauge value={healthy} size={140} stroke={12} label="Artigos dentro da validade">
                        <span className="text-3xl font-semibold text-text-main tabular-nums">{healthy}%</span>
                        <span className="text-[11px] text-text-muted">em dia</span>
                    </RingGauge>
                    <p className="text-xs text-text-muted">
                        {expired} vencido(s) · {audit.length - expired} perto do vencimento
                    </p>
                </div>
                {kpis.map((kpi) => (
                    <button
                        key={kpi.label}
                        type="button"
                        onClick={() => setTab(kpi.tab)}
                        className="glass-card glass-interactive p-5 flex flex-col justify-between gap-4 min-h-[8rem] text-left"
                    >
                        <span className="w-9 h-9 rounded-full glass-flat !rounded-full flex items-center justify-center text-[color:var(--mesh-1)]">
                            <kpi.icon size={16} aria-hidden="true" />
                        </span>
                        <span>
                            <span className="block text-3xl font-semibold tracking-tight text-text-main tabular-nums">
                                {kpi.value ?? '—'}
                            </span>
                            <span className="text-xs text-text-muted">{kpi.label}</span>
                        </span>
                    </button>
                ))}
                <div className="glass-card col-span-2 lg:col-span-4 p-6">
                    <p className="ui-label mb-4">Artigos por módulo</p>
                    <BarList items={byCategory} label="Artigos por módulo" />
                </div>
            </section>

            <Tabs<Tab>
                label="Seções do painel"
                idPrefix="admin"
                value={tab}
                onChange={setTab}
                items={[
                    { id: 'corrections', label: 'Sugestões de correção', count: openCorrections ?? undefined },
                    { id: 'comments', label: 'Comentários', count: commentCount ?? undefined },
                    { id: 'validity', label: 'Validade', count: audit.length },
                    { id: 'articles', label: 'Artigos', count: FAQ_DATA.length },
                ]}
            />

            {/* As filas montam uma vez (contagens nos indicadores) e ficam ocultas fora da aba. */}
            <div {...tabPanelProps('admin', 'corrections')} hidden={tab !== 'corrections'}>
                <CorrectionsQueue onOpenCountChange={setOpenCorrections} />
            </div>
            <div {...tabPanelProps('admin', 'comments')} hidden={tab !== 'comments'}>
                <CommentsModeration onCountChange={setCommentCount} />
            </div>

            {tab === 'validity' && (
                <div {...tabPanelProps('admin', 'validity')} className="space-y-4">
                    <p className="text-sm text-text-muted max-w-2xl">
                        Cada artigo tem um ciclo de revisão (padrão de 12 meses). Revise o conteúdo e atualize <code className="font-mono text-xs">lastReviewed</code> no frontmatter.
                    </p>
                    {audit.length === 0 ? (
                        <EmptyState title="Todos os artigos estão dentro da validade" icon={<ShieldAlert size={20} aria-hidden="true" />} />
                    ) : (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {audit.map(({ item, validity }) => (
                                <li key={item.id} className="glass-card p-5 space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <Link href={`/artigo/${item.id}`} className="ui-link font-semibold text-sm">
                                            {item.question}
                                        </Link>
                                        <span className="ui-badge shrink-0" data-tone={validity!.state === 'expired' ? 'danger' : 'warning'}>
                                            {validity!.state === 'expired' ? 'Vencido' : 'Vence em breve'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-muted">
                                        {item.category} · última revisão {item.lastReviewed || item.date} · {validity!.months} de {validity!.maxMonths} meses
                                        {item.verifiedBy && <> · {item.verifiedBy}</>}
                                    </p>
                                    <ButtonLink href={`/admin/editor?artigo=${encodeURIComponent(item.id)}`} size="sm" variant="ghost" className="-ml-2">
                                        <FilePenLine size={14} aria-hidden="true" /> Preparar revisão
                                    </ButtonLink>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {tab === 'articles' && (
                <div {...tabPanelProps('admin', 'articles')} className="space-y-4">
                    <label className="ui-field max-w-sm">
                        <span className="ui-label">Filtrar artigos</span>
                        <input className="ui-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Título, módulo ou identificador" />
                    </label>
                    <div className="ui-table-wrap glass-card !rounded-3xl">
                        <table className="ui-table">
                            <caption className="sr-only">Artigos publicados ({articles.length})</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Artigo</th>
                                    <th scope="col">Módulo</th>
                                    <th scope="col">Publicado</th>
                                    <th scope="col">Revisado</th>
                                    <th scope="col"><span className="sr-only">Ações</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {articles.map((item) => (
                                    <tr key={item.id}>
                                        <td className="font-medium text-text-main">
                                            <Link href={`/artigo/${item.id}`} className="ui-link">{item.question}</Link>
                                        </td>
                                        <td><span className="ui-badge">{item.category}</span></td>
                                        <td className="text-text-muted whitespace-nowrap">{item.date || '—'}</td>
                                        <td className="text-text-muted whitespace-nowrap">{item.lastReviewed || '—'}</td>
                                        <td className="text-right">
                                            <ButtonLink href={`/admin/editor?artigo=${encodeURIComponent(item.id)}`} size="sm" variant="ghost" aria-label={`Preparar revisão de ${item.question}`}>
                                                <FilePenLine size={14} aria-hidden="true" /> Revisar
                                            </ButtonLink>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {articles.length === 0 && <EmptyState title="Nenhum artigo encontrado" />}
                    </div>
                </div>
            )}
        </div>
    );
}
