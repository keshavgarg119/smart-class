import random
import string
import time
import logging

logger = logging.getLogger(__name__)

# In-memory OTP store: { email: { "otp": "123456", "expires_at": timestamp } }
_otp_store: dict = {}

OTP_LENGTH = 6
OTP_TTL_SECONDS = 300  # 5 minutes


def generate_otp(email: str) -> str:
    """Generate a 6-digit OTP for the given email and store it with a 5-min TTL."""
    otp = ''.join(random.choices(string.digits, k=OTP_LENGTH))
    _otp_store[email.lower()] = {
        "otp": otp,
        "expires_at": time.time() + OTP_TTL_SECONDS
    }
    logger.info(f"OTP generated for {email}: {otp}")
    print(f"\n{'='*50}")
    print(f"  OTP for {email}: {otp}")
    print(f"{'='*50}\n")
    return otp


def verify_otp(email: str, otp: str) -> bool:
    """Verify the OTP for the given email. Returns True if valid and not expired."""
    key = email.lower()
    entry = _otp_store.get(key)

    if not entry:
        return False

    if time.time() > entry["expires_at"]:
        # Expired — clean up
        del _otp_store[key]
        return False

    if entry["otp"] != otp:
        return False

    # Valid — consume it so it can't be reused
    del _otp_store[key]
    return True
