import type { ErrorEvent } from '@sentry/react';
import { hasUserConsented } from '@/features/consent/consent-storage';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PROD = process.env.NODE_ENV === 'production';
const RELEASE = process.env.NEXT_PUBLIC_APP_VERSION
  ? `sst-faq@${process.env.NEXT_PUBLIC_APP_VERSION}`
  : undefined;

/** Campos removidos de qualquer payload enviado ao Sentry (LGPD — minimização). */
const SENSITIVE_KEYS = /pass(word)?|senha|token|secret|authorization|cookie|email/i;

function scrub<T>(value: T): T {
  if (!value || typeof value !== 'object') return value;
  for (const key of Object.keys(value as Record<string, unknown>)) {
    const record = value as Record<string, unknown>;
    if (SENSITIVE_KEYS.test(key)) record[key] = '[Filtered]';
    else scrub(record[key]);
  }
  return value;
}

function beforeSend(event: ErrorEvent): ErrorEvent {
  delete event.user;
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
  }
  scrub(event.extra);
  scrub(event.contexts);
  return event;
}

type SentryModule = typeof import('@sentry/react');
let sentryPromise: Promise<SentryModule | null> | null = null;

/**
 * Carrega o SDK sob demanda: o Sentry (com Replay) só entra no bundle do usuário
 * após consentimento e com DSN configurado, sem bloquear a thread principal no boot.
 */
function loadSentry(): Promise<SentryModule | null> {
  if (!SENTRY_DSN || !hasUserConsented()) return Promise.resolve(null);
  if (sentryPromise) return sentryPromise;

  sentryPromise = import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({
        dsn: SENTRY_DSN,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            // Privacy by Default: nenhum texto/input digitado é gravado
            maskAllText: true,
            maskAllInputs: true,
            blockAllMedia: true,
          }),
        ],
        // Captura de performance e Real User Monitoring (RUM)
        tracesSampleRate: IS_PROD ? 0.2 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        environment: process.env.NODE_ENV,
        release: RELEASE,
        sendDefaultPii: false,
        beforeSend,
      });
      return Sentry;
    })
    .catch((err) => {
      console.warn('[telemetry] Falha ao carregar o Sentry:', err);
      sentryPromise = null;
      return null;
    });

  return sentryPromise;
}

/** Chave da gravação de sessão do Sentry Replay (sessionStorage). */
const REPLAY_SESSION_KEY = 'sentryReplaySession';

/**
 * Revogação do consentimento: encerra o Sentry já carregado (para de enviar eventos e
 * gravações) e apaga a marca da gravação de sessão. Um novo consentimento o reinicia.
 */
export function stopTelemetry() {
  const loaded = sentryPromise;
  sentryPromise = null;
  void loaded?.then((Sentry) => Sentry?.close());
  try {
    window.sessionStorage.removeItem(REPLAY_SESSION_KEY);
  } catch {
    // armazenamento bloqueado: nada a apagar
  }
}

export function initTelemetry() {
  // Privacy by Default: Não inicializa sem o consentimento prévio explícito (LGPD Art. 7, I)
  if (!hasUserConsented()) return;
  void loadSentry();
}

// Reportador customizado para capturar falhas em lazy chunks e parsers de conteúdo
export function reportContentError(
  error: unknown,
  context?: Record<string, unknown>
) {
  if (!IS_PROD && process.env.NODE_ENV !== 'test') {
    console.error('🚨 [Content Error / Chunk Failure]:', error, context);
  }

  void loadSentry().then((Sentry) => {
    Sentry?.captureException(error, {
      extra: context,
      tags: { source: 'content-chunk-loader' },
    });
  });
}
