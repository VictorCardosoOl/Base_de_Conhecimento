import { useEffect } from 'react';

/**
 * Hook dedicado à inicialização de blocos Mermaid em artigos
 */
export function useMermaidRenderer(htmlContent: string) {
  useEffect(() => {
    if (!htmlContent || !htmlContent.includes('language-mermaid')) return;

    let active = true;

    const initMermaid = async () => {
      try {
        const mermaidModule = await import('mermaid');
        if (!active) return;
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
          securityLevel: 'loose',
        });

        const nodes = document.querySelectorAll<HTMLElement>('.language-mermaid');
        if (nodes.length > 0) {
          await mermaid.run({ nodes: Array.from(nodes) });
        }
      } catch {
        // Silencioso para não poluir logs em caso de digitação parcial
      }
    };

    const timer = setTimeout(initMermaid, 100);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [htmlContent]);
}
