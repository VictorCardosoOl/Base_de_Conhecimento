"""Gera um par de chaves Ed25519 para assinar JWTs.

Uso: python -m backend.scripts.generate_keys [--out keys]

A chave privada fica só com o AuthService. A pública é distribuída via
/.well-known/jwks.json; este arquivo serve para rotação manual.
"""

import argparse
import os
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=Path("keys"))
    parser.add_argument("--force", action="store_true", help="sobrescreve chaves existentes")
    args = parser.parse_args()

    private_path = args.out / "jwt_private.pem"
    public_path = args.out / "jwt_public.pem"
    if private_path.exists() and not args.force:
        raise SystemExit(f"{private_path} já existe; use --force para substituir")

    args.out.mkdir(parents=True, exist_ok=True)
    key = Ed25519PrivateKey.generate()
    private_path.write_bytes(
        key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
    )
    os.chmod(private_path, 0o600)
    public_path.write_bytes(
        key.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
        )
    )
    print(f"Chaves geradas em {args.out}/ (não versione este diretório)")


if __name__ == "__main__":
    main()
