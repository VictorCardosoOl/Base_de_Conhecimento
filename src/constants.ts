import { FAQItem, Category } from './types';
import catalog from './data/catalog.json';
import { ARTICLE_CONTENT_MAP } from './data/mapping';

// Converts the JSON catalog + Lazy Load Map into the application's FAQItem format
export const FAQ_DATA: FAQItem[] = (catalog.map((item: any) => ({
  id: item.id,
  question: item.question,
  answer: item.answer,
  category: item.category as Category,
  date: item.date,
  searchText: item.searchText,
  tags: item.tags || [],
  content: ARTICLE_CONTENT_MAP[item.id]
})) as FAQItem[]).concat([










  {
    id: 'esocial-guia-completo',
    question: 'eSocial: Guia Completo',
    answer: 'Tudo sobre a plataforma federal: Histórico, Cronograma de Fases, Simplificado (S-1.0) e Impactos.',
    category: Category.ESOCIAL,
    tags: ['eSocial', 'Governo', 'Cronograma'],
    content: () => import('./content/esocial/GuiaESocial')
  },
  {
    id: 'eventos-sst-esocial',
    question: 'Eventos de SST (S-2210, S-2220, S-2240)',
    answer: 'Detalhes técnicos, prazos e multas dos eventos de Saúde e Segurança no Trabalho.',
    category: Category.ESOCIAL,
    tags: ['S-2210', 'S-2220', 'S-2240', 'SST'],
    content: () => import('./content/esocial/EventosSST')
  },
  {
    id: 'ecac-esocial-advanced-guide',
    question: 'e-CAC e Procuração Eletrônica',
    answer: 'Como utilizar o portal e-CAC para gerenciar procurações e permitir o envio de eventos pela Wise System.',
    category: Category.ESOCIAL,
    tags: ['e-CAC', 'Procuração', 'Certificado'],
    content: () => import('./content/esocial/ECAC_eSocial')
  },
  {
    id: 'evento-s2210-comunicacao-cat',
    question: 'S-2210: Comunicação de Acidente de Trabalho',
    answer: 'Guia completo sobre a CAT no eSocial: prazos, obrigatoriedade e preenchimento.',
    category: Category.ESOCIAL,
    tags: ['S-2210', 'CAT', 'Acidente'],
    content: () => import('./content/esocial/S2210')
  },
  {
    id: 'evento-s2220-monitoramento-saude',
    question: 'S-2220: Monitoramento da Saúde do Trabalhador',
    answer: 'Tudo sobre o envio de exames (ASO) e sua relação com o PPP eletrônico.',
    category: Category.ESOCIAL,
    tags: ['S-2220', 'ASO', 'Exames'],
    content: () => import('./content/esocial/S2220')
  },
  {
    id: 'evento-s2221-exame-toxicologico',
    question: 'S-2221: Exame Toxicológico',
    answer: 'Obrigatoriedade e procedimentos para envio do exame toxicológico de motoristas profissionais.',
    category: Category.ESOCIAL,
    tags: ['S-2221', 'Toxicológico', 'Motorista'],
    content: () => import('./content/esocial/S2221')
  },
  {
    id: 'evento-s2240-condicoes-ambientais',
    question: 'S-2240: Condições Ambientais do Trabalho',
    answer: 'Como informar agentes nocivos e riscos ambientais para fins de aposentadoria especial.',
    category: Category.ESOCIAL,
    tags: ['S-2240', 'Riscos', 'Ambiente'],
    content: () => import('./content/esocial/S2240')
  },
  {
    id: 'eventos-sst-orgaos-publicos',
    question: 'SST para Órgãos Públicos',
    answer: 'Regras específicas para envio de eventos SST de servidores estatutários e celetistas.',
    category: Category.ESOCIAL,
    tags: ['Órgão Público', 'SST', 'Servidor'],
    content: () => import('./content/esocial/OrgaosPublicos')
  },
  {
    id: 'esocial-sst-transmission',
    question: 'Rotina de Transmissão de SST',
    answer: 'Entenda como funciona o fluxo de envio e retorno de eventos no sistema Sigo.',
    category: Category.ESOCIAL,
    tags: ['Transmissão', 'Mensageria', 'Fluxo'],
    content: () => import('./content/esocial/RotinaSST')
  },
  {
    id: 'funcionarios-declarantes-esocial',
    question: 'Funcionários e Declarantes',
    answer: 'Regras de matrícula, identificação e cadastro de declarantes no eSocial.',
    category: Category.ESOCIAL,
    tags: ['Cadastro', 'Matrícula', 'Declarante'],
    content: () => import('./content/esocial/FuncionariosDeclarantes')
  },
  {
    id: 'erro-s2210-cat',
    question: 'Erro S-2210: Hora do Acidente Inválida',
    answer: 'Como corrigir rejeições relacionadas à hora do acidente ou incompatibilidade com tipo de CAT.',
    category: Category.TROUBLESHOOTING,
    tags: ['Erro', 'S-2210', 'CAT'],
    content: () => import('./content/troubleshooting/ErroS2210')
  },
  {
    id: 'resolucao-erros-s2240',
    question: 'Erro S-2240: Agentes Nocivos Não Preenchidos',
    answer: 'Solução para rejeições por falta de risco informado ou inconsistência de datas.',
    category: Category.TROUBLESHOOTING,
    tags: ['Erro', 'S-2240', 'Riscos'],
    content: () => import('./content/troubleshooting/ErroS2240')
  },



  {
    id: 'introducao-sst-novos-funcionarios',
    question: 'Introdução à SST e Normas Regulamentadoras',
    answer: 'Conceitos básicos de Saúde e Segurança e resumo das principais NRs (01, 05, 07, 15, 16, 17, 35).',
    category: Category.SST,
    tags: ['SST', 'NR', 'Introdução'],
    content: () => import('./content/gerenciamento-de-riscos/IntroducaoSST')
  },

  {
    id: 'diferenca-li-lp',
    question: 'Diferença entre LI (Insalubridade) e LP (Periculosidade)',
    answer: 'Comparativo completo: riscos, adicionais e quando solicitar cada laudo.',
    category: Category.SST,
    tags: ['Insalubridade', 'Periculosidade', 'Laudo'],
    content: () => import('./content/gerenciamento-de-riscos/LaudosInsalubridadePericulosidade')
  },

]);
