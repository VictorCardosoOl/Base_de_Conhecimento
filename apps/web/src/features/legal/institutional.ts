/**
 * Dados institucionais usados nas páginas legais e no rodapé. Fonte única: altere aqui.
 *
 * Pendências (ver docs/PAGINAS_INSTITUCIONAIS.md): a identificação jurídica da
 * controladora (razão social e CNPJ) e o encarregado (LGPD, art. 41) não constam no
 * projeto. Enquanto forem null, as páginas não exibem esses campos.
 */
export const INSTITUTIONAL = {
  /** Nome do serviço como aparece ao público. */
  serviceName: 'Base SST',
  /** Canal de atendimento para dúvidas, solicitações de titulares e suporte. */
  contactEmail: 'suporte@basesst.br',
  /** Razão social e CNPJ da controladora, quando confirmados. */
  controllerLegalName: null as string | null,
  /** Encarregado pelo tratamento de dados pessoais (nome e contato), quando indicado. */
  dataProtectionOfficer: null as { name: string; email: string } | null,
} as const;

/** Sequência fixa das páginas institucionais (navegação contextual entre elas). */
export const LEGAL_PAGES = [
  { href: '/termos', title: 'Termos de Uso' },
  { href: '/privacidade', title: 'Política de Privacidade' },
  { href: '/cookies', title: 'Preferências de Cookie' },
] as const;

export type LegalPageHref = (typeof LEGAL_PAGES)[number]['href'];

/** Fontes oficiais citadas nas páginas. */
export const OFFICIAL_SOURCES = {
  lgpd: {
    label: 'Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (Planalto)',
    href: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm',
  },
  anpd: {
    label: 'Autoridade Nacional de Proteção de Dados (ANPD)',
    href: 'https://www.gov.br/anpd/pt-br',
  },
  anpdCookies: {
    label: 'Guia orientativo “Cookies e proteção de dados pessoais” (ANPD)',
    href: 'https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais',
  },
} as const;
