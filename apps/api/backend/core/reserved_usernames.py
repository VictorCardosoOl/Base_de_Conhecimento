"""Nomes de usuário reservados (ADR-0012).

Valem para os fluxos em que a própria pessoa escolhe o usuário (cadastro público e
cadastro por login social): evitam que alguém se passe pela equipe, pelo sistema ou por
um papel. Administradores e a CLI podem usá-los (ex.: as contas de teste `admin`,
`editor` e `leitor`).

A comparação ignora ponto, hífen e sublinhado: `su.por-te` também é reservado.
"""

RESERVED_USERNAMES: frozenset[str] = frozenset(
    {
        # Administração e sistema
        "adm",
        "admin",
        "administrador",
        "administrator",
        "root",
        "sudo",
        "superuser",
        "sistema",
        "system",
        "owner",
        "dono",
        # Atendimento e equipe
        "suporte",
        "support",
        "ajuda",
        "help",
        "helpdesk",
        "contato",
        "contact",
        "equipe",
        "staff",
        "team",
        "oficial",
        "official",
        "moderador",
        "moderator",
        "mod",
        # Segurança, privacidade e jurídico
        "seguranca",
        "security",
        "privacidade",
        "privacy",
        "lgpd",
        "dpo",
        "encarregado",
        "juridico",
        "legal",
        # Email
        "noreply",
        "naoresponda",
        "postmaster",
        "webmaster",
        "hostmaster",
        "abuse",
        "mailerdaemon",
        "info",
        # Rotas e termos técnicos
        "api",
        "auth",
        "oauth",
        "login",
        "logout",
        "cadastro",
        "signup",
        "register",
        "conta",
        "account",
        "perfil",
        "profile",
        "config",
        "settings",
        "null",
        "undefined",
        "none",
        # Papéis e identidades genéricas
        "editor",
        "leitor",
        "usuario",
        "user",
        "anonimo",
        "anonymous",
        "convidado",
        "guest",
        "teste",
        "test",
        # A própria aplicação
        "sst",
        "sstfaq",
        "basedeconhecimento",
    }
)

_SEPARATORS = str.maketrans("", "", "._-")


def is_reserved_username(username: str) -> bool:
    """`username` em qualquer forma: é normalizado (trim, minúsculas, sem separadores)."""
    return username.strip().lower().translate(_SEPARATORS) in RESERVED_USERNAMES
