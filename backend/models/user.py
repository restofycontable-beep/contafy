"""
Modelo de Usuario para autenticación
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import BaseModel

class User(BaseModel):
    """
    Modelo de usuario del sistema
    """
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    
    # Estados del usuario
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superuser = Column(Boolean, default=False)
    
    # Recuperación de contraseña
    reset_token = Column(String(255), nullable=True, index=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    
    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relaciones
    empresas = relationship("Empresa", back_populates="usuario")
    archivos_procesados = relationship("ArchivoProcesado", back_populates="usuario")
    cuentas_importadas = relationship("CuentaImportada", back_populates="user")
    archivos_zip_generados = relationship("ArchivoZipGenerado", back_populates="usuario")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"