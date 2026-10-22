"""Login social: state + PKCE, vínculo seguro com conta existente e cadastro pendente (ADR-0013).

Nenhum teste fala com o Google ou o GitHub: os provedores reais recebem um cliente HTTP
falso, que devolve respostas no formato documentado de cada um.
"""

from collections.abc import Iterator
from typing import Any
from urllib.parse import parse_qs, urlsplit

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.core.config import Settings
from backend.core.oauth import (
    GitHubProvider,
    GoogleProvider,
    OAuthProviderError,
    UrllibHttpClient,
    build_providers,
    code_challenge_s256,
)
from backend.dependencies.dependencies import get_oauth_providers
from backend.models.oauth import OAuthIdentity, OAuthLoginState, OAuthPendingSignup
from backend.models.terms_acceptance import TermsAcceptance
from backend.models.user import User
from tests.conftest import APP_ORIGIN, BASE_ENV, TERMS
from tests.helpers import ACCESS_COOKIE, set_cookies

STATE_COOKIE = "__Secure-kb_oauth_state"
SIGNUP_COOKIE = "__Secure-kb_oauth_signup"


class FakeHttp:
    """Responde como os provedores; registra o que foi enviado na troca do código."""

    def __init__(self) -> None:
        self.token_requests: list[dict[str, str]] = []
        self.fail_token = False
        self.google_profile: dict[str, Any] = {
            "sub": "google-123",
            "email": "Maria@Gmail.com",
            "email_verified": True,
            "name": "Maria Souza",
        }
        self.github_user: dict[str, Any] = {"id": 987, "login": "maria-dev", "name": "Maria"}
        self.github_emails: list[dict[str, Any]] = [
            {"email": "outro@exemplo.com", "primary": False, "verified": True},
            {"email": "maria@gmail.com", "primary": True, "verified": True},
        ]

    def post_form(self, url: str, data: dict[str, str], headers: dict[str, str]) -> Any:
        self.token_requests.append({"url": url, **data})
        if self.fail_token:
            raise OAuthProviderError("provedor respondeu 400")
        return {"access_token": "token-do-provedor", "token_type": "bearer"}

    def get_json(self, url: str, headers: dict[str, str]) -> Any:
        assert headers["Authorization"] == "Bearer token-do-provedor"
        if url.endswith("/userinfo"):
            return self.google_profile
        if url.endswith("/user/emails"):
            return self.github_emails
        if url.endswith("/user"):
            return self.github_user
        raise AssertionError(f"URL inesperada: {url}")


@pytest.fixture
def http() -> FakeHttp:
    return FakeHttp()


@pytest.fixture
def social(app: FastAPI, http: FakeHttp, configure) -> Iterator[None]:
    configure(PUBLIC_REGISTRATION_ENABLED="true")
    app.dependency_overrides[get_oauth_providers] = lambda: {
        "google": GoogleProvider("google-client", "google-secret", http),
        "github": GitHubProvider("github-client", "github-secret", http),
    }
    yield
    app.dependency_overrides.pop(get_oauth_providers, None)


def _start(client: TestClient, provider: str = "google", next_path: str | None = "/minha-lista"):
    params = {"next": next_path} if next_path is not None else {}
    response = client.get(f"/auth/oauth/{provider}/start", params=params, follow_redirects=False)
    assert response.status_code == 303
    return response


def _state_of(response) -> str:
    return parse_qs(urlsplit(response.headers["location"]).query)["state"][0]


def _callback(
    client: TestClient,
    provider: str = "google",
    headers: dict[str, str] | None = None,
    **params: str,
):
    return client.get(
        f"/auth/oauth/{provider}/callback", params=params, headers=headers, follow_redirects=False
    )


def _round_trip(client: TestClient, provider: str = "google"):
    started = _start(client, provider)
    return _callback(client, provider, code="codigo-de-autorizacao", state=_state_of(started))


def _count(db: Session, model: type) -> int:
    return db.scalar(select(func.count()).select_from(model)) or 0


# ── Lista de provedores e início ─────────────────────────────────────────────


def test_lista_so_os_provedores_configurados(client: TestClient, social):
    response = client.get("/auth/oauth/providers")
    assert response.json() == {
        "providers": [{"id": "google", "name": "Google"}, {"id": "github", "name": "GitHub"}]
    }


