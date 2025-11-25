"""
Modelo para las cuentas importadas desde Excel
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class CuentaImportada(Base):
    __tablename__ = "cuentas_importadas"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True)  # NULL para plantilla global
    nit = Column(String(20), nullable=False, index=True)
    nombre = Column(Text, nullable=False)
    cuenta = Column(String(20), nullable=False)  # Cuenta gravada (base gravada)
    cuenta_exenta = Column(String(20), nullable=True)  # Cuenta base exenta
    cuenta_iva = Column(String(20), nullable=True)  # Cuenta de IVA
    cuenta_contrapartida = Column(String(20), nullable=True)  # Cuenta contrapartida (proveedores/bancos)
    fecha_importacion = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    user = relationship("User", back_populates="cuentas_importadas")
    empresa = relationship("Empresa", back_populates="cuentas_importadas")
    
    def to_dict(self):
        return {
            "id": self.id,
            "empresa_id": self.empresa_id,
            "nit": self.nit,
            "nombre": self.nombre,
            "cuenta": self.cuenta,
            "cuenta_exenta": self.cuenta_exenta,
            "cuenta_iva": self.cuenta_iva,
            "cuenta_contrapartida": self.cuenta_contrapartida,
            "fecha_importacion": self.fecha_importacion.isoformat() if self.fecha_importacion else None,
            "fecha_actualizacion": self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None
        } 