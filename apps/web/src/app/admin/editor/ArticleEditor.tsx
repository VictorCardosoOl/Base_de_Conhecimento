"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bold, Copy, Download, Heading2, Italic, List, Quote } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { FAQ_DATA } from '@/features/articles/catalog';
import { Category } from '@/features/articles/types';

/** Pasta de cada módulo em src/content/artigos (o gerador de catálogo lê dali). */
const FOLDER: Record<string, string> = {
    [Category.ESOCIAL]: 'eSocial',
    [Category.GRO]: 'GRO',
    [Category.EVENTOS]: 'Eventos',
    [Category.INFORMACOES]: 'Informacoes',
    [Category.COLETIVO]: 'Coletivo',
    [Category.TI]: 'TI',
};
const CATEGORIES = Object.keys(FOLDER) as Category[];

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
function today(): string {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

function slugify(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

/** Valor seguro para YAML numa linha (aspas quando precisa). */
function yaml(value: string): string {
    return /^[\p{L}\p{N} ,.()/-]+$/u.test(value) && !/^\d/.test(value) ? value : JSON.stringify(value);
}

interface Draft {
    title: string;
    category: Category;
    answer: string;
    tags: string;
    author: string;
    verifiedBy: string;
    date: string;
    body: string;
}

/**
 * Rascunho de artigo em Markdown. Os artigos são publicados pelo repositório (arquivos em
 * src/content/artigos, revisados por pull request): este editor monta o arquivo com o
 * frontmatter certo e o entrega para download ou cópia. Não grava nada no servidor.
 */
export function ArticleEditor({ articleId }: { articleId?: string }) {
    const toast = useToast();
    const source = articleId ? FAQ_DATA.find((item) => item.id === articleId) : undefined;
    const [draft, setDraft] = useState<Draft>(() => ({
        title: source?.question ?? '',
        category: (source?.category as Category) ?? Category.ESOCIAL,
        answer: source?.answer ?? '',
        tags: source?.tags?.join(', ') ?? '',
        author: source?.author ?? '',
        verifiedBy: source?.verifiedBy ?? '',
        date: source?.date ?? today(),
        body: '',
    }));
    const [loadingBody, setLoadingBody] = useState(Boolean(source));
    const bodyRef = useRef<HTMLTextAreaElement>(null);
    const set = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

    // Revisão de um artigo existente: carrega o Markdown publicado.
    useEffect(() => {
        if (!source || typeof source.content !== 'function') return;
        let active = true;
        source
            .content()
            .then((mod) => {
                if (active) setDraft((current) => ({ ...current, body: mod.default.content.trim() }));
            })
            .finally(() => active && setLoadingBody(false));
        return () => {
            active = false;
        };
    }, [source]);

    const id = source?.id ?? slugify(draft.title);
    const path = `src/content/artigos/${FOLDER[draft.category] ?? draft.category}/${id || 'novo-artigo'}.md`;
    const missing = [!draft.title.trim() && 'título', !draft.answer.trim() && 'resposta curta', !draft.body.trim() && 'conteúdo'].filter(Boolean);

    const markdown = useMemo(() => {
        const tags = draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
        const lines = [
            '---',
            `title: ${yaml(draft.title.trim())}`,
            `category: ${draft.category}`,
            `date: ${yaml(draft.date.trim())}`,
            ...(source ? [`lastReviewed: ${yaml(today())}`] : []),
            ...(tags.length ? [`tags: [${tags.map(yaml).join(', ')}]`] : []),
            `answer: ${yaml(draft.answer.trim())}`,
            ...(draft.author.trim() ? [`author: ${yaml(draft.author.trim())}`] : []),
            ...(draft.verifiedBy.trim() ? [`verifiedBy: ${yaml(draft.verifiedBy.trim())}`] : []),
            '---',
            '',
            draft.body.trim(),
            '',
        ];
        return lines.join('\n');
    }, [draft, source]);

    /** Aplica a marcação à seleção do texto (ou insere no cursor) e mantém o foco. */
    const wrap = (before: string, after = '', linePrefix = false) => {
        const area = bodyRef.current;
        if (!area) return;
        const { selectionStart: start, selectionEnd: end, value } = area;
        const selected = value.slice(start, end);
        const insert = linePrefix
            ? (selected || 'texto').split('\n').map((line) => `${before}${line}`).join('\n')
            : `${before}${selected || 'texto'}${after}`;
        const next = value.slice(0, start) + insert + value.slice(end);
        set({ body: next });
        requestAnimationFrame(() => {
            area.focus();
            area.setSelectionRange(start, start + insert.length);
        });
    };

    const download = () => {
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${id || 'novo-artigo'}.md`;
        link.click();
        URL.revokeObjectURL(url);
        toast.show({ tone: 'success', title: 'Arquivo gerado', message: `Salve em ${path} e abra um pull request.` });
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(markdown);
            toast.show({ tone: 'success', title: 'Markdown copiado' });
        } catch {
            toast.show({ tone: 'danger', title: 'Não foi possível copiar', message: 'Use “Baixar .md”.' });
        }
    };

    const tool = 'ui-btn ui-btn--ghost ui-btn--sm ui-btn--icon';

    return (
        <div className="max-w-screen-2xl mx-auto space-y-6 p-1 sm:p-4">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="flex items-start gap-3">
                    <ButtonLink href="/admin" icon variant="ghost" aria-label="Voltar ao painel">
                        <ArrowLeft size={18} aria-hidden="true" />
                    </ButtonLink>
                    <div>
                        <p className="ui-eyebrow">{source ? 'Revisão de artigo' : 'Novo artigo'}</p>
                        <h1 className="ui-page-title mt-1">{source ? source.question : 'Rascunho em Markdown'}</h1>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={copy} disabled={missing.length > 0}>
                        <Copy size={15} aria-hidden="true" /> Copiar Markdown
                    </Button>
                    <Button variant="primary" onClick={download} disabled={missing.length > 0}>
                        <Download size={15} aria-hidden="true" /> Baixar .md
                    </Button>
                </div>
            </header>

            <Alert tone="info" title="Como publicar">
                Os artigos ficam no repositório. Baixe o arquivo, salve em <code className="font-mono text-xs">{path}</code> e abra um pull request; o catálogo é gerado no build.
                {missing.length > 0 && <> Falta preencher: {missing.join(', ')}.</>}
            </Alert>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                <div className="glass-card p-5 sm:p-7 space-y-5">
                    <div className="grid gap-5 md:grid-cols-3">
                        <Field label="Título" className="md:col-span-2">
                            {(control) => <input {...control} value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex.: Como enviar o evento S-2220?" required />}
                        </Field>
                        <Field label="Módulo">
                            {(control) => (
                                <select {...control} value={draft.category} onChange={(e) => set({ category: e.target.value as Category })}>
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            )}
                        </Field>
                    </div>
                    <Field label="Resposta curta" hint="Aparece como subtítulo e nos resultados de busca (1–2 frases).">
                        {(control) => <textarea {...control} rows={2} value={draft.answer} onChange={(e) => set({ answer: e.target.value })} required />}
                    </Field>
                    <div className="grid gap-5 md:grid-cols-3">
                        <Field label="Tags" hint="Separadas por vírgula.">
                            {(control) => <input {...control} value={draft.tags} onChange={(e) => set({ tags: e.target.value })} />}
                        </Field>
                        <Field label="Autoria (opcional)">
                            {(control) => <input {...control} value={draft.author} onChange={(e) => set({ author: e.target.value })} />}
                        </Field>
                        <Field label="Revisão técnica (opcional)">
                            {(control) => <input {...control} value={draft.verifiedBy} onChange={(e) => set({ verifiedBy: e.target.value })} />}
                        </Field>
                    </div>

                    <div className="ui-field">
                        <label htmlFor="article-body" className="ui-label">Conteúdo (Markdown)</label>
                        <div className="rounded-[var(--glass-radius-sm)] border border-[color:color-mix(in_srgb,var(--text-main)_16%,transparent)] overflow-hidden">
                            <div role="toolbar" aria-label="Formatação" aria-controls="article-body" className="flex flex-wrap gap-1 p-1.5 border-b border-[color:color-mix(in_srgb,var(--text-main)_10%,transparent)]">
                                <button type="button" className={tool} aria-label="Subtítulo" onClick={() => wrap('## ', '', true)}><Heading2 size={16} aria-hidden="true" /></button>
                                <button type="button" className={tool} aria-label="Negrito" onClick={() => wrap('**', '**')}><Bold size={16} aria-hidden="true" /></button>
                                <button type="button" className={tool} aria-label="Itálico" onClick={() => wrap('_', '_')}><Italic size={16} aria-hidden="true" /></button>
                                <button type="button" className={tool} aria-label="Lista" onClick={() => wrap('- ', '', true)}><List size={16} aria-hidden="true" /></button>
                                <button type="button" className={tool} aria-label="Aviso (citação)" onClick={() => wrap('> ', '', true)}><Quote size={16} aria-hidden="true" /></button>
                            </div>
                            <textarea
                                id="article-body"
                                ref={bodyRef}
                                value={draft.body}
                                onChange={(e) => set({ body: e.target.value })}
                                disabled={loadingBody}
                                placeholder={loadingBody ? 'Carregando o conteúdo publicado…' : 'Escreva o conteúdo do artigo em Markdown…'}
                                className="w-full p-4 min-h-[420px] bg-transparent resize-y focus:outline-none text-text-main leading-relaxed font-mono text-sm"
                            />
                        </div>
                    </div>
                </div>

                <section aria-labelledby="md-preview" className="glass-card p-5 sm:p-7 min-w-0">
                    <h2 id="md-preview" className="ui-label">Arquivo gerado</h2>
                    <p className="mt-1 text-xs text-text-muted break-all">{path}</p>
                    <pre className="mt-4 max-h-[640px] overflow-auto rounded-2xl bg-[color:color-mix(in_srgb,var(--text-main)_5%,transparent)] p-4 text-xs leading-relaxed text-text-body whitespace-pre-wrap break-words">
                        {markdown}
                    </pre>
                </section>
            </div>
        </div>
    );
}
