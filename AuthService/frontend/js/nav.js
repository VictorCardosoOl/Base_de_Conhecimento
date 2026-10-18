/* ============================================================
   nav.js — Navegação e Menu Mobile
   Burger toggle, estado ativo, acessibilidade
   AuthService · Dark Industrial Terminal
   ============================================================ */

'use strict';

const Nav = (() => {

  function init() {
    const burger = document.getElementById('burger');
    const menu   = document.getElementById('mobile-menu');
    if (!burger || !menu) return;

    burger.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    });

    // Fecha o menu ao clicar fora
    document.addEventListener('click', (e) => {
      if (!burger.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });

    // Fecha o menu ao pressionar Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  return { init };

})();
