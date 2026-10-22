/* ============================================================
   auth.js — Lógica da Página de Acesso (index.html)
   Login e alternância entre login e informações de acesso.
   Não há cadastro público: contas são criadas por um administrador.
   AuthService · Dark Industrial Terminal
   ============================================================ */

"use strict";

const AuthPage = (() => {
    /* ── Inicialização ───────────────────────────────────────── */

    function init() {
        Utils.purgeLegacyStorage();
        _initToggle();
        Utils.bindEnter("log-pass", login);
    }

    /* ── Toggle desktop/mobile entre login e informações ─────── */

    function _initToggle() {
        const container = document.getElementById("auth-container");
        if (!container) return;

        const showInfo = () => container.classList.add("active");
        const showLogin = () => container.classList.remove("active");

        ["btn-show-register", "btnR-mob"].forEach((id) =>
            document.getElementById(id)?.addEventListener("click", showInfo),
        );
        ["btn-show-login", "btnL-mob"].forEach((id) =>
            document.getElementById(id)?.addEventListener("click", showLogin),
        );
    }

    /* ── Login ───────────────────────────────────────────────── */
    // O servidor define cookies HttpOnly; nenhum token ou senha é guardado aqui.

    async function login() {
        Utils.clearAlert("log-alert");

        const email = (document.getElementById("log-email")?.value || "").trim();
        const passwordInput = document.getElementById("log-pass");
        const password = passwordInput?.value || "";

        if (!email) {
            return Utils.showAlert("log-alert", "// erro: informe seu e-mail.", "error");
        }
        if (!password) {
            return Utils.showAlert("log-alert", "// erro: informe sua senha.", "error");
        }

        Utils.setBtn("btn-log", true, "autenticando...");

        try {
            const res = await Utils.api("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (passwordInput) passwordInput.value = "";

            if (res.ok) {
                Utils.showAlert("log-alert", "✓ autenticado — redirecionando...", "success");
                setTimeout(() => {
                    location.href = "home.html";
                }, 600);
                return;
            }

            const data = await res.json().catch(() => null);
            const retryAfter = res.headers.get("Retry-After");
            const message =
                res.status === 429 && retryAfter
                    ? `muitas tentativas. aguarde ${retryAfter}s.`
                    : Utils.parseApiError(data);
            Utils.showAlert("log-alert", `✗ ${message}`, "error");
        } catch {
            Utils.showAlert("log-alert", "✗ conexão falhou.", "error");
        } finally {
            Utils.setBtn("btn-log", false, "Entrar");
        }
    }

    return { init, login };
})();

// Expõe globalmente para uso em onclick no HTML
function loginUser() {
    AuthPage.login();
}

// Boot
window.addEventListener("DOMContentLoaded", () => {
    Nav.init();
    AuthPage.init();
});