def test_sem_credenciais_nenhum_provedor_fica_ativo(client: TestClient):
    assert client.get("/auth/oauth/providers").json() == {"providers": []}
    response = client.get("/auth/oauth/google/start", follow_redirects=False)
    assert response.headers["location"] == f"{APP_ORIGIN}/login?erro=oauth_unavailable"


def test_build_providers_le_as_credenciais_da_configuracao():
    settings = Settings(
        _env_file=None,  # type: ignore[call-arg]
        **{
            **{k: v for k, v in BASE_ENV.items() if k != "AUTHSERVICE_ENV_FILE"},
            "OAUTH_GITHUB_CLIENT_ID": "id",
            "OAUTH_GITHUB_CLIENT_SECRET": "segredo",
        },
    )
    assert list(build_providers(settings, UrllibHttpClient())) == ["github"]


def test_inicio_usa_state_e_pkce_s256(client: TestClient, social, db: Session):
    response = _start(client)

    location = urlsplit(response.headers["location"])
    params = {key: values[0] for key, values in parse_qs(location.query).items()}
    assert f"{location.scheme}://{location.netloc}{location.path}" == GoogleProvider.authorize_url
    assert params["client_id"] == "google-client"
    assert params["redirect_uri"] == f"{APP_ORIGIN}/auth/oauth/google/callback"
    assert params["code_challenge_method"] == "S256"
    assert params["scope"] == "openid email profile"
    assert len(params["state"]) >= 43

    stored = db.scalars(select(OAuthLoginState)).one()
    assert stored.state_hash != params["state"]  # só o hash vai ao banco
    assert code_challenge_s256(stored.code_verifier) == params["code_challenge"]
    assert stored.next_path == "/minha-lista"

    cookie = set_cookies(response)[STATE_COOKIE]
    assert cookie["value"] == params["state"]
    assert cookie["httponly"] is True and cookie["secure"] is True
    assert cookie["samesite"].lower() == "lax"
    assert cookie["path"] == "/auth/oauth"


@pytest.mark.parametrize(
    "next_path", ["//evil.example", "https://evil.example", "/\\evil", "/auth/logout", "/login"]
)
def test_destino_externo_ou_interno_proibido_vira_conta(
    client: TestClient, social, db: Session, next_path: str
):
    _start(client, next_path=next_path)
    assert db.scalars(select(OAuthLoginState.next_path)).one() == "/conta"


def test_pkce_segue_o_exemplo_da_rfc_7636():
    verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    assert code_challenge_s256(verifier) == "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"


def test_inicio_tem_limite_por_ip(client: TestClient, social, configure):
    configure(OAUTH_RATE_LIMIT_IP_ATTEMPTS="1", PUBLIC_REGISTRATION_ENABLED="true")
    _start(client)
    blocked = client.get("/auth/oauth/google/start", follow_redirects=False)
    assert blocked.headers["location"] == f"{APP_ORIGIN}/login?erro=oauth_rate_limited"


# ── Retorno: state ───────────────────────────────────────────────────────────


def test_state_sem_o_cookie_do_navegador_e_recusado(client: TestClient, social, http: FakeHttp):
    state = _state_of(_start(client))
    client.cookies.clear()  # outro navegador (ou um link forjado) não tem o cookie
    response = _callback(client, code="x", state=state)
    assert response.headers["location"] == f"{APP_ORIGIN}/login?erro=oauth_state"
    assert http.token_requests == []


def test_state_e_de_uso_unico(client: TestClient, social):
    started = _start(client)
    state = _state_of(started)
    first = _callback(client, code="x", state=state)
    assert first.headers["location"] == f"{APP_ORIGIN}/cadastro/social"

    # Mesmo reapresentando o cookie, o state já foi consumido no banco.
    second = _callback(client, code="x", state=state, headers={"Cookie": f"{STATE_COOKIE}={state}"})
    assert second.headers["location"] == f"{APP_ORIGIN}/login?erro=oauth_state"


def test_state_de_outro_provedor_e_recusado(client: TestClient, social):
    state = _state_of(_start(client, "google"))
    response = _callback(client, "github", code="x", state=state)
    assert response.headers["location"] == f"{APP_ORIGIN}/login?erro=oauth_state"


def test_pessoa_cancelou_no_provedor(client: TestClient, social, http: FakeHttp):
    state = _state_of(_start(client))
    response = _callback(client, error="access_denied", state=state)
    assert response.headers["location"] == f"{APP_ORIGIN}/login?erro=oauth_denied"
    assert http.token_requests == []


