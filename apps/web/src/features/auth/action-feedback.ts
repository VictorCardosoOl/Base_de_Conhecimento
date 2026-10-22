import { refreshSession } from './client';
import type { UserActionError, UserActionResult } from './user-actions';
import { hardNavigate } from '@/lib/navigation';

/** Mensagens próprias para os erros das Server Actions do painel. */
export const ACTION_MESSAGES: Record<UserActionError, string> = {
  invalid_input: 'Verifique os dados informados.',
  email_taken: 'Já existe um usuário com este email.',
  username_taken: 'Este usuário já está em uso. Escolha outro.',
  not_found: 'Não encontrado. Atualize a página.',
  last_admin: 'É preciso manter ao menos um administrador ativo.',
  already_decided: 'Este pedido já foi decidido ou não se aplica mais. Atualize a página.',
  self_change: 'Você não pode alterar o próprio papel, se desativar ou redefinir a própria senha aqui.',
  forbidden: 'Sua conta não tem permissão para esta operação.',
  unavailable: 'Serviço de autenticação indisponível. Tente novamente em instantes.',
  session_expired: 'Sua sessão expirou. Entre novamente.',
  unauthenticated: 'Sua sessão terminou. Entre novamente.',
  password_change_required: 'Troque sua senha antes de continuar.',
};

/**
 * Executa uma Server Action. Access expirado: renova a sessão (proxy /auth/refresh)
 * e tenta uma única vez de novo. Sessão encerrada ou troca de senha pendente: sai da
 * tela (volta para `selfPath` depois). Devolve null quando saiu da tela.
 */
export async function runAction(
  action: () => Promise<UserActionResult>,
  selfPath: string
): Promise<UserActionResult | null> {
  let result = await action();
  if (!result.ok && result.error === 'session_expired' && (await refreshSession())) {
    result = await action();
  }
  if (!result.ok && (result.error === 'session_expired' || result.error === 'unauthenticated')) {
    hardNavigate(`/login?${new URLSearchParams({ next: selfPath })}`);
    return null;
  }
  if (!result.ok && result.error === 'password_change_required') {
    hardNavigate(`/conta/senha?${new URLSearchParams({ next: selfPath })}`);
    return null;
  }
  return result;
}
