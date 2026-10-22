/**
 * Trilhas de leitura sugeridas em "Minha lista": sequências fixas de artigos do catálogo
 * (por id). Um id que não existir mais no catálogo é ignorado na tela.
 */
export interface LearningTrack {
  id: string;
  title: string;
  description: string;
  badge: string;
  estimatedMinutes: number;
  articleIds: string[];
}

export const DEFAULT_LEARNING_TRACKS: LearningTrack[] = [
  {
    id: 'trilha-onboarding-sst',
    title: 'Trilha Básica: Onboarding em SST & NR-01',
    description:
      'Imersão obrigatória para novos colaboradores: conceitos de risco ocupacional, PGR e diretrizes da NR-01.',
    badge: 'Onboarding Obrigatório',
    estimatedMinutes: 25,
    articleIds: ['intro-sst', 'pgr', 'pcmso', 'diferenca-li-lp'],
  },
  {
    id: 'trilha-esocial-compliance',
    title: 'Trilha Avançada: Transmissão e Eventos eSocial',
    description:
      'Guia passo a passo para a correta validação e envio dos eventos S-2210, S-2220 e S-2240.',
    badge: 'Conformidade Legal',
    estimatedMinutes: 35,
    articleIds: [
      'evento-s2210-comunicacao-cat',
      'evento-s2220-monitoramento-saude',
      'evento-s2240-condicoes-ambientais',
    ],
  },
  {
    id: 'trilha-previdencia-laudos',
    title: 'Trilha Especializada: Previdência e Documentos Periciais',
    description:
      'Mapeamento de laudos técnicos, PPP eletrônico, aposentadoria especial e caracterização de insalubridade.',
    badge: 'Perícia & Previdência',
    estimatedMinutes: 30,
    articleIds: [
      'ltcat',
      'ppp',
      'aposentadoria-especial',
      'aposentadoria-invalidez',
    ],
  },
];
