'use client';
import { Button } from '@/components/ui/Button';
import { StatusPage } from '@/components/ui/StatusPage';

// Erro ao verificar a sessão/autorização do /admin (ex.: AuthService indisponível).
// Em produção o Next não repassa a mensagem do servidor; mostramos um texto próprio
// e o `digest` para correlacionar com os logs.
export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <StatusPage
      code="503"
      role="alert"
      title="Não foi possível verificar sua sessão"
      actions={
        <Button variant="primary" onClick={() => retry()}>
          Tentar novamente
        </Button>
      }
    >
      O serviço de autenticação não respondeu. Nenhum acesso foi liberado; tente novamente em instantes.
      {error.digest && <p className="mt-3 text-xs">Código: {error.digest}</p>}
    </StatusPage>
  );
}
