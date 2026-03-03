import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017/smart_attendance"
    SECRET_KEY: str = "your-secret-key-change-this-in-production-use-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FACE_ENCODINGS_DIR: str = "./face_encodings"
    FACE_RECOGNITION_TOLERANCE: float = 0.6
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "your-email@gmail.com"
    SMTP_PASSWORD: str = "your-app-password"
    SMTP_FROM_EMAIL: str = "your-email@gmail.com"
    # Geolocation — Thapar University, Patiala (default)
    CAMPUS_LAT: float = 30.3564
    CAMPUS_LNG: float = 76.3647
    CAMPUS_RADIUS_METERS: int = 1000

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
