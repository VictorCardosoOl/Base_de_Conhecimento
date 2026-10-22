import type { Metadata } from 'next';
import { oauthErrorMessage } from '@/features/auth/oauth-errors';
import { sanitizeNextPath } from '@/features/auth/redirect';
import { LoginForm } from './LoginForm';

// Avisos de quem chega de outro fluxo (ex.: depois de redefinir a senha).
const NOTICES: Record<string, string> = {
  'senha-redefinida': 'Senha redefinida. Entre com a nova senha.',
};

export const metadata: Metadata = {
  title: 'Entrar | SST FAQ',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// O `next` é validado no servidor: só caminhos internos chegam ao formulário. `erro` e
// `aviso` viram mensagens fixas (códigos desconhecidos são ignorados).
export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next, erro, aviso } = await searchParams;
  const notice = first(aviso);
  return (
    <LoginForm
      next={sanitizeNextPath(first(next))}
      initialError={oauthErrorMessage(first(erro))}
      notice={notice && Object.hasOwn(NOTICES, notice) ? NOTICES[notice] : null}
    />
  );
}
