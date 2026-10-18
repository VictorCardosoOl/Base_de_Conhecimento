"""Avaliações, sugestões de correção e comentários dos artigos (ADR-0015)."""

from collections.abc import Callable, Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.models.user import Role, User
from tests.conftest import APP_ORIGIN, PASSWORD

ARTICLE = "esocial-guia-completo"
OTHER_ARTICLE = "ecac-guia"


@pytest.fixture
def new_client(app: FastAPI) -> Iterator[Callable[[], TestClient]]:
    opened: list[TestClient] = []

    def factory() -> TestClient:
        c = TestClient(app, base_url="https://testserver", headers={"Origin": APP_ORIGIN})
        c.__enter__()
        opened.append(c)
        return c

    yield factory
    for c in opened:
        c.__exit__(None, None, None)


@pytest.fixture
def signed_in(
    make_user: Callable[..., User], new_client: Callable[[], TestClient]
) -> Callable[..., TestClient]:
    """Cria a conta e devolve um cliente com sessão dela."""

    def factory(email: str, role: Role = Role.USER, display_name: str = "Pessoa") -> TestClient:
        make_user(email=email, role=role, display_name=display_name)
        c = new_client()
        response = c.post("/auth/login", json={"email": email, "password": PASSWORD})
        assert response.status_code == 200
        return c

    return factory


def _comment(c: TestClient, body: str, article: str = ARTICLE, **extra: object):  # type: ignore[no-untyped-def]
    return c.post(f"/content/articles/{article}/comments", json={"body": body, **extra})


# ── Avaliação ────────────────────────────────────────────────────────────────


def test_resumo_publico_sem_votos(client: TestClient):
    response = client.get(f"/content/articles/{ARTICLE}/summary")
    assert response.status_code == 200
    assert response.json() == {
        "article_id": ARTICLE,
        "rating": {"average": None, "count": 0, "distribution": [0, 0, 0, 0, 0]},
        "my_rating": None,
        "comment_count": 0,
    }
    assert response.headers["cache-control"] == "no-store"


def test_avaliar_exige_sessao(client: TestClient):
    response = client.put(f"/content/articles/{ARTICLE}/rating", json={"value": 4})
    assert response.status_code == 401


def test_uma_nota_por_pessoa_e_media(signed_in: Callable[..., TestClient], client: TestClient):
    ana = signed_in("ana@empresa.com")
    bia = signed_in("bia@empresa.com")

    first = ana.put(f"/content/articles/{ARTICLE}/rating", json={"value": 5})
    assert first.status_code == 200
    assert first.json()["my_rating"] == 5

    # Votar de novo troca a nota, não soma outro voto.
    ana.put(f"/content/articles/{ARTICLE}/rating", json={"value": 3})
    summary = bia.put(f"/content/articles/{ARTICLE}/rating", json={"value": 4}).json()
    assert summary["rating"] == {"average": 3.5, "count": 2, "distribution": [0, 0, 1, 1, 0]}
    assert summary["my_rating"] == 4

    # Visitante vê a média, sem nota própria; outro artigo não é afetado.
    public = client.get(f"/content/articles/{ARTICLE}/summary").json()
    assert public["rating"]["count"] == 2 and public["my_rating"] is None
    assert client.get(f"/content/articles/{OTHER_ARTICLE}/summary").json()["rating"]["count"] == 0

    removed = ana.delete(f"/content/articles/{ARTICLE}/rating").json()
    assert removed["rating"]["count"] == 1 and removed["my_rating"] is None


@pytest.mark.parametrize("value", [0, 6, "5", 4.5])
def test_nota_fora_da_escala(signed_in: Callable[..., TestClient], value: object):
    ana = signed_in("ana@empresa.com")
    assert ana.put(f"/content/articles/{ARTICLE}/rating", json={"value": value}).status_code == 400


@pytest.mark.parametrize("article", ["ABC", "-inicio", "a" * 121, "com espaco", "x_y"])
def test_identificador_de_artigo_invalido(client: TestClient, article: str):
    assert client.get(f"/content/articles/{article}/summary").status_code in {400, 404}


# ── Sugestões de correção ────────────────────────────────────────────────────


CORRECTION = {
    "kind": "desatualizado",
    "description": "O prazo do evento S-2220 mudou para o dia 15 do mês seguinte.",
    "excerpt": "O prazo é até o dia 7.",
}


