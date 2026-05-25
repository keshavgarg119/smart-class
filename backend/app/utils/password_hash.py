from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password with fallback for bcrypt hashes"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Fallback for bcrypt hashes - try direct bcrypt verification
        if hashed_password.startswith('$2b$') or hashed_password.startswith('$2a$'):
            try:
                import bcrypt
                return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
            except Exception:
                return False
        return False

# Aliases for backward compatibility
hash_password = get_password_hash


# Aliases for backward compatibility
hash_password = get_password_hash
