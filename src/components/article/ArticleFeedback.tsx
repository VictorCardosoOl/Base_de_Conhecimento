import React, { useState } from 'react';
import { Star, AlertTriangle, Check, Send } from 'lucide-react';
import { AnalyticsService } from '../../services/analytics-service';

interface ArticleFeedbackProps {
  articleId: string;
  question: string;
}

export const ArticleFeedback: React.FC<ArticleFeedbackProps> = ({
  articleId,
  question,
}) => {
  const [feedbackState, setFeedbackState] = useState<
    'idle' | 'useful_sent' | 'reporting' | 'reported'
  >('idle');
  const [reportText, setReportText] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleRating = (value: number) => {
    setRating(value);
    AnalyticsService.submitFeedback({
      articleId,
      question,
      type: 'rating',
      details: value.toString(),
    });
    setFeedbackState('useful_sent');
    if (value <= 3) {
      setTimeout(() => setFeedbackState('reporting'), 1500);
    }
  };

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();

    // Anti-bot Honeypot check
    if (honeypot) {
      setFeedbackState('reported');
      return;
    }

    if (!reportText.trim()) return;

    AnalyticsService.submitFeedback({
      articleId,
      question,
      type: 'outdated_report',
      details: reportText.trim(),
    });
    setFeedbackState('reported');
  };

  return (
    <div className="mt-24 pt-12 border-t border-border no-print">
      <div className="py-8 flex flex-col items-center justify-center text-center gap-8 max-w-3xl mx-auto">
        <div className="space-y-3 flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.25em] text-text-muted">
            <span className="w-8 h-[1px] bg-border" />
            <span>Avaliação Editorial</span>
            <span className="w-8 h-[1px] bg-border" />
          </div>
          <h4 className="text-2xl md:text-3xl font-serif font-medium tracking-tight text-text-main">
            O que você achou deste conteúdo?
          </h4>
          <p className="text-sm text-text-muted max-w-lg mx-auto">
            Seu feedback rápido nos ajuda a atualizar e melhorar a precisão dos
            nossos guias continuamente. Leva só um segundo!
          </p>
        </div>

        {feedbackState === 'idle' && (
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRating(star)}
                  className="p-2 text-text-muted hover:text-amber-400 hover:scale-110 transition-all active:scale-95"
                  aria-label={`Avaliar com ${star} estrelas`}
                >
                  <Star
                    size={28}
                    strokeWidth={1.5}
                    className={`transition-colors ${
                      (hoverRating >= star || rating >= star)
                        ? 'fill-amber-400 text-amber-400'
                        : ''
                    }`}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => setFeedbackState('reporting')}
              className="flex items-center gap-2 px-6 py-3 min-h-[44px] text-[11px] uppercase tracking-widest font-semibold text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/10 transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-text-main"
            >
              <AlertTriangle size={14} /> Sugerir Evolução
            </button>
          </div>
        )}

        {feedbackState === 'useful_sent' && (
          <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest font-semibold text-text-main py-2.5 px-6 border border-border rounded-full">
            <Check size={14} /> Avaliação registrada com sucesso
          </div>
        )}

        {feedbackState === 'reported' && (
          <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest font-semibold text-text-main py-2.5 px-6 border border-border rounded-full">
            <Check size={14} /> Sugestão enviada com sucesso. Obrigado!
          </div>
        )}
      </div>

      {feedbackState === 'reporting' && (
        <form
          onSubmit={handleSendReport}
          className="mt-4 p-8 border border-border bg-black/[0.02] dark:bg-white/[0.02] max-w-2xl mx-auto space-y-6 rounded-2xl"
        >
          <div className="space-y-2 text-center">
            <label htmlFor="reportText" className="block text-[11px] uppercase tracking-widest font-bold text-text-main">
              Descreva a alteração ou divergência observada
            </label>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              Indique a portaria, o sistema ou o prazo que diverge da prática
              atual da empresa.
            </p>
          </div>

          {/* Honeypot Field */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <label htmlFor="user_contact_info">Leave this field empty</label>
            <input
              id="user_contact_info"
              type="text"
              name="user_contact_info"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
          <textarea
            id="reportText"
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Exemplo: Na nova portaria MTE de 2026, o prazo do evento S-2220 passou a considerar..."
            rows={4}
            className="w-full text-sm p-4 border border-border bg-transparent text-text-main placeholder:text-text-muted/60 focus:outline-none focus:border-text-main resize-none font-sans rounded-xl"
            required
          />
          <div className="flex justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => setFeedbackState('idle')}
              className="px-6 py-3 min-h-[44px] text-[11px] uppercase tracking-widest text-text-muted hover:text-text-main font-semibold rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-text-main"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-8 py-3 min-h-[44px] text-[11px] uppercase tracking-widest font-semibold bg-text-main text-bg-main hover:opacity-90 transition-opacity rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-text-main"
            >
              <Send size={14} /> Enviar Sugestão
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
