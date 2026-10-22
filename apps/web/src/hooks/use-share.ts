import { useState } from 'react';

export function useShare() {
  const [shareFeedback, setShareFeedback] = useState(false);

  const shareContent = async (title: string, text: string, url: string) => {
    const shareData = { title, text, url };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('Erro ao compartilhar:', err);
        }
      }
    } else {
      // Fallback: Copiar URL para o clipboard
      try {
        await navigator.clipboard.writeText(url);
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
      } catch (err) {
        console.warn('Clipboard indisponível:', err);
        // Último recurso: permite copiar manualmente em vez de afirmar um sucesso falso
        window.prompt('Não foi possível copiar automaticamente. Copie o link abaixo:', url);
      }
    }
  };

  return { shareContent, shareFeedback };
}
