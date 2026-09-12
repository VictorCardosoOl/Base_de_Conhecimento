import { useState, useEffect } from 'react';
import { FAQItem } from '../types/index';
import { reportContentError } from '../lib/telemetry';
import { fetchParsedArticleHtml } from '../actions/articleActions';

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
                // If it's a dynamic module, it might be legacy. But we now have the server action!
                // We'll fetch the parsed HTML from the server action using the article ID.
                const parsedHtml = await fetchParsedArticleHtml(article.id);
                
                if (mounted) {
                    if (parsedHtml) {
                        setHtmlContent(parsedHtml);
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

