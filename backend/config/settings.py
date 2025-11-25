"""
Configuración del sistema ContRestofySas
"""

import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    """Configuración basada únicamente en variables de entorno"""

    # Aplicación
    APP_NAME: str = Field(default="Contafy")
    APP_VERSION: str = Field(default="1.0.0")
    DEBUG: bool = Field(default=False)

    # Servidor
    HOST: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    PORT: int = Field(default_factory=lambda: int(os.getenv("PORT", 8000)))

    # Base de datos
    DATABASE_URL: str = Field(default="")
    DB_HOST: str = Field(default="localhost")
    DB_PORT: int = Field(default=5432)
    DB_NAME: str = Field(default="contrestofysas")
    DB_USER: str = Field(default="postgres")
    DB_PASSWORD: str = Field(default="")

    # Seguridad
    SECRET_KEY: str = Field(default="change-me-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)

    # CORS
    CORS_ORIGINS: List[str] = Field(default=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://35.223.208.199:3000",
        "https://soft-contabilidad-9rwk.vercel.app",
        "*"  # Permitir todos los orígenes (necesario para múltiples deployments de Vercel)
    ])

    # Archivos
    UPLOAD_FOLDER: str = Field(default="uploads")
    TEMP_FOLDER: str = Field(default="temp")
    MAX_FILE_SIZE: int = Field(default=209715200)  # 200MB

    # Logging
    LOG_LEVEL: str = Field(default="INFO")

    # Email SMTP
    SMTP_HOST: str = Field(default="smtp.gmail.com")
    SMTP_PORT: int = Field(default=587)
    SMTP_USER: str = Field(default="")
    SMTP_PASSWORD: str = Field(default="")
    SMTP_FROM_EMAIL: str = Field(default="")
    SMTP_USE_TLS: bool = Field(default=True)

    # Frontend URL (para construir enlaces de reset)
    # Por defecto usa la URL de producción. Configurar en .env para desarrollo
    FRONTEND_URL: str = Field(
        default_factory=lambda: os.getenv("FRONTEND_URL", "https://soft-contabilidad-9rwk.vercel.app")
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    @property
    def database_url(self) -> str:
        """URL de conexión a PostgreSQL"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

# Instancia global
settings = Settings()