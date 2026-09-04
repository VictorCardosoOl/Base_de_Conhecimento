/**
 * APM (Application Performance Monitoring) / Logger Facade
 * 
 * Abstrai a ferramenta de telemetria utilizada (ex: Sentry, LogRocket, Datadog).
 * Desta forma, o código da aplicação não fica acoplado à biblioteca específica.
 */

class APMService {
  init() {
    // Boilerplate para Sentry
    // Sentry.init({ dsn: "SUA_DSN_AQUI", tracesSampleRate: 1.0 });
    console.log("[APM] Inicializado na Fase 1.");
  }

  captureError(error: Error | unknown, context?: Record<string, any>) {
    // Sentry.captureException(error, { extra: context });
    console.error("[APM - ERROR CAUGHT]", error, context || '');
  }

  logInfo(message: string, context?: Record<string, any>) {
    // Sentry.captureMessage(message, "info");
    console.info("[APM - INFO]", message, context || '');
  }

  // Monitoramento de performance basico
  trackPageLoad(pageName: string, loadTimeMs: number) {
    console.log(\[APM - PERFORMANCE] Carregamento \: \ms\);
  }
}

export const apm = new APMService();
