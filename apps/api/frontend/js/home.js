/* ============================================================
   home.js — Lógica da Página Home / Dashboard (home.html)
   Perfil via /auth/me, informações de sessão e logout.
   A sessão vive em cookies HttpOnly: esta página não vê tokens.
   AuthService · Dark Industrial Terminal
   ============================================================ */

"use strict";

const HomePage = (() => {
    /* ── Inicialização ───────────────────────────────────────── */

    function init() {
        Utils.purgeLegacyStorage();
        loadMe();
    }

    function _showNoSession() {
        document.getElementById("no-session")?.classList.add("show");
        const cardsGrid = document.querySelector(".cards-grid");
        const profileHero = document.querySelector(".profile-hero");
        if (cardsGrid) cardsGrid.style.display = "none";
        if (profileHero) profileHero.style.display = "none";
    }

    /* ── Carregar dados de /auth/me ──────────────────────────── */

    async function loadMe() {
        Utils.setBtn("btn-me", true, "buscando...");
        try {
            const res = await Utils.api("/auth/me");
            if (res.status === 401) {
                _showNoSession();
                return;
            }
            const data = await res.json().catch(() => null);
            if (res.ok && data) {
                _populateProfile(data);
                _setSessionInfo();
            } else {
                Utils.showPageAlert("home-alert", `✗ ${Utils.parseApiError(data)}`, "error");
            }
        } catch {
            Utils.showPageAlert("home-alert", "✗ falha de conexão.", "error");
        } finally {
            Utils.setBtn("btn-me", false, "↻ Atualizar");
        }
    }

    /* ── Preenche dados do perfil ────────────────────────────── */

    function _populateProfile(data) {
        const email = data.email || "—";
        const displayName = email.includes("@") ? email.split("@")[0] : email;

        Utils.setText("hero-name", displayName);
        Utils.setText("hero-email", email);
        Utils.setText("d-id", data.id || "—");
        Utils.setText("d-name", displayName);
        Utils.setText("d-email", email);
        Utils.setText("d-role", data.role || "—");

        const badge = document.getElementById("hero-badge");
        if (badge) {
            badge.textContent = "AUTENTICADO";
            badge.classList.add("on");
        }
        document.getElementById("online-dot")?.classList.add("on");
    }

    /* ── Informações de Sessão ───────────────────────────────── */

    function _setSessionInfo() {
        Utils.setText("sess-status", "ATIVA");
        Utils.setText("sess-expire", "renovada automaticamente enquanto houver uso");
        Utils.setText("sess-origin", window.location.origin);
    }

    /* ── Logout ──────────────────────────────────────────────── */

    async function _endSession(path) {
        try {
            await Utils.api(path, { method: "POST" });
        } finally {
            location.href = "index.html";
        }
    }

    function logout() {
        return _endSession("/auth/logout");
    }

    function logoutAll() {
        return _endSession("/auth/logout-all");
    }

    return { init, loadMe, logout, logoutAll };
})();

/* ── Expõe globalmente para uso inline no HTML ─────────────── */
function loadMe() {
    HomePage.loadMe();
}
function logout() {
    HomePage.logout();
}
function logoutAll() {
    HomePage.logoutAll();
}

/* ── Boot ──────────────────────────────────────────────────── */
window.addEventListener("DOMContentLoaded", () => {
    Nav.init();
    HomePage.init();
});
