from http.cookies import SimpleCookie

import httpx2 as httpx

ACCESS_COOKIE = "__Host-kb_at"
REFRESH_COOKIE = "__Secure-kb_rt"


def set_cookies(response: httpx.Response) -> dict[str, dict[str, str]]:
    """Atributos de cada Set-Cookie da resposta, por nome do cookie."""
    parsed: dict[str, dict[str, str]] = {}
    for header in response.headers.get_list("set-cookie"):
        cookie = SimpleCookie()
        cookie.load(header)
        for name, morsel in cookie.items():
            attributes = {key: value for key, value in morsel.items() if value}
            attributes["value"] = morsel.value
            parsed[name] = attributes
    return parsed


def refresh_token_from(response: httpx.Response) -> str:
    return set_cookies(response)[REFRESH_COOKIE]["value"]


def access_token_from(response: httpx.Response) -> str:
    return set_cookies(response)[ACCESS_COOKIE]["value"]
