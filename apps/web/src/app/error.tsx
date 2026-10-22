'use client';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatusPage } from '@/components/ui/StatusPage';

// Erro inesperado em qualquer página: mantém cabeçalho e rodapé, oferece tentar de novo.
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <StatusPage
      code="Ops"
      role="alert"
      title="Algo deu errado ao abrir esta página"
      actions={
        <>
          <Button variant="primary" onClick={() => retry()}>
            Tentar novamente
          </Button>
          <ButtonLink href="/">Página inicial</ButtonLink>
        </>
      }
    >
      Pode ter sido uma falha de conexão. Seus dados não foram perdidos.
      {error.digest && <p className="mt-3 text-xs">Código: {error.digest}</p>}
    </StatusPage>
  );
}
