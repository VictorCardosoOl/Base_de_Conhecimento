import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, AlertTriangle, Check, Send } from 'lucide-react';
import { AnalyticsService } from '../../services/analyticsService';

interface ArticleFeedbackProps {
  articleId: string;
  question: string;
}

export const ArticleFeedback: React.FC<ArticleFeedbackProps> = ({ articleId, question }) => {
  const [feedbackState, setFeedbackState] = useState<'idle' | 'useful_sent' | 'reporting' | 'reported'>('idle');
  const [reportText, setReportText] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const handleUseful = (isUseful: boolean) => {
    AnalyticsService.submitFeedback({
      articleId,
      question,
      type: isUseful ? 'useful_yes' : 'useful_no'
    });
    setFeedbackState('useful_sent');
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
      details: reportText.trim()
    });
    setFeedbackState('reported');
  };

  return (
    <div className="mt-20 pt-10 border-t border-border no-print">
      <div className="py-6 border-b border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            <span className="w-5 h-[1px] bg-border" />
            <span>Avaliação Editorial</span>
          </div>
          <h4 className="text-xl font-serif font-light tracking-tight text-text-main">
            O que você achou deste conteúdo?
          </h4>
          <p className="text-xs text-text-muted font-sans">
            Seu feedback rápido nos ajuda a atualizar e melhorar a precisão dos nossos guias continuamente. Leva só um segundo!
          </p>
        </div>

        {feedbackState === 'idle' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUseful(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs uppercase tracking-wider font-semibold border border-border text-text-main hover:bg-selection transition-colors rounded-none"
            >
              <ThumbsUp size={13} className="text-emerald-600 dark:text-emerald-400" /> Sim
            </button>
            <button
              onClick={() => handleUseful(false)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs uppercase tracking-wider font-semibold border border-border text-text-main hover:bg-selection transition-colors rounded-none"
            >
              <ThumbsDown size={13} className="text-amber-600 dark:text-amber-400" /> Não
            </button>
            <button
              onClick={() => setFeedbackState('reporting')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs uppercase tracking-wider font-semibold border border-border text-text-muted hover:text-text-main hover:bg-selection transition-colors rounded-none"
            >
              <AlertTriangle size={13} /> Reportar Ajuste
            </button>
          </div>
        )}

        {feedbackState === 'useful_sent' && (
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 py-1.5 px-3 border border-emerald-500/30">
            <Check size={14} /> Avaliação registrada com sucesso
          </div>
        )}

        {feedbackState === 'reported' && (
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 py-1.5 px-3 border border-emerald-500/30">
            <Check size={14} /> Apontamento enviado ao comitê de SST
          </div>
        )}
      </div>

      {feedbackState === 'reporting' && (
        <form onSubmit={handleSendReport} className="mt-6 p-6 border border-border bg-bg-island/50 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs uppercase tracking-wider font-semibold text-text-main">
              Descreva a alteração ou divergência observada
            </label>
            <p className="text-[11px] text-text-muted">
              Indique a portaria, o sistema ou o prazo que diverge da prática atual da empresa.
            </p>
          </div>
          
          {/* Honeypot Field */}
          <div style={{ display: 'none' }} aria-hidden="true">
              <label>Leave this field empty</label>
              <input 
                  type="text" 
                  name="user_contact_info" 
                  tabIndex={-1} 
                  autoComplete="off" 
                  value={honeypot} 
                  onChange={(e) => setHoneypot(e.target.value)} 
              />
          </div>
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Exemplo: Na nova portaria MTE de 2026, o prazo do evento S-2220 passou a considerar..."
            rows={3}
            className="w-full text-xs p-3 border border-border bg-bg-main text-text-main placeholder:text-text-muted/60 focus:outline-none focus:border-text-main resize-none font-sans"
            required
          />
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setFeedbackState('idle')}
              className="px-4 py-1.5 text-xs uppercase tracking-wider text-text-muted hover:text-text-main font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs uppercase tracking-wider font-semibold bg-text-main text-bg-main hover:opacity-90 transition-opacity"
            >
              <Send size={12} /> Enviar Apontamento
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
