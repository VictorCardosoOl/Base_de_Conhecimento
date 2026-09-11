import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initTelemetry() {
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
  } else {
    // Modo observabilidade local/fallback
    if (import.meta.env.DEV) {
      console.log('📡 [Telemetry] Sentry DSN não configurado. Telemetria em modo passivo local.');
    }
  }
}

// Reportador customizado para capturar falhas em lazy chunks e parsers de conteúdo
export function reportContentError(error: unknown, context?: Record<string, any>) {
  console.error('🚨 [Content Error / Chunk Failure]:', error, context);
  if (SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
      tags: { source: 'content-chunk-loader' }
    });
  }
}
