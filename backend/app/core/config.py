from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List
import os


class Settings(BaseSettings):
    # JWT Configuration
    JWT_SECRET_KEY: str = "default-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480

    # Database Configuration
    DATABASE_URL: str = "postgresql+psycopg2://empanadas_user:empanadas_pass@localhost:5432/empanadas_db"

    # CORS Configuration (comma-separated origins)
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:9000"

    # Initial Admin (for setup script)
    FIRST_ADMIN_USERNAME: str = "admin"
    FIRST_ADMIN_EMAIL: str = "admin@empanadas.com"
    FIRST_ADMIN_PASSWORD: str = "admin123"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def get_cors_origins(self) -> List[str]:
        """Parse CORS_ORIGINS string into list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
