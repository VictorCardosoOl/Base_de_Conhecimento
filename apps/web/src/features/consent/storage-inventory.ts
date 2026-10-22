/**
 * Inventário do que a Base SST guarda no navegador, por categoria. É a fonte da página
 * Preferências de Cookie: cada item corresponde a uma chave ou cookie realmente usado no
 * código (ver docs/PAGINAS_INSTITUCIONAIS.md). Ao criar uma chave nova, registre-a aqui.
 */
import { CONSENT_STORAGE_KEY } from './consent-storage';
import { THEME_STORAGE_KEY } from '@/features/shell/theme-storage';
import { GLASS_PREFERENCE_KEY } from '@/features/shell/glass-preference';

export type StorageKind = 'cookie' | 'local' | 'session';

export interface StorageItem {
  name: string;
  kind: StorageKind;
  purpose: string;
  duration: string;
}

export const STORAGE_KIND_LABEL: Record<StorageKind, string> = {
  cookie: 'Cookie',
  local: 'Armazenamento local',
  session: 'Armazenamento da sessão',
};

/**
 * Essenciais: sem eles não há login seguro nem registro da sua escolha. Os cookies são
 * definidos pelo serviço de contas (nomes e prazos da configuração padrão), são
 * inacessíveis a scripts da página e só trafegam por conexão segura.
 */
export const ESSENTIAL_ITEMS: StorageItem[] = [
  {
    name: '__Host-kb_at',
    kind: 'cookie',
    purpose: 'Identifica sua sessão quando você está conectado.',
    duration: 'Cerca de 10 minutos, renovado automaticamente durante o uso.',
  },
  {
    name: '__Secure-kb_rt',
    kind: 'cookie',
    purpose: 'Renova a sessão sem pedir a senha novamente.',
    duration: 'Até 7 dias sem uso, limitado a 30 dias desde o login.',
  },
  {
    name: '__Secure-kb_oauth_state',
    kind: 'cookie',
    purpose: 'Protege o login com Google ou GitHub contra falsificação de requisições.',
    duration: '10 minutos, apenas durante o login social.',
  },
  {
    name: '__Secure-kb_oauth_signup',
    kind: 'cookie',
    purpose: 'Guarda o cadastro com Google ou GitHub enquanto ele é concluído.',
    duration: '15 minutos, apenas durante o cadastro social.',
  },
  {
    name: CONSENT_STORAGE_KEY,
    kind: 'local',
    purpose: 'Registra sua escolha sobre o monitoramento de erros e desempenho.',
    duration: 'Até você alterar ou apagar a escolha.',
  },
  {
    name: 'kb:auth-return',
    kind: 'session',
    purpose: 'Evita redirecionamentos repetidos entre o login e a página de destino.',
    duration: 'Até a aba ser fechada.',
  },
];

/**
 * Recursos acionados por você: criados só quando você usa o recurso correspondente,
 * ficam apenas neste aparelho e não são enviados à Base SST nem a terceiros.
 */
export const FEATURE_ITEMS: StorageItem[] = [
  { name: THEME_STORAGE_KEY, kind: 'local', purpose: 'Tema claro ou escuro.', duration: 'Até você apagar.' },
  { name: GLASS_PREFERENCE_KEY, kind: 'local', purpose: 'Preferência de efeitos visuais.', duration: 'Até você apagar.' },
  { name: 'sstfaq_queue', kind: 'local', purpose: 'Artigos salvos em Minha Lista.', duration: 'Até você apagar.' },
  { name: 'sst_completed_articles', kind: 'local', purpose: 'Artigos marcados como lidos nas trilhas.', duration: 'Até você apagar.' },
  { name: 'sst_reading_goal', kind: 'local', purpose: 'Meta de tempo de leitura.', duration: 'Até você apagar.' },
  { name: 'sst_typography_pref', kind: 'local', purpose: 'Preferências de leitura dos artigos (tamanho da fonte, entrelinha e tipo de letra).', duration: 'Até você apagar.' },
  { name: 'sst_article_highlights', kind: 'local', purpose: 'Trechos destacados por você nos artigos.', duration: 'Até você apagar.' },
  { name: 'sst_recent_searches', kind: 'local', purpose: 'Buscas recentes da busca rápida.', duration: 'Até você apagar.' },
  { name: 'sst_recent_articles', kind: 'local', purpose: 'Artigos abertos recentemente.', duration: 'Até você apagar.' },
];

/** Opcional (consentimento): só existe com o monitoramento ativado e permitido. */
export const MONITORING_ITEMS: StorageItem[] = [
  {
    name: 'sentryReplaySession',
    kind: 'session',
    purpose: 'Identifica a gravação de sessão do monitoramento de erros (textos e campos mascarados).',
    duration: 'Até a aba ser fechada.',
  },
];

/** Chaves antigas que não são mais usadas e são apagadas ao carregar o site. */
export const RETIRED_KEYS = ['sst_search_analytics_logs'];

/** Apaga os dados de recursos guardados neste aparelho. Devolve quantos existiam. */
export function clearFeatureData(storage: Storage = window.localStorage): number {
  let removed = 0;
  for (const item of FEATURE_ITEMS) {
    if (storage.getItem(item.name) !== null) removed += 1;
    storage.removeItem(item.name);
  }
  return removed;
}
