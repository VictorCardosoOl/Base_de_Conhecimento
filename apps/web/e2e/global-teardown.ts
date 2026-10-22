import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * Limpeza automática do banco local depois dos testes E2E.
 *
 * Os fluxos reais de cadastro e gestão de usuários (signup.spec, users.spec) criam contas
 * `cadastro-<n>@exemplo.com.br` e `e2e-<n>@exemplo.com.br`. Ao terminar, o AuthService
 * apaga só essas (comando `delete-e2e-users`, que recusa rodar fora de desenvolvimento).
 * Os demais testes das telas de acesso simulam as rotas que gravariam algo.
 *
 * O AuthService é procurado na pasta vizinha (../AuthService), como nos scripts auth:*;
 * E2E_AUTHSERVICE_DIR troca. Falhar aqui não derruba a execução: só avisa.
 */
export default function globalTeardown(): void {
  // Sem as contas de teste, os fluxos reais foram pulados: nada foi criado.
  if (!process.env.E2E_ADMIN_EMAIL && !process.env.E2E_EDITOR_EMAIL) return;

  const dir =
    process.env.E2E_AUTHSERVICE_DIR ??
    path.resolve(process.cwd(), '..', 'AuthService');
  const compose = path.join(dir, 'docker-compose.yml');
  try {
    const output = execFileSync(
      'docker',
      [
        'compose',
        '-f',
        compose,
        'exec',
        '-T',
        'auth-service',
        'python',
        '-m',
        'backend.cli',
        'delete-e2e-users',
      ],
      { encoding: 'utf8', timeout: 60_000, stdio: ['ignore', 'pipe', 'pipe'] }
    );
    console.log(`[e2e] ${output.trim()}`);
  } catch (error) {
    const detail =
      error instanceof Error ? error.message.split('\n')[0] : String(error);
    console.warn(
      `[e2e] Não foi possível apagar as contas de teste (${detail}). ` +
        `Rode manualmente: docker compose -f "${compose}" exec auth-service python -m backend.cli delete-e2e-users`
    );
  }
}
