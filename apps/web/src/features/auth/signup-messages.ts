import type { RegisterResult, SocialSignupResult } from './client';
import { tooManyAttemptsMessage } from './presentation';

/** Mensagens dos cadastros (com senha e por login social). Nada vem do servidor. */
export const USERNAME_TAKEN = 'Este usuário já está em uso. Escolha outro.';
export const USERNAME_RESERVED = 'Este nome é reservado. Escolha outro.';
export const TERMS_REQUIRED =
  'Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.';

type SignupFailure = Exclude<RegisterResult | SocialSignupResult, { ok: true }>;

export function signupMessage(result: SignupFailure): string {
  switch (result.reason) {
    case 'email_taken':
      return 'Já existe uma conta com este email. Entre ou use outro email.';
    case 'username_taken':
      return USERNAME_TAKEN;
    case 'username_reserved':
      return USERNAME_RESERVED;
    case 'terms_outdated':
      return 'Os Termos de Uso ou a Política de Privacidade foram atualizados. Recarregue a página, leia a nova versão e aceite de novo.';
    case 'validation':
      return 'Verifique os dados informados.';
    case 'disabled':
      return 'O cadastro está desativado. Peça acesso a um administrador.';
    case 'expired':
      return 'O cadastro com o provedor expirou. Comece de novo pelo botão do provedor.';
    case 'rate_limited':
      return tooManyAttemptsMessage(result.retryAfterSeconds, 'Muitos cadastros em sequência.');
    case 'unavailable':
      return 'Serviço de autenticação indisponível. Tente novamente em instantes.';
  }
}
