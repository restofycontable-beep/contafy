"""
Modelo para tipos de cuentas globales
"""
from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from .base import Base

class TipoCuentaGlobal(Base):
    """
    Modelo para la tabla tipos_cuentas_globales
    """
    __tablename__ = "tipos_cuentas_globales"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)
    
    # Relación con cuentas_globales
    cuentas_globales = relationship("CuentaGlobal", back_populates="tipo_cuenta")
    
    def __repr__(self):
        return f"<TipoCuentaGlobal(id={self.id}, nombre='{self.nombre}')>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre
        }

