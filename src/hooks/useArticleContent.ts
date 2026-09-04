import { useState, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { FAQItem } from '../types';
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

        // Inject Glossary Tooltips BEFORE Sanitization!
        Object.entries(glossaryData).forEach(([term, definition]) => {
            const regex = new RegExp(`\\b(${term})\\b`, 'gi');
            // Safe escape of the definition to prevent breaking the attribute quotes
            const safeDef = definition.replace(/"/g, '&quot;');
            rawHtml = rawHtml.replace(regex, (match) =>
                `<span class="glossary-term" data-tooltip="${safeDef}">${match}</span>`
            );
        });

        // Sanitize AFTER everything, allowing our custom attribute
        return DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['data-tooltip'] });
    }, [content]);

    return { htmlContent, isLoading, error };
};

