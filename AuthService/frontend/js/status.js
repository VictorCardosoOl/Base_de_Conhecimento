/* ============================================================
   status.js — Lógica da Página Status da API (status.html)
   Pings, log de requisições, monitoramento de endpoints
   AuthService · Dark Industrial Terminal
   ============================================================ */

'use strict';

const StatusPage = (() => {

  /* ── Inicialização ───────────────────────────────────────── */

  function init() {
    Utils.purgeLegacyStorage();

    const bootTs = document.getElementById('boot-ts');
    if (bootTs) bootTs.textContent = Utils.timestamp();

    // Roda verificação inicial
    runAllChecks();
  }

  /* ── Verificação de /health ──────────────────────────────── */

  async function pingHealth() {
    const dot = document.getElementById('ep-dot-health');
    const t0  = performance.now();

    try {
      const res  = await fetch(`${Utils.getBaseUrl()}/health`);
      const ms   = Math.round(performance.now() - t0);

      if (res.ok) {
        Utils.setEl('ep-lat-health',  `${ms}ms`);
        Utils.setEl('ep-st-health',   '200 OK');
        Utils.setEl('ep-time-health', Utils.timestamp());
        _setDot(dot, true);
        _setOverallStatus(true, `${ms}ms`);
        _log(`GET /health → 200 OK · ${ms}ms`, 'success');
      } else {
        _setDot(dot, false);
        _setOverallStatus(false, `${res.status}`);
        _log(`GET /health → ${res.status} Erro`, 'error');
      }
    } catch (err) {
      _setDot(dot, false);
      _setOverallStatus(false, 'offline');
      _log(`GET /health → falha de conexão`, 'error');
    }
  }

  /* ── Verificação de /auth/me (sessão por cookie HttpOnly) ─── */

  async function pingMe() {
    const dot = document.getElementById('ep-dot-me');
    const t0 = performance.now();

    try {
      const res = await Utils.api('/auth/me');
      const ms  = Math.round(performance.now() - t0);

      if (res.ok) {
        Utils.setEl('ep-lat-me',  `${ms}ms`);
        Utils.setEl('ep-time-me', Utils.timestamp());
        _setDot(dot, true);
        _log(`GET /auth/me → 200 OK · ${ms}ms`, 'success');
      } else {
        _setDot(dot, false);
        _log(`GET /auth/me → ${res.status} (sem sessão ativa — faça login)`, 'error');
      }
    } catch (err) {
      _setDot(dot, false);
      _log('GET /auth/me → falha de conexão', 'error');
    }
  }

  /* ── Verificar todos os endpoints ────────────────────────── */

  function runAllChecks() {
    _log('iniciando verificação de todos os endpoints...', 'info');
    pingHealth();
    pingMe();
  }

  /* ── Limpar log ──────────────────────────────────────────── */

  function clearLog() {
    const logBody = document.getElementById('status-log');
    if (logBody) logBody.innerHTML = '';
  }

  /* ── Privado: status global (hero badge) ─────────────────── */

  function _setOverallStatus(online, sub) {
    const dot   = document.getElementById('sh-dot');
    const label = document.getElementById('sh-label');
    const sub2  = document.getElementById('sh-sub2');

    if (dot)   dot.className       = 'sh-dot ' + (online ? 'on' : 'off');
    if (label) label.textContent   = online ? 'OPERACIONAL' : 'OFFLINE';
    if (sub2)  sub2.textContent    = sub;
  }

  /* ── Privado: dot de endpoint ────────────────────────────── */

  function _setDot(el, ok) {
    if (!el) return;
    el.className = 'ep-dot ' + (ok ? 'ok' : 'err');
  }

  /* ── Privado: linha de log ───────────────────────────────── */

  function _log(msg, type = '') {
    const container = document.getElementById('status-log');
    if (!container) return;

    const line = document.createElement('div');
    line.className = `log-line${type ? ` log-${type}` : ''}`;
    const ts = document.createElement('span');
    ts.className = 'log-ts';
    ts.textContent = Utils.timestamp();
    const text = document.createElement('span');
    text.className = 'log-msg';
    text.textContent = msg;
    line.append(ts, text);
    container.appendChild(line);

    // Auto-scroll para o final
    container.scrollTop = container.scrollHeight;
  }

  return { init, pingHealth, pingMe, runAllChecks, clearLog };

})();

/* ── Expõe globalmente para uso inline no HTML ─────────────── */
function pingHealth()    { StatusPage.pingHealth(); }
function pingMe()        { StatusPage.pingMe(); }
function runAllChecks()  { StatusPage.runAllChecks(); }
function clearStatusLog(){ StatusPage.clearLog(); }

/* ── Boot ──────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  Nav.init();
  StatusPage.init();
});
