/* ============================================================
   theme.js — Alternância e Persistência de Tema
   Responsável exclusivamente pela lógica de tema claro/escuro
   AuthService · Dark Industrial Terminal
   ============================================================ */

'use strict';

const Theme = (() => {

  const STORAGE_KEY = 'auth_theme';
  const DEFAULT     = 'dark';

  /** Aplica o tema ao <html> e atualiza o ícone do botão */
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    _updateIcon(theme);
  }

  /** Alterna entre dark e light */
  function toggle() {
    const current = document.documentElement.getAttribute('data-theme') || DEFAULT;
    apply(current === 'dark' ? 'light' : 'dark');
  }

  /** Lê a preferência salva (ou usa padrão) e aplica */
  function init() {
    const saved = localStorage.getItem(STORAGE_KEY) || DEFAULT;
    apply(saved);
  }

  /** Atualiza ícone e title do botão de alternância */
  function _updateIcon(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = theme === 'dark'
        ? 'fa-regular fa-sun'
        : 'fa-regular fa-moon';
    }
    btn.setAttribute('title', theme === 'dark' ? 'Tema claro' : 'Tema escuro');
    btn.setAttribute('aria-label', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
  }

  return { init, apply, toggle };

})();

// Expõe globalmente para uso inline no HTML (onclick="toggleTheme()")
function toggleTheme() { Theme.toggle(); }

// Inicializa imediatamente ao carregar o módulo
Theme.init();
