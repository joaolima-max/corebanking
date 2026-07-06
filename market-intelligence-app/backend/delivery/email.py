import logging
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from zoneinfo import ZoneInfo

from config import EMAIL_PASSWORD, EMAIL_RECIPIENT, EMAIL_SENDER, TIMEZONE

logger = logging.getLogger(__name__)

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def send_briefing_email(content: str) -> None:
    if not (EMAIL_SENDER and EMAIL_PASSWORD and EMAIL_RECIPIENT):
        logger.warning("Credenciais de email não configuradas, pulando envio")
        return

    today = datetime.now(ZoneInfo(TIMEZONE)).strftime("%d/%m/%Y")
    message = MIMEText(content, "plain", "utf-8")
    message["Subject"] = f"[Market Intelligence] Briefing — {today}"
    message["From"] = EMAIL_SENDER
    message["To"] = EMAIL_RECIPIENT

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, [EMAIL_RECIPIENT], message.as_string())

    logger.info("Briefing enviado por email para %s", EMAIL_RECIPIENT)