def test_falha_do_provedor_volta_ao_login(client: TestClient, social, http: FakeHttp):
    http.fail_token = True
    response = _round_trip(client)
    assert response.headers["location"] == f"{APP_ORIGIN}/login?erro=oauth_provider"


def test_troca_do_codigo_envia_o_code_verifier(client: TestClient, social, http: FakeHttp):
    _round_trip(client)
    sent = http.token_requests[0]
    assert sent["grant_type"] == "authorization_code"
    assert sent["code"] == "codigo-de-autorizacao"
    assert sent["redirect_uri"] == f"{APP_ORIGIN}/auth/oauth/google/callback"
    assert len(sent["code_verifier"]) >= 43


# ── Cadastro pendente ────────────────────────────────────────────────────────


def _complete(client: TestClient, **overrides: Any):
    body = {"username": "maria.souza", "display_name": "Maria Souza", **TERMS, **overrides}
    return client.post("/auth/oauth/complete", json=body)


def test_conta_nova_so_nasce_depois_de_usuario_nome_e_termos(
    client: TestClient, social, db: Session
):
    response = _round_trip(client)

    assert response.headers["location"] == f"{APP_ORIGIN}/cadastro/social"
    assert _count(db, User) == 0  # ainda não há conta nem sessão
    assert ACCESS_COOKIE not in set_cookies(response)
    assert set_cookies(response)[SIGNUP_COOKIE]["httponly"] is True

    pending = client.get("/auth/oauth/pending")
    assert pending.status_code == 200
    assert pending.json() == {
        "provider": "google",
        "provider_name": "Google",
        "email": "maria@gmail.com",
        "suggested_display_name": "Maria Souza",
        "suggested_username": "maria",
    }

    created = _complete(client, organization="  Empresa X ", professional_area="rh_dp")
    assert created.status_code == 201
    body = created.json()
    assert body["next_path"] == "/minha-lista"
    assert body["user"]["role"] == "user"
    assert body["user"]["email_verified"] is True
    assert body["user"]["has_password"] is False
    assert ACCESS_COOKIE in set_cookies(created)

    user = db.scalars(select(User)).one()
    assert (user.organization, user.professional_area) == ("Empresa X", "rh_dp")
    identity = db.scalars(select(OAuthIdentity)).one()
    assert (identity.provider, identity.subject, identity.user_id) == (
        "google",
        "google-123",
        user.id,
    )
    acceptance = db.scalars(select(TermsAcceptance)).one()
    assert (acceptance.method, acceptance.terms_version) == ("oauth", TERMS["terms_version"])
    assert acceptance.ip_address is not None
    assert _count(db, OAuthPendingSignup) == 0
    assert client.get("/auth/oauth/pending").status_code == 400


def test_proximo_login_social_entra_direto(client: TestClient, social, db: Session):
    _round_trip(client)
    assert _complete(client).status_code == 201
    client.post("/auth/logout")

    response = _round_trip(client)
    assert response.headers["location"] == f"{APP_ORIGIN}/minha-lista"
    assert ACCESS_COOKIE in set_cookies(response)
    assert client.get("/auth/me").json()["username"] == "maria.souza"
    assert _count(db, User) == 1


def test_conclusao_exige_aceite_dos_termos(client: TestClient, social, db: Session):
    _round_trip(client)
    missing = _complete(client, accept_terms=False)
    assert missing.status_code == 400
    assert missing.json()["error"]["details"][0]["field"] == "accept_terms"
    outdated = _complete(client, terms_version="2020-01-01")
    assert outdated.status_code == 400
    assert outdated.json()["error"]["details"][0]["field"] == "terms_version"
    assert _count(db, User) == 0


def test_conclusao_recusa_nome_reservado(client: TestClient, social, db: Session):
    _round_trip(client)
    response = _complete(client, username="Suporte")
    assert response.status_code == 400
    assert response.json()["error"]["details"][0]["field"] == "username"
    assert _count(db, User) == 0


def test_conclusao_sem_cadastro_pendente(client: TestClient, social):
    response = _complete(client)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_TOKEN"


def test_desistir_apaga_o_cadastro_pendente(client: TestClient, social, db: Session):
    _round_trip(client)
    assert client.post("/auth/oauth/pending/cancel").status_code == 204
    assert _count(db, OAuthPendingSignup) == 0
    assert client.get("/auth/oauth/pending").status_code == 400


