import { ButtonLink } from '@/components/ui/Button';
import { StatusPage } from '@/components/ui/StatusPage';
import { LogoutButton } from '@/features/auth/components/LogoutButton';

// Página 403 renderizada por forbidden() (experimental.authInterrupts).
export default function Forbidden() {
  return (
    <StatusPage
      code="403"
      title="Acesso restrito"
      actions={
        <>
          <ButtonLink href="/" variant="primary">
            Voltar para a Base de Conhecimento
          </ButtonLink>
          <ButtonLink href="/conta">Minha conta</ButtonLink>
          {/* Sem sair, o login renovaria a mesma sessão e voltaria para cá. */}
          <LogoutButton className="ui-btn ui-btn--ghost">Sair e entrar com outra conta</LogoutButton>
        </>
      }
    >
      Sua conta não tem permissão para acessar esta área. Se precisa publicar ou revisar conteúdo, peça acesso de editor em
      Minha conta.
    </StatusPage>
  );
}
