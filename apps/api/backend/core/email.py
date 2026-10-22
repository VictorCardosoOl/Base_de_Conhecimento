"""Envio de email com interface substituível (ADR-0012).

- `smtp`: qualquer provedor com SMTP (Amazon SES, SendGrid, Resend, Mailgun, servidor
  próprio). Em desenvolvimento, o docker-compose sobe o Mailpit, que só captura as
  mensagens (interface em http://localhost:8025).
- `memory`: guarda as mensagens numa lista; só para testes (rejeitado em produção).
- `disabled`: não envia nada; registra no log apenas que um email deixou de ser enviado.

Nenhuma implementação registra o conteúdo da mensagem: os links levam tokens.
"""

import hashlib
import smtplib
import ssl
from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import make_msgid, parseaddr
from typing import Protocol

from backend.core.config import Settings
from backend.core.logger import get_logger

logger = get_logger(__name__)


@dataclass(frozen=True)
class OutgoingEmail:
    to: str
    subject: str
    text: str


class EmailSender(Protocol):
    def send(self, message: OutgoingEmail) -> None: ...


def _recipient_fp(address: str) -> str:
    """Identificador estável para logs sem expor o email."""
    return hashlib.sha256(address.strip().lower().encode()).hexdigest()[:12]


class DisabledEmailSender:
    def send(self, message: OutgoingEmail) -> None:
        logger.warning(
            "email_not_sent backend=disabled to_fp=%s subject=%s",
            _recipient_fp(message.to),
            message.subject,
        )


class MemoryEmailSender:
    """Caixa de saída em memória, para os testes lerem o que seria enviado."""

    def __init__(self) -> None:
        self.outbox: list[OutgoingEmail] = []

    def send(self, message: OutgoingEmail) -> None:
        self.outbox.append(message)


class SmtpEmailSender:
    def __init__(self, settings: Settings) -> None:
        if not settings.SMTP_HOST:  # garantido pela validação; checagem defensiva
            raise RuntimeError("SMTP_HOST não configurado")
        self._settings = settings
        self._host = settings.SMTP_HOST

    def _build(self, message: OutgoingEmail) -> EmailMessage:
        email = EmailMessage()
        email["From"] = self._settings.EMAIL_FROM
        email["To"] = message.to
        email["Subject"] = message.subject
        sender_domain = parseaddr(self._settings.EMAIL_FROM)[1].rpartition("@")[2]
        email["Message-ID"] = make_msgid(domain=sender_domain or None)
        email.set_content(message.text)
        return email

    def send(self, message: OutgoingEmail) -> None:
        settings = self._settings
        timeout = settings.SMTP_TIMEOUT_SECONDS
        context = ssl.create_default_context()
        if settings.SMTP_SECURITY == "ssl":
            smtp: smtplib.SMTP = smtplib.SMTP_SSL(
                self._host, settings.SMTP_PORT, timeout=timeout, context=context
            )
        else:
            smtp = smtplib.SMTP(self._host, settings.SMTP_PORT, timeout=timeout)
        with smtp:
            if settings.SMTP_SECURITY == "starttls":
                smtp.starttls(context=context)
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD.get_secret_value())
            smtp.send_message(self._build(message))
        logger.info("email_sent to_fp=%s subject=%s", _recipient_fp(message.to), message.subject)


def build_email_sender(settings: Settings) -> EmailSender:
    if settings.EMAIL_BACKEND == "smtp":
        return SmtpEmailSender(settings)
    if settings.EMAIL_BACKEND == "memory":
        return MemoryEmailSender()
    return DisabledEmailSender()


def deliver(sender: EmailSender, message: OutgoingEmail) -> None:
    """Envio em segundo plano (BackgroundTasks): uma falha não pode derrubar a resposta.

    A resposta ao cliente já saiu (e é a mesma exista ou não a conta), então o erro só
    vai para o log, sem destinatário nem conteúdo.
    """
    try:
        sender.send(message)
    except Exception:
        logger.exception(
            "email_send_failed to_fp=%s subject=%s", _recipient_fp(message.to), message.subject
        )
