import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
  browserTracingIntegration: vi.fn(() => 'tracing'),
  replayIntegration: vi.fn(() => 'replay'),
}));

vi.mock('@sentry/react', () => sentry);

const CONSENT_KEY = 'sst_user_cookie_consent';

// O DSN é lido na carga do módulo, então cada cenário importa uma instância nova.
async function loadTelemetry(dsn?: string) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', dsn ?? '');
  return import('@/features/analytics/telemetry');
}

describe('telemetry (consentimento LGPD e privacidade)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('não inicializa o Sentry sem consentimento', async () => {
    const { initTelemetry } = await loadTelemetry('https://dsn.example/1');
    initTelemetry();
    expect(sentry.init).not.toHaveBeenCalled();
  });

  it('não inicializa o Sentry sem DSN, mesmo com consentimento', async () => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    const { initTelemetry } = await loadTelemetry();
    initTelemetry();
    expect(sentry.init).not.toHaveBeenCalled();
  });

  it('inicializa uma única vez, com Replay mascarando texto e campos', async () => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    const { initTelemetry } = await loadTelemetry('https://dsn.example/1');
    initTelemetry();
    initTelemetry();

    // O SDK é carregado sob demanda (import dinâmico): espera o carregamento.
    await vi.waitFor(() => expect(sentry.init).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(sentry.init).toHaveBeenCalledTimes(1);
    expect(sentry.replayIntegration).toHaveBeenCalledWith(
      expect.objectContaining({ maskAllText: true, maskAllInputs: true, blockAllMedia: true })
    );
  });

  it('remove cookies e headers do evento antes do envio', async () => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    const { initTelemetry } = await loadTelemetry('https://dsn.example/1');
    initTelemetry();
    await vi.waitFor(() => expect(sentry.init).toHaveBeenCalled());

    const { beforeSend } = sentry.init.mock.calls[0][0];
    const event = beforeSend({ request: { url: '/x', cookies: { sid: 'segredo' }, headers: { cookie: 'sid=segredo' } } });
    expect(event.request).toEqual({ url: '/x' });
  });

  it('remove usuário e mascara campos sensíveis em extra e contexts', async () => {
    localStorage.setItem(CONSENT_KEY, 'granted');
    const { initTelemetry } = await loadTelemetry('https://dsn.example/1');
    initTelemetry();
    await vi.waitFor(() => expect(sentry.init).toHaveBeenCalled());

    const { beforeSend } = sentry.init.mock.calls[0][0];
    const event = beforeSend({
      user: { email: 'a@b.c' },
      extra: { articleId: 'pgr', senha: 'x', nested: { token: 'y' } },
      contexts: { form: { email: 'a@b.c' } },
    });
    expect(event.user).toBeUndefined();
    expect(event.extra).toEqual({ articleId: 'pgr', senha: '[Filtered]', nested: { token: '[Filtered]' } });
    expect(event.contexts).toEqual({ form: { email: '[Filtered]' } });
  });

  it('só reporta erros de conteúdo com consentimento e DSN', async () => {
    const { reportContentError } = await loadTelemetry('https://dsn.example/1');
    reportContentError(new Error('sem consentimento'));
    expect(sentry.captureException).not.toHaveBeenCalled();

    localStorage.setItem(CONSENT_KEY, 'granted');
    reportContentError(new Error('com consentimento'), { articleId: 'pgr' });
    await vi.waitFor(() => expect(sentry.captureException).toHaveBeenCalledTimes(1));
  });
});
