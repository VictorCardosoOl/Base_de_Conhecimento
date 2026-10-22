/**
 * Mensagens dos retornos do login social: o AuthService volta para
 * /login?erro=oauth_<motivo> (ADR-0013). Mensagens próprias; nada vem do servidor.
 */
const MESSAGES: Record<string, string> = {
  oauth_unavailable:
    'Este provedor de login não está disponível no momento. Entre com email e senha.',
  oauth_rate_limited:
    'Muitas tentativas de login social. Tente novamente em alguns minutos.',
  oauth_state:
    'A tentativa de login expirou ou foi iniciada em outra aba. Clique no botão do provedor de novo.',
  oauth_denied: 'O login foi cancelado na tela do provedor.',
  oauth_provider:
    'Não foi possível concluir o login com o provedor. Tente novamente em instantes.',
  oauth_email_unverified:
    'O provedor não confirmou o seu email. Confirme o email na conta do provedor ou entre com email e senha.',
  oauth_link_requires_verification:
    'Já existe uma conta com este email, mas ele ainda não foi confirmado. Entre com sua senha e confirme o email em Minha conta; depois disso, o login social passa a funcionar.',
  oauth_already_linked:
    'Sua conta já está vinculada a outra conta deste provedor.',
  oauth_inactive:
    'Não foi possível entrar com esta conta. Fale com o administrador.',
  oauth_registration_disabled:
    'Não há conta com este email e o cadastro está desativado. Peça acesso a um administrador.',
};

/** Mensagem para o código recebido em `?erro=`, ou null se não for um erro conhecido. */
export function oauthErrorMessage(code: unknown): string | null {
  return typeof code === 'string' && Object.hasOwn(MESSAGES, code)
    ? MESSAGES[code]
    : null;
}
