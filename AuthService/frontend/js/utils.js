/* ============================================================
   utils.js — Utilitários Compartilhados
   Helpers usados em múltiplas páginas
   AuthService · Dark Industrial Terminal
   ============================================================ */

"use strict";

const Utils = (() => {
    /* ── DOM Helpers ─────────────────────────────────────────── */

    /** Define o textContent de um elemento pelo ID */
    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    }

    /** Alias semântico para setText */
    function setEl(id, value) {
        setText(id, value);
    }

    /** Retorna um elemento pelo ID (null-safe shorthand) */
    function el(id) {
        return document.getElementById(id);
    }

    /* ── Botão de Loading ────────────────────────────────────── */

    /** Coloca/retira estado de carregamento num botão */
    function setBtn(id, loading, label) {
        const btn = el(id);
        if (!btn) return;
        btn.disabled = loading;
        btn.textContent = label;
    }

    /* ── Alertas ─────────────────────────────────────────────── */

    /** Exibe alerta inline (dentro de formulário). Texto puro: nunca interpreta HTML. */
    function showAlert(id, msg, type) {
        const element = el(id);
        if (!element) return;
        element.textContent = msg;
        element.className = `alert show ${type}`;
    }

    /** Remove alerta inline */
    function clearAlert(id) {
        const element = el(id);
        if (!element) return;
        element.className = "alert";
        element.textContent = "";
    }

    /** Exibe alerta de página (temporário, 4s) */
    function showPageAlert(id, msg, type) {
        const element = el(id);
        if (!element) return;
        element.textContent = msg;
        element.className = `alert page-alert show ${type}`;
        setTimeout(() => element.classList.remove("show"), 4000);
    }

    /* ── Toggle de Senha ─────────────────────────────────────── */

    /** Alterna visibilidade do campo de senha e ícone */
    function toggleEye(inputId, btn) {
        const input = el(inputId);
        if (!input) return;
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        const icon = btn.querySelector("i");
        if (icon) {
            icon.className = isPassword
                ? "fa-regular fa-eye-slash"
                : "fa-regular fa-eye";
        }
    }

    /* ── Enter para Submeter ─────────────────────────────────── */

    /** Dispara uma função ao pressionar Enter num campo */
    function bindEnter(inputId, callback) {
        const input = el(inputId);
        if (input) {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") callback();
            });
        }
    }

    /* ── Parser de Erros da API ──────────────────────────────── */

    /** Extrai a mensagem do formato padrão {"error": {"code", "message"}} */
    function parseApiError(data) {
        if (data && data.error && typeof data.error.message === "string") {
            return data.error.message;
        }
        return "erro desconhecido.";
    }

    /* ── Timestamp ───────────────────────────────────────────── */

    /** Retorna horário atual formatado HH:MM:SS */
    function timestamp() {
        return new Date().toLocaleTimeString("pt-BR", { hour12: false });
    }

    /* ── Sessão ──────────────────────────────────────────────── */
    // Os tokens ficam em cookies HttpOnly definidos pelo servidor: o JavaScript
    // não os lê nem os armazena. Remove o que versões antigas gravavam no navegador.

    function purgeLegacyStorage() {
        try {
            ["auth_token", "auth_pass", "auth_email"].forEach((key) =>
                sessionStorage.removeItem(key),
            );
        } catch {
            /* storage bloqueado: nada a limpar */
        }
    }

    /* ── Cliente da API ──────────────────────────────────────── */

    /**
     * fetch com cookies de mesma origem. Se o access token expirou, tenta uma
     * única renovação via /auth/refresh e repete a requisição (sem loop).
     */
    async function api(path, options = {}) {
        const init = {
            credentials: "same-origin",
            ...options,
            headers: { Accept: "application/json", ...(options.headers || {}) },
        };
        let res = await fetch(path, init);
        if (res.status === 401 && path !== "/auth/refresh") {
            const data = await res.clone().json().catch(() => null);
            if (data && data.error && data.error.code === "SESSION_EXPIRED") {
                const refreshed = await fetch("/auth/refresh", {
                    method: "POST",
                    credentials: "same-origin",
                });
                if (refreshed.ok) res = await fetch(path, init);
            }
        }
        return res;
    }

    /* ── Base URL ────────────────────────────────────────────── */

    /** Retorna a origem da aplicação (funciona local e no Render) */
    function getBaseUrl() {
        return window.location.origin;
    }

    return {
        setText,
        setEl,
        el,
        setBtn,
        showAlert,
        clearAlert,
        showPageAlert,
        toggleEye,
        bindEnter,
        parseApiError,
        timestamp,
        purgeLegacyStorage,
        api,
        getBaseUrl,
    };
})();

// Expõe funções comuns usadas via onclick no HTML
function toggleEye(id, btn) {
    Utils.toggleEye(id, btn);
}
