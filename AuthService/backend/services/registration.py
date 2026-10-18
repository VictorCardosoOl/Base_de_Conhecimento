"""Regras comuns aos cadastros feitos pela própria pessoa (com senha ou login social).

- aceite obrigatório dos Termos de Uso e da Política de Privacidade nas versões vigentes,
  registrado com data, versões e (opcional) IP (ADR-0014);
- perfil complementar opcional (organização e área de atuação).
"""

from dataclasses import dataclass
from typing import Literal

from sqlalchemy.orm import Session

from backend.core.config import Settings
from backend.core.errors import FieldValidationError
from backend.models.terms_acceptance import TermsAcceptance
from backend.models.user import ProfessionalArea, User

TERMS_OUTDATED = (
    "Os Termos de Uso ou a Política de Privacidade foram atualizados. Recarregue a página e "
    "leia a versão atual antes de aceitar."
)


@dataclass(frozen=True)
class AcceptedTerms:
    terms_version: str
    privacy_version: str


@dataclass(frozen=True)
class ProfileData:
    organization: str | None = None
    professional_area: ProfessionalArea | None = None


def check_terms(settings: Settings, terms: AcceptedTerms) -> None:
    """Só vale o aceite das versões vigentes: quem leu uma versão antiga precisa reler."""
    if terms.terms_version != settings.TERMS_VERSION:
        raise FieldValidationError("terms_version", TERMS_OUTDATED)
    if terms.privacy_version != settings.PRIVACY_POLICY_VERSION:
        raise FieldValidationError("privacy_version", TERMS_OUTDATED)


def record_terms_acceptance(
    db: Session,
    settings: Settings,
    user: User,
    terms: AcceptedTerms,
    method: Literal["password", "oauth"],
    ip_address: str | None,
) -> TermsAcceptance:
    acceptance = TermsAcceptance(
        user_id=user.id,
        terms_version=terms.terms_version,
        privacy_version=terms.privacy_version,
        method=method,
        ip_address=ip_address if settings.CONSENT_RECORD_IP else None,
    )
    db.add(acceptance)
    db.flush()
    return acceptance
