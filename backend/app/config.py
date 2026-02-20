import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./attendance.db"
    SECRET_KEY: str = "your-secret-key-change-this-in-production-use-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FACE_ENCODINGS_DIR: str = "./face_encodings"
    FACE_RECOGNITION_TOLERANCE: float = 0.6

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
