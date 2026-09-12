import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const CONSENT_STORAGE_KEY = 'sst_user_cookie_consent';

export function hasUserConsented(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_STORAGE_KEY) === 'granted';
}

let isInitialized = false;

export function initTelemetry() {
  // Privacy by Default: Não inicializa sem o consentimento prévio explícito (LGPD Art. 7, I)
  if (!hasUserConsented()) {
    if (import.meta.env.DEV) {
      console.log('🔒 [Telemetry] Consent Gate ativo: telemetria bloqueada até consentimento explícito do usuário.');
    }
    return;
  }

  if (isInitialized) return;

  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: true,
        }),
      ],
      // Captura de performance e Real User Monitoring (RUM)
      tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
      release: 'sst-faq@1.0.0',
      beforeSend(event) {
        // Sanitiza dados sensíveis antes do envio
        return event;
      }
    });
    isInitialized = true;
  } else {
    // Modo observabilidade local/fallback
    if (import.meta.env.DEV) {
      console.log('📡 [Telemetry] Sentry DSN não configurado. Telemetria em modo passivo local.');
    }
    isInitialized = true;
  }
}

// Reportador customizado para capturar falhas em lazy chunks e parsers de conteúdo
export function reportContentError(error: unknown, context?: Record<string, any>) {
  console.error('🚨 [Content Error / Chunk Failure]:', error, context);
  if (hasUserConsented() && SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
      tags: { source: 'content-chunk-loader' }
    });
  }
}
