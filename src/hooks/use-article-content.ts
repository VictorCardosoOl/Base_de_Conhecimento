import { useState, useEffect } from 'react';
import { FAQItem } from '../types/index';
import { reportContentError } from '../lib/telemetry';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import glossaryData from '../data/glossary.json';

export const useArticleContent = (article: FAQItem) => {
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        setError(null);

        const loadContent = async () => {
            try {
                let markdownContent = '';
                
                if (typeof article.content === 'function') {
                    const module = await article.content();
                    markdownContent = module.default.content;
                } else if (typeof article.content === 'string') {
                    markdownContent = article.content;
                }
                
                // A renderização não sofre mais atraso forçado.
                if (mounted) {
                    if (markdownContent) {
                        let rawHtml: string = await marked.parse(markdownContent) as string;
                        
                        // Injetar Glossario
                        const glossaryEntries = Object.entries(glossaryData || {});
                        if (glossaryEntries.length > 0) {
                            const sortedTerms = glossaryEntries.map(([t]) => t).sort((a, b) => b.length - a.length);
                            const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const combinedRegex = new RegExp(`(?![^<]*>)\\b(${sortedTerms.map(escapeRegExp).join('|')})\\b`, 'gi');
                            
                            const escapeHtml = (str: string) =>
                                str.replace(/&/g, '&amp;')
                                   .replace(/</g, '&lt;')
                                   .replace(/>/g, '&gt;')
                                   .replace(/"/g, '&quot;')
                                   .replace(/'/g, '&#39;');

                            const termToDef = Object.fromEntries(
                                glossaryEntries.map(([t, d]) => [t.toLowerCase(), escapeHtml(d as string)])
                            );

                            rawHtml = rawHtml.replace(combinedRegex, (match) => {
                                const safeDef = termToDef[match.toLowerCase()];
                                return safeDef ? `<span class="glossary-term" data-tooltip="${safeDef}">${match}</span>` : match;
                            });
                        }

                        // Sanitizar
                        const sanitizedHtml = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['data-tooltip'] });
                        setHtmlContent(sanitizedHtml);
                    } else {
                        // Fallback to basic answer if markdown doesn't exist
                        setHtmlContent(article.answer || '');
                    }
                }
            } catch (err) {
                reportContentError(err, { articleId: article.id, question: article.question });
                if (mounted) {
                    setError(err instanceof Error ? err : new Error('Failed to load content'));
                    setHtmlContent(article.answer || '');
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        loadContent();
        return () => { mounted = false; };
    }, [article]);

    return { htmlContent, isLoading, error };
};

