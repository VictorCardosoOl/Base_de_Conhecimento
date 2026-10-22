"""Textos dos emails (pt-BR). Só texto puro: nada de HTML montado com dados do usuário."""

from backend.core.email import OutgoingEmail

_SIGNATURE = "\n\nEquipe da Base de Conhecimento\n(Mensagem automática: não responda.)"


def password_reset_email(to: str, link: str, ttl_minutes: int) -> OutgoingEmail:
    return OutgoingEmail(
        to=to,
        subject="Redefinição de senha",
        text=(
            "Recebemos um pedido para redefinir a senha da sua conta.\n\n"
            f"Para criar uma nova senha, abra o link abaixo (válido por {ttl_minutes} minutos "
            "e para um único uso):\n\n"
            f"{link}\n\n"
            "Se não foi você, ignore este email: a sua senha atual continua valendo."
            f"{_SIGNATURE}"
        ),
    )


def password_changed_email(to: str, reset_link: str) -> OutgoingEmail:
    return OutgoingEmail(
        to=to,
        subject="Sua senha foi alterada",
        text=(
            "A senha da sua conta acabou de ser redefinida e todas as sessões abertas foram "
            "encerradas.\n\n"
            "Se não foi você, peça uma nova redefinição imediatamente em:\n\n"
            f"{reset_link}"
            f"{_SIGNATURE}"
        ),
    )


def email_verification_email(to: str, link: str, ttl_hours: int) -> OutgoingEmail:
    return OutgoingEmail(
        to=to,
        subject="Confirme seu email",
        text=(
            "Para confirmar que este email é seu, abra o link abaixo (válido por "
            f"{ttl_hours} horas):\n\n"
            f"{link}\n\n"
            "Se você não criou uma conta na Base de Conhecimento, ignore este email."
            f"{_SIGNATURE}"
        ),
    )


def social_account_linked_email(to: str, provider_name: str, account_link: str) -> OutgoingEmail:
    return OutgoingEmail(
        to=to,
        subject=f"Login com {provider_name} vinculado à sua conta",
        text=(
            f"Sua conta agora também pode ser acessada com o login do {provider_name}, que "
            "confirmou este mesmo email.\n\n"
            "Se não foi você, troque sua senha e avise o administrador. Detalhes da conta:\n\n"
            f"{account_link}"
            f"{_SIGNATURE}"
        ),
    )
