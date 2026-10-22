/**
 * Interações com os artigos (avaliações, sugestões de correção e comentários).
 *
 * O navegador fala só com a própria origem: /content/* é repassado ao AuthService pelo
 * Next (mesmo caminho do /auth/*), com o cookie de sessão HttpOnly. Este módulo nunca
 * lê tokens; com o access vencido, `authFetch` renova uma vez e repete.
 */
import { authFetch } from '@/features/auth/client';

export interface RatingSummary {
  average: number | null;
  count: number;
  /** Votos por nota, da 1 (posição 0) à 5. */
  distribution: number[];
}

export interface ArticleSummary {
  article_id: string;
  rating: RatingSummary;
  my_rating: number | null;
  comment_count: number;
}

export type CorrectionKind = 'erro' | 'desatualizado' | 'inconsistencia' | 'outro';
export type CorrectionStatus = 'open' | 'resolved' | 'rejected';

export const CORRECTION_KINDS: Array<{ value: CorrectionKind; label: string }> = [
  { value: 'erro', label: 'Informação errada' },
  { value: 'desatualizado', label: 'Desatualizado (norma, prazo ou leiaute mudou)' },
  { value: 'inconsistencia', label: 'Inconsistência com outro trecho ou artigo' },
  { value: 'outro', label: 'Outro problema' },
];

export const CORRECTION_STATUS_LABEL: Record<CorrectionStatus, string> = {
  open: 'Em revisão',
  resolved: 'Corrigida',
  rejected: 'Não aplicada',
};

export interface Correction {
  id: string;
  article_id: string;
  kind: CorrectionKind;
  description: string;
  excerpt: string | null;
  status: CorrectionStatus;
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
}

export interface CorrectionForReview extends Correction {
  author_username: string | null;
  author_display_name: string | null;
  resolver_display_name: string | null;
}

export interface CommentAuthor {
  username: string;
  display_name: string;
  role: string;
}

export interface Comment {
  id: string;
  article_id: string;
  parent_id: string | null;
  body: string | null;
  author: CommentAuthor | null;
  created_at: string;
  edited_at: string | null;
  deleted: boolean;
  can_edit: boolean;
  can_delete: boolean;
  replies: Comment[];
}

export interface ModerationComment {
  id: string;
  article_id: string;
  parent_id: string | null;
  body: string;
  author: CommentAuthor;
  created_at: string;
  edited_at: string | null;
}

export interface Page<T> {
  items: T[];
  total: number;
}

export const COMMENT_MAX_LENGTH = 2000;
export const COMMENT_MAX_LINKS = 2;
export const CORRECTION_MIN_LENGTH = 10;
export const CORRECTION_MAX_LENGTH = 2000;
export const EXCERPT_MAX_LENGTH = 1000;

export type ContentErrorReason =
  | 'unauthenticated'
  | 'forbidden'
  | 'password_change_required'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'rate_limited'
  | 'unavailable';

export interface ContentError {
  ok: false;
  reason: ContentErrorReason;
  /** Campo apontado pelo servidor (ex.: "body", "parent_id"). */
  field: string | null;
  /** Mensagem do servidor para erros de regra (texto próprio, sem dados sensíveis). */
  serverMessage: string | null;
  retryAfterSeconds: number | null;
}

export type ContentResult<T> = { ok: true; data: T } | ContentError;

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

function reasonFor(status: number): ContentErrorReason {
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  return 'unavailable';
}

