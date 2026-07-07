"""
Pluggable notification sender. In development this just logs to console.
To go live: wire in Twilio Verify (SMS/WhatsApp OTP — same pattern already
proven in WashPro) or MSG91 (cheaper for India-only SMS volume).

Swap ONLY the body of send_sms()/send_whatsapp() — every caller in this
codebase (OTP login, EMI reminders, EC expiry alerts) goes through these
two functions, so wiring a real provider here is a one-file change.
"""
import logging

logger = logging.getLogger("plotpro.notifications")


async def send_sms(phone: str, message: str) -> bool:
    # TODO: replace with Twilio Verify / MSG91 API call
    logger.info(f"[SMS to {phone}] {message}")
    return True


async def send_whatsapp(phone: str, message: str) -> bool:
    # TODO: replace with Twilio WhatsApp Business API call
    logger.info(f"[WhatsApp to {phone}] {message}")
    return True
