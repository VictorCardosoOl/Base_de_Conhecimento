import { useState, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { FAQItem } from '../types/index';
import glossaryData from '../data/glossary.json';

export const useArticleContent = (article: FAQItem) => {
    const [content, setContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        setError(null);

        const loadContent = async () => {
            try {
                if (typeof article.content === 'function') {
                    const module = await article.content();
                    const rawContent = module.default?.content || module.default || module;
                    if (mounted) setContent(rawContent as string);
                } else {
                    if (mounted) setContent((article.content as string) || article.answer);
                }
            } catch (err) {
                console.error('Failed to load article content', err);
                if (mounted) {
                    setError(err instanceof Error ? err : new Error('Failed to load content'));
                    setContent(article.answer);
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        loadContent();
        return () => { mounted = false; };
    }, [article]);

    const htmlContent = useMemo(() => {
        if (!content || typeof content !== 'string') return '';

        let rawHtml = marked.parse(content) as string;

        // Inject Glossary Tooltips efficiently (O(N) instead of O(N*M))
        const glossaryEntries = Object.entries(glossaryData);
        if (glossaryEntries.length > 0) {
            // Sort by length descending to match longest phrases first
            const sortedTerms = glossaryEntries.map(([t]) => t).sort((a, b) => b.length - a.length);
            const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const combinedRegex = new RegExp(`\\b(${sortedTerms.map(escapeRegExp).join('|')})\\b`, 'gi');
            
            // Map for O(1) lookup
            const termToDef = Object.fromEntries(
                glossaryEntries.map(([t, d]) => [t.toLowerCase(), d.replace(/"/g, '&quot;')])
            );

            rawHtml = rawHtml.replace(combinedRegex, (match) => {
                const safeDef = termToDef[match.toLowerCase()];
                return safeDef ? `<span class="glossary-term" data-tooltip="${safeDef}">${match}</span>` : match;
            });
        }

        // Sanitize AFTER everything, allowing our custom attribute
        return DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['data-tooltip'] });
    }, [content]);

    return { htmlContent, isLoading, error };
};