async function call<T>(path: string, init: RequestInit = {}): Promise<ContentResult<T>> {
  let response: Response;
  try {
    response = await authFetch(path, { cache: 'no-store', ...init });
  } catch {
    return { ok: false, reason: 'unavailable', field: null, serverMessage: null, retryAfterSeconds: null };
  }
  let body: unknown = null;
  // Sempre consome o corpo (libera a conexão), mesmo em 204.
  const text = await response.text().catch(() => '');
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  if (response.ok) return { ok: true, data: body as T };

  const error = (body as { error?: { code?: unknown; message?: unknown; details?: unknown } } | null)?.error;
  const details = Array.isArray(error?.details) ? (error.details[0] as { field?: unknown } | undefined) : undefined;
  const retry = Number(response.headers.get('retry-after'));
  // Senha temporária (definida por um admin): o AuthService só libera a troca e a leitura.
  const reason =
    response.status === 403 && error?.code === 'PASSWORD_CHANGE_REQUIRED'
      ? 'password_change_required'
      : reasonFor(response.status);
  return {
    ok: false,
    reason,
    field: typeof details?.field === 'string' ? details.field : null,
    // Só regras de negócio (409/400 com campo) trazem texto útil para a pessoa.
    serverMessage:
      (reason === 'conflict' || reason === 'validation') && typeof error?.message === 'string'
        ? error.message
        : null,
    retryAfterSeconds: Number.isFinite(retry) && retry > 0 ? retry : null,
  };
}

const article = (id: string) => `/content/articles/${encodeURIComponent(id)}`;

export const fetchArticleSummary = (articleId: string) =>
  call<ArticleSummary>(`${article(articleId)}/summary`);

export const rateArticle = (articleId: string, value: number) =>
  call<ArticleSummary>(`${article(articleId)}/rating`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify({ value }),
  });

export const removeRating = (articleId: string) =>
  call<ArticleSummary>(`${article(articleId)}/rating`, { method: 'DELETE' });

export const suggestCorrection = (
  articleId: string,
  input: { kind: CorrectionKind; description: string; excerpt?: string | null }
) =>
  call<Correction>(`${article(articleId)}/corrections`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ kind: input.kind, description: input.description, excerpt: input.excerpt || null }),
  });

export const fetchMyCorrections = () => call<Correction[]>('/content/corrections/mine');

export const fetchCorrections = (status: CorrectionStatus | 'all', offset = 0) =>
  call<Page<CorrectionForReview> & { limit: number; offset: number }>(
    `/content/corrections?${new URLSearchParams({ status, limit: '50', offset: String(offset) })}`
  );

export const reviewCorrection = (id: string, status: 'resolved' | 'rejected', note?: string) =>
  call<Correction>(`/content/corrections/${encodeURIComponent(id)}/review`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ status, note: note || null }),
  });

export const fetchComments = (articleId: string) => call<Page<Comment>>(`${article(articleId)}/comments`);

export const postComment = (articleId: string, body: string, parentId?: string | null) =>
  call<Comment>(`${article(articleId)}/comments`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(parentId ? { body, parent_id: parentId } : { body }),
  });

export const editComment = (id: string, body: string) =>
  call<Comment>(`/content/comments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({ body }),
  });

export const deleteComment = (id: string) =>
  call<null>(`/content/comments/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const fetchRecentComments = (offset = 0) =>
  call<Page<ModerationComment> & { limit: number; offset: number }>(
    `/content/comments?${new URLSearchParams({ limit: '50', offset: String(offset) })}`
  );

/** Texto para a pessoa a partir de uma falha (sem detalhes técnicos). */
export function contentErrorMessage(error: ContentError, action = 'concluir a ação'): string {
  switch (error.reason) {
    case 'unauthenticated':
      return 'Sua sessão terminou. Entre novamente para continuar.';
    case 'forbidden':
      return 'Você não tem permissão para esta ação.';
    case 'password_change_required':
      return 'Troque a senha temporária em Minha conta antes de continuar.';
    case 'not_found':
      return 'Este item não existe mais. Atualize a página.';
    case 'rate_limited':
      return error.retryAfterSeconds
        ? `Muitas ações seguidas. Tente de novo em ${Math.ceil(error.retryAfterSeconds / 60)} min.`
        : 'Muitas ações seguidas. Tente de novo em instantes.';
    case 'conflict':
    case 'validation':
      return error.serverMessage && error.field ? error.serverMessage : `Não foi possível ${action}. Revise os dados.`;
    default:
      return `Não foi possível ${action} agora. Verifique a conexão e tente de novo.`;
  }
}

/** Conta links como o servidor (http://, https:// ou www.). */
export function countLinks(text: string): number {
  return (text.match(/(https?:\/\/|www\.)/gi) ?? []).length;
}
