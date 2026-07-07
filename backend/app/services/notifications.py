"""
Pluggable notification sender. Falls back to console logging when Twilio
credentials aren't configured (see app/core/config.py) — safe default for
local dev, no accidental SMS costs.

To go live: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
in your environment (Railway → Variables). No code changes needed —
every caller (OTP login, EMI reminders, EC expiry alerts) already routes
through send_sms()/send_whatsapp() below.
"""
import logging
from app.core.config import settings

logger = logging.getLogger("plotpro.notifications")

_twilio_client = None


def _get_twilio_client():
    global _twilio_client
    if _twilio_client is None and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        from twilio.rest import Client
        _twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    return _twilio_client


async def send_sms(phone: str, message: str) -> bool:
    client = _get_twilio_client()
    if not client:
        logger.info(f"[SMS to {phone}] {message}")
        return True
    try:
        client.messages.create(body=message, from_=settings.TWILIO_FROM_NUMBER, to=phone)
        return True
    except Exception as e:
        logger.error(f"Twilio SMS failed to {phone}: {e}")
        return False


async def send_whatsapp(phone: str, message: str) -> bool:
    client = _get_twilio_client()
    if not client:
        logger.info(f"[WhatsApp to {phone}] {message}")
        return True
    try:
        client.messages.create(
            body=message,
            from_=f"whatsapp:{settings.TWILIO_FROM_NUMBER}",
            to=f"whatsapp:{phone}",
        )
        return True
    except Exception as e:
        logger.error(f"Twilio WhatsApp failed to {phone}: {e}")
        return False
