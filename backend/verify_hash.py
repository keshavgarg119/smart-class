from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash = "$2b$12$Unehd2cBIT4xrU.CGjo/0OdN4vPOAI39EvUwGnq/S5n.EVUDgUbkq"
password = "password"
print(f"Verifying '{password}' against '{hash}'")
try:
    result = pwd_context.verify(password, hash)
    print(f"Result: {result}")
except Exception as e:
    print(f"Error: {e}")
