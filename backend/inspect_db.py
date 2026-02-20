from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./attendance.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    result = db.execute(text("SELECT username, hashed_password FROM users WHERE username='testuser'"))
    for row in result:
        print(f"User: {row[0]}")
        print(f"Hash length: {len(row[1])}")
        print(f"Hash: {row[1]}")
finally:
    db.close()