def test_cadastro_desligado_nao_cria_pendente(client: TestClient, social, configure):
    configure(PUBLIC_REGISTRATION_ENABLED="false")
    response = _round_trip(client)
    assert response.headers["location"] == f"{APP_ORIGIN}/login?erro=oauth_registration_disabled"


def test_email_nao_verificado_pelo_provedor_e_recusado(
    client: TestClient, social, http: FakeHttp, db: Session
):
    http.google_profile["email_verified"] = False
    response = _round_trip(client)
    assert response.headers["location"] == f"{APP_ORIGIN}/login?erro=oauth_email_unverified"
    assert _count(db, OAuthPendingSignup) == 0


# ── Vínculo com conta existente (anti-sequestro) ─────────────────────────────


def test_vincula_conta_com_email_ja_confirmado_e_avisa(
    client: TestClient, social, make_user, db: Session, outbox
):
    user = make_user(email="maria@gmail.com", username="maria")
    row = db.get(User, user.id)
    assert row is not None
    row.email_verified_at = row.created_at
    db.commit()

    response = _round_trip(client)

    assert response.headers["location"] == f"{APP_ORIGIN}/minha-lista"
    assert client.get("/auth/me").json()["id"] == str(user.id)
    assert db.scalars(select(OAuthIdentity.user_id)).one() == user.id
    assert outbox[-1].to == "maria@gmail.com"
    assert "Google" in outbox[-1].subject


def test_nao_vincula_conta_com_email_nao_confirmado(
    client: TestClient, social, make_user, db: Session
):
    # Alguém cadastrou o email da Maria com senha própria, sem comprovar a posse.
    make_user(email="maria@gmail.com", username="intruso")

    response = _round_trip(client)

    assert response.headers["location"] == (
        f"{APP_ORIGIN}/login?erro=oauth_link_requires_verification"
    )
    assert ACCESS_COOKIE not in set_cookies(response)
    assert _count(db, OAuthIdentity) == 0


def test_conta_desativada_nao_entra_por_login_social(
    client: TestClient, social, make_user, db: Session
):
    user = make_user(email="maria@gmail.com", username="maria")
    row = db.get(User, user.id)
    assert row is not None
    row.email_verified_at = row.created_at
    db.commit()
    _round_trip(client)
    client.post("/auth/logout")
    row.is_active = False
    db.commit()

    response = _round_trip(client)
    assert response.headers["location"] == f"{APP_ORIGIN}/login?erro=oauth_inactive"


def test_conta_ja_vinculada_a_outra_conta_do_provedor(
    client: TestClient, social, make_user, db: Session, http: FakeHttp
):
    user = make_user(email="maria@gmail.com", username="maria")
    row = db.get(User, user.id)
    assert row is not None
    row.email_verified_at = row.created_at
    db.commit()
    _round_trip(client)
    client.post("/auth/logout")

    http.google_profile["sub"] = "google-outra-conta"
    response = _round_trip(client)
    assert response.headers["location"] == f"{APP_ORIGIN}/login?erro=oauth_already_linked"


def test_conta_social_sem_senha_nao_entra_por_senha(client: TestClient, social, login):
    _round_trip(client)
    _complete(client)
    client.post("/auth/logout")
    assert login(email="maria@gmail.com", password="qualquer-senha-longa").status_code == 401


# ── GitHub ───────────────────────────────────────────────────────────────────


def test_github_usa_o_email_principal_verificado(client: TestClient, social):
    _round_trip(client, "github")
    pending = client.get("/auth/oauth/pending").json()
    assert pending["email"] == "maria@gmail.com"
    assert pending["suggested_username"] == "maria-dev"
    assert pending["provider_name"] == "GitHub"


def test_github_sem_email_verificado_e_recusado(client: TestClient, social, http: FakeHttp):
    http.github_emails = [{"email": "maria@gmail.com", "primary": True, "verified": False}]
    response = _round_trip(client, "github")
    assert response.headers["location"] == f"{APP_ORIGIN}/login?erro=oauth_email_unverified"


def test_cliente_http_so_aceita_https():
    with pytest.raises(OAuthProviderError, match="HTTPS"):
        UrllibHttpClient().get_json("http://provedor.example/userinfo", {})
