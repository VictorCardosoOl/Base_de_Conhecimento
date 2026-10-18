import logging
import re
import sys

_JWT = re.compile(r"eyJ[\w-]+\.[\w-]+\.[\w-]+")
_BEARER = re.compile(r"(?i)(bearer\s+)\S+")
_SECRET_FIELD = re.compile(
    r"(?i)((?:password|senha|token|cookie|authorization|refresh)[\"']?\s*[:=]\s*[\"']?)[^\s,;\"'}]+"
)


class RedactingFilter(logging.Filter):
    """Última linha de defesa: o código não deve logar segredos, mas se logar, mascaramos.

    Também remove quebras de linha para impedir injeção de linhas falsas no log.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        message = _JWT.sub("[REDACTED_JWT]", message)
        message = _BEARER.sub(r"\1[REDACTED]", message)
        message = _SECRET_FIELD.sub(r"\1[REDACTED]", message)
        record.msg = message.replace("\r", "\\r").replace("\n", "\\n")
        record.args = None
        return True


_configured = False


def configure_logging(level: str = "INFO") -> None:
    global _configured
    root = logging.getLogger()
    root.setLevel(level.upper())
    if _configured:
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    handler.addFilter(RedactingFilter())
    root.addHandler(handler)
    _configured = True


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not any(isinstance(f, RedactingFilter) for f in logger.filters):
        logger.addFilter(RedactingFilter())
    return logger
