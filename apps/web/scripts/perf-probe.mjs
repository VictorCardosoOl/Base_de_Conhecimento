/**
 * Sonda de desempenho da interface (uso local, não faz parte do build).
 *
 *   node scripts/perf-probe.mjs [url]
 *
 * Abre a página no Chromium (Playwright), mede quadros e "long animation frames" em
 * cenários reais: ocioso, abrir/fechar o menu, rolar, abrir a busca e abrir um artigo.
 * Também coleta métricas do Chrome DevTools Protocol (layouts, recálculos de estilo e
 * tempo de script). Serve para comparar antes/depois, não como número absoluto
 * (headless usa renderização por software).
 */
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:3000/';
// CSS extra para isolar custos (ex.: desligar um efeito e comparar).
const injectCss = process.env.PERF_CSS ?? '';

const SAMPLE = `async (ms, action) => {
  const frames = []; let last = performance.now(); let run = true; const loaf = [];
  let po;
  try {
    po = new PerformanceObserver((l) => l.getEntries().forEach((e) => loaf.push(e.duration)));
    po.observe({ type: 'long-animation-frame', buffered: false });
  } catch {}
  const tick = (t) => { frames.push(t - last); last = t; if (run) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  if (action) await action();
  await new Promise((r) => setTimeout(r, ms));
  run = false; po?.disconnect();
  const f = frames.slice(2).sort((a, b) => a - b);
  const avg = f.reduce((a, b) => a + b, 0) / Math.max(1, f.length);
  return {
    fps: Math.round(1000 / avg),
    p95ms: Math.round(f[Math.floor(f.length * 0.95)] ?? 0),
    janky: f.filter((x) => x > 34).length,
    longFrames: loaf.length,
    worstLongFrameMs: Math.round(Math.max(0, ...loaf)),
  };
}`;

async function metrics(cdp) {
  const { metrics } = await cdp.send('Performance.getMetrics');
  const pick = (name) => metrics.find((m) => m.name === name)?.value ?? 0;
  return {
    layouts: pick('LayoutCount'),
    styleRecalcs: pick('RecalcStyleCount'),
    scriptMs: Math.round(pick('ScriptDuration') * 1000),
    layoutMs: Math.round(pick('LayoutDuration') * 1000),
    styleMs: Math.round(pick('RecalcStyleDuration') * 1000),
  };
}

function diff(a, b) {
  return Object.fromEntries(Object.keys(a).map((k) => [k, b[k] - a[k]]));
}

// PERF_GPU=1 tenta a GPU real (Windows: ANGLE/D3D11); sem ela, renderização por software.
const gpuArgs = process.env.PERF_GPU
  ? ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization']
  : ['--enable-gpu-rasterization'];
const browser = await chromium.launch({ args: gpuArgs });
const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });
await page.addInitScript(() => localStorage.setItem('sst_user_cookie_consent', 'denied'));
const cdp = await page.context().newCDPSession(page);
await cdp.send('Performance.enable');

await page.goto(url, { waitUntil: 'networkidle' });
const renderer = await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl');
  const ext = gl?.getExtension('WEBGL_debug_renderer_info');
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'desconhecido';
});
console.log('Renderizador:', renderer);
if (injectCss) await page.addStyleTag({ content: injectCss });
await page.waitForTimeout(1500);

const results = {};
async function scenario(name, action, ms = 1500) {
  const before = await metrics(cdp);
  const frames = await page.evaluate(
    ([sample, ms, actionSrc]) => {
      const fn = eval(sample);
      const act = actionSrc ? eval(actionSrc) : undefined;
      return fn(ms, act);
    },
    [SAMPLE, ms, action ?? null]
  );
  results[name] = { ...frames, ...diff(before, await metrics(cdp)) };
}

await scenario('ocioso', null, 2000);
await scenario(
  'menu-abrir',
  `async () => document.querySelector('[aria-controls="nav-drawer"], [aria-controls="staggered-menu-panel"]').click()`
);
await page.keyboard.press('Escape');
await page.waitForTimeout(800);
await scenario(
  'rolagem',
  `async () => { let y = 0; const id = setInterval(() => { y += 40; window.scrollTo(0, y); }, 16); setTimeout(() => clearInterval(id), 1800); }`,
  2000
);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
await scenario(
  'busca-abrir-digitar',
  `async () => { document.querySelector('[aria-label="Pesquisar artigos"]')?.click(); await new Promise(r => setTimeout(r, 120)); const i = document.querySelector('input[role="combobox"]'); if (i) { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; for (const ch of 'esocial') { set.call(i, i.value + ch); i.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 60)); } } }`
);
await page.keyboard.press('Escape');
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
await scenario(
  'artigo-abrir',
  `async () => { const a = document.querySelector('main article a[href^="/artigo/"], main a[href^="/artigo/"]'); a?.click(); }`,
  2500
);
await scenario(
  'artigo-rolar',
  `async () => { const c = document.querySelector('[role="dialog"] .overflow-y-auto') || document.scrollingElement; let y = 0; const id = setInterval(() => { y += 40; c.scrollTo(0, y); }, 16); setTimeout(() => clearInterval(id), 1800); }`,
  2000
);

console.table(results);
await browser.close();
