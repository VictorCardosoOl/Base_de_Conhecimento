import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Script de Engenharia de Performance e Teste de Carga - K6
 * Simula picos de concorrência com estágios de aquecimento, saturação e resfriamento.
 */
export const options = {
  stages: [
    { duration: '30s', target: 50 },    // Ramping up: 50 VUs em 30 segundos
    { duration: '1m', target: 200 },    // Carga sustentada moderada: 200 VUs
    { duration: '30s', target: 500 },   // Pico de saturação: 500 VUs
    { duration: '1m', target: 500 },    // Estresse sob 500 VUs simultâneos
    { duration: '30s', target: 0 },     // Ramp-down / Cooldown
  ],
  thresholds: {
    // 95% das requisições devem responder em menos de 500ms (SLA de Edge/PWA)
    http_req_duration: ['p(90)<300', 'p(95)<500', 'p(99)<1200'],
    // Taxa de falha (HTTP 5xx / timeouts) deve ser inferior a 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://base-de-conhecimento-seven.vercel.app';

export default function () {
  // 1. Acesso à página inicial (Acervo)
  const homeRes = http.get(`${BASE_URL}/`, {
    headers: { 'Accept': 'text/html,application/xhtml+xml' },
  });
  check(homeRes, {
    'Home status 200': (r) => r.status === 200,
    'Home carregada em < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // 2. Consulta a artigo técnico com chunk dinâmico (S-2240)
  const articleRes = http.get(`${BASE_URL}/artigo/evento-s2240-condicoes-ambientais`);
  check(articleRes, {
    'Artigo status 200': (r) => r.status === 200,
    'Artigo carregado em < 600ms': (r) => r.timings.duration < 600,
  });

  sleep(1.5);

  // 3. Consulta ao sitemap e manifest PWA
  const sitemapRes = http.get(`${BASE_URL}/sitemap.xml`);
  check(sitemapRes, {
    'Sitemap acessível': (r) => r.status === 200,
  });

  sleep(2);
}
