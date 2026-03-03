import smtplib
from email.message import EmailMessage
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, body: str):
    """
    Send an email using configured SMTP settings.
    If the settings have dummy values ("your-email@gmail.com"), it logs instead to avoid crashes.
    """
    if "your-email" in settings.SMTP_USER or not settings.SMTP_USER:
        logger.info(f"MOCK MOCK EMAIL SEND: To={to_email}, Subject={subject}")
        logger.info(f"Body: {body}")
        return True

    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = settings.SMTP_FROM_EMAIL
        msg['To'] = to_email

        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False