def test_sugerir_correcao_e_revisar(signed_in: Callable[..., TestClient]):
    ana = signed_in("ana@empresa.com", display_name="Ana Leitora")
    editor = signed_in("editor@empresa.com", role=Role.EDITOR, display_name="Edi Tora")

    assert ana.get("/content/corrections").status_code == 403

    created = ana.post(f"/content/articles/{ARTICLE}/corrections", json=CORRECTION)
    assert created.status_code == 201
    body = created.json()
    assert body["status"] == "open" and body["article_id"] == ARTICLE
    assert body["excerpt"] == CORRECTION["excerpt"]

    # A mesma sugestão ainda aberta não entra de novo.
    again = ana.post(f"/content/articles/{ARTICLE}/corrections", json=CORRECTION)
    assert again.status_code == 409

    queue = editor.get("/content/corrections").json()
    assert queue["total"] == 1
    item = queue["items"][0]
    assert item["author_display_name"] == "Ana Leitora"
    assert item["kind"] == "desatualizado"

    reviewed = editor.post(
        f"/content/corrections/{item['id']}/review",
        json={"status": "resolved", "note": "Artigo atualizado."},
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["status"] == "resolved"
    assert reviewed.json()["resolution_note"] == "Artigo atualizado."
    assert (
        editor.post(
            f"/content/corrections/{item['id']}/review", json={"status": "rejected"}
        ).status_code
        == 409
    )

    assert editor.get("/content/corrections").json()["total"] == 0
    resolved = editor.get("/content/corrections", params={"status": "resolved"}).json()
    assert resolved["items"][0]["resolver_display_name"] == "Edi Tora"
    assert editor.get("/content/corrections", params={"status": "all"}).json()["total"] == 1

    mine = ana.get("/content/corrections/mine").json()
    assert [entry["status"] for entry in mine] == ["resolved"]


def test_correcao_valida_campos(signed_in: Callable[..., TestClient], client: TestClient):
    assert (
        client.post(f"/content/articles/{ARTICLE}/corrections", json=CORRECTION).status_code == 401
    )
    ana = signed_in("ana@empresa.com")
    url = f"/content/articles/{ARTICLE}/corrections"
    assert ana.post(url, json={**CORRECTION, "description": "curto"}).status_code == 400
    assert ana.post(url, json={**CORRECTION, "kind": "opiniao"}).status_code == 400
    assert ana.post(url, json={**CORRECTION, "status": "resolved"}).status_code == 400
    # Trecho em branco vira nulo.
    blank = ana.post(url, json={**CORRECTION, "excerpt": "   "})
    assert blank.status_code == 201 and blank.json()["excerpt"] is None


def test_admin_tambem_revisa(signed_in: Callable[..., TestClient]):
    ana = signed_in("ana@empresa.com")
    admin = signed_in("admin@empresa.com", role=Role.ADMIN)
    created = ana.post(f"/content/articles/{ARTICLE}/corrections", json=CORRECTION).json()
    response = admin.post(
        f"/content/corrections/{created['id']}/review", json={"status": "rejected"}
    )
    assert response.status_code == 200 and response.json()["status"] == "rejected"


# ── Comentários ──────────────────────────────────────────────────────────────


def test_comentarios_publicos_e_publicar_exige_sessao(client: TestClient):
    listing = client.get(f"/content/articles/{ARTICLE}/comments")
    assert listing.status_code == 200
    assert listing.json() == {"items": [], "total": 0}
    assert _comment(client, "Ótimo artigo").status_code == 401


def test_comentar_responder_editar_e_remover(
    signed_in: Callable[..., TestClient], client: TestClient
):
    ana = signed_in("ana@empresa.com", display_name="Ana")
    bia = signed_in("bia@empresa.com", display_name="Bia")

    created = _comment(ana, "  Muito útil, obrigado!  ")
    assert created.status_code == 201
    root = created.json()
    assert root["body"] == "Muito útil, obrigado!"
    assert root["author"]["display_name"] == "Ana"
    assert root["can_edit"] and root["can_delete"]

    reply = _comment(bia, "Concordo.", parent_id=root["id"])
    assert reply.status_code == 201

    # Respostas têm um nível só.
    nested = _comment(ana, "Resposta da resposta", parent_id=reply.json()["id"])
    assert nested.status_code == 400

    # Resposta a um comentário de outro artigo não vale.
    elsewhere = _comment(ana, "Fora do lugar", article=OTHER_ARTICLE, parent_id=root["id"])
    assert elsewhere.status_code == 400

    as_bia = bia.get(f"/content/articles/{ARTICLE}/comments").json()
    assert as_bia["total"] == 2
    thread = as_bia["items"][0]
    assert thread["can_edit"] is False and thread["can_delete"] is False
    assert thread["replies"][0]["body"] == "Concordo."
    assert thread["replies"][0]["can_edit"] is True

    public = client.get(f"/content/articles/{ARTICLE}/comments").json()["items"][0]
    assert public["can_edit"] is False and public["can_delete"] is False

    assert (
        bia.patch(f"/content/comments/{root['id']}", json={"body": "Invadido"}).status_code == 403
    )
    edited = ana.patch(f"/content/comments/{root['id']}", json={"body": "Muito útil!"})
    assert edited.status_code == 200
    assert edited.json()["body"] == "Muito útil!" and edited.json()["edited_at"] is not None

    assert bia.delete(f"/content/comments/{root['id']}").status_code == 403
    assert ana.delete(f"/content/comments/{root['id']}").status_code == 204
    assert ana.delete(f"/content/comments/{root['id']}").status_code == 404

    # O original sai, a resposta fica com o lugar dele marcado como removido.
    after = client.get(f"/content/articles/{ARTICLE}/comments").json()
    assert after["total"] == 1
    placeholder = after["items"][0]
    assert placeholder["deleted"] is True
    assert placeholder["body"] is None and placeholder["author"] is None
    assert len(placeholder["replies"]) == 1
    assert client.get(f"/content/articles/{ARTICLE}/summary").json()["comment_count"] == 1


def test_moderacao_de_comentarios(signed_in: Callable[..., TestClient]):
    ana = signed_in("ana@empresa.com")
    editor = signed_in("editor@empresa.com", role=Role.EDITOR)
    comment = _comment(ana, "Comentário qualquer").json()

    assert ana.get("/content/comments").status_code == 403
    recent = editor.get("/content/comments").json()
    assert recent["total"] == 1 and recent["items"][0]["article_id"] == ARTICLE

    as_editor = editor.get(f"/content/articles/{ARTICLE}/comments").json()["items"][0]
    assert as_editor["can_delete"] is True and as_editor["can_edit"] is False

    assert editor.delete(f"/content/comments/{comment['id']}").status_code == 204
    # Sem respostas, o comentário removido some da lista.
    assert editor.get(f"/content/articles/{ARTICLE}/comments").json() == {"items": [], "total": 0}
    assert editor.get("/content/comments").json()["total"] == 0


@pytest.mark.parametrize(
    "body",
    ["", "   ", "a", "x" * 2001, "veja https://a.com https://b.com www.c.com"],
)
def test_comentario_invalido(signed_in: Callable[..., TestClient], body: str):
    ana = signed_in("ana@empresa.com")
    assert _comment(ana, body).status_code == 400


def test_comentario_repetido_e_texto_limpo(signed_in: Callable[..., TestClient]):
    ana = signed_in("ana@empresa.com")
    first = _comment(ana, "Linha 1\r\n\r\n\r\n\r\nLinha 2\u0007​")
    assert first.status_code == 201
    assert first.json()["body"] == "Linha 1\n\nLinha 2"
    duplicate = _comment(ana, "Linha 1\n\nLinha 2")
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["details"][0]["field"] == "body"
    # Em outro artigo, o mesmo texto é outro comentário.
    assert _comment(ana, "Linha 1\n\nLinha 2", article=OTHER_ARTICLE).status_code == 201


def test_limite_de_comentarios(signed_in: Callable[..., TestClient]):
    ana = signed_in("ana@empresa.com")
    for index in range(5):
        assert _comment(ana, f"Comentário número {index}").status_code == 201
    blocked = _comment(ana, "Mais um")
    assert blocked.status_code == 429
    assert int(blocked.headers["retry-after"]) > 0


def test_escrita_de_outra_origem_e_recusada(signed_in: Callable[..., TestClient]):
    ana = signed_in("ana@empresa.com")
    response = ana.post(
        f"/content/articles/{ARTICLE}/comments",
        json={"body": "CSRF"},
        headers={"Origin": "https://malicioso.test"},
    )
    assert response.status_code == 403
    assert ana.get(f"/content/articles/{ARTICLE}/comments").json()["total"] == 0


def test_campos_desconhecidos_sao_recusados(signed_in: Callable[..., TestClient]):
    ana = signed_in("ana@empresa.com")
    response = _comment(ana, "Olá a todos", user_id="00000000-0000-0000-0000-000000000000")
    assert response.status_code == 400
