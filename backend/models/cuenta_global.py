"""
Modelo para cuentas globales
"""
from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from .base import Base

class CuentaGlobal(Base):
    """
    Modelo para la tabla cuentas_globales
    """
    __tablename__ = "cuentas_globales"
    
    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey('empresas.id'), nullable=False)
    tipo_cuenta_id = Column(Integer, ForeignKey('tipos_cuentas_globales.id'), nullable=False)
    codigo = Column(String(20), nullable=False)
    nombre = Column(String(255), nullable=True)
    descripcion = Column(Text, nullable=True)
    orden = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    empresa = relationship("Empresa", back_populates="cuentas_globales")
    tipo_cuenta = relationship("TipoCuentaGlobal", back_populates="cuentas_globales")
    
    def __repr__(self):
        return f"<CuentaGlobal(id={self.id}, empresa_id={self.empresa_id}, tipo_cuenta_id={self.tipo_cuenta_id}, codigo='{self.codigo}')>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'empresa_id': self.empresa_id,
            'tipo_cuenta_id': self.tipo_cuenta_id,
            'tipo_cuenta_nombre': self.tipo_cuenta.nombre if self.tipo_cuenta else None,
            'codigo': self.codigo,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'orden': self.orden,
            'is_active': self.is_active
        }

