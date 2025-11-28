"""
Modelo para empresas
"""
from sqlalchemy import Column, String, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel

class Empresa(BaseModel):
    """
    Modelo para la tabla empresas
    """
    __tablename__ = "empresas"
    
    # Información básica
    nit = Column(String(20), unique=True, nullable=False)
    razon_social = Column(String(255), nullable=False)
    nombre_comercial = Column(String(255), nullable=True)
    
    # Representante legal
    representante_nombre = Column(String(255), nullable=False)
    representante_nit = Column(String(20), nullable=False)
    
    # Información de ubicación
    direccion = Column(String(500), nullable=True)
    codigo_pais = Column(String(10), nullable=True, default='Co')
    codigo_departamento = Column(String(10), nullable=True)
    codigo_ciudad = Column(String(10), nullable=True)
    
    # Usuario propietario
    usuario_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Relaciones
    usuario = relationship("User", back_populates="empresas")
    archivos_procesados = relationship("ArchivoProcesado", back_populates="empresa", cascade="all, delete-orphan")
    archivos_zip_generados = relationship("ArchivoZipGenerado", back_populates="empresa", cascade="all, delete-orphan")
    cuentas_importadas = relationship("CuentaImportada", back_populates="empresa", cascade="all, delete-orphan")
    tipos_comprobantes = relationship("TipoComprobante", back_populates="empresa", cascade="all, delete-orphan")
    cuentas_globales = relationship("CuentaGlobal", back_populates="empresa", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Empresa(nit='{self.nit}', razon_social='{self.razon_social}')>"
    
    def to_dict(self):
        """
        Convierte el modelo a diccionario para JSON
        """
        return {
            'id': self.id,
            'nit': self.nit,
            'razon_social': self.razon_social,
            'nombre_comercial': self.nombre_comercial,
            'representante_nombre': self.representante_nombre,
            'representante_nit': self.representante_nit,
            'direccion': self.direccion,
            'codigo_pais': self.codigo_pais,
            'codigo_departamento': self.codigo_departamento,
            'codigo_ciudad': self.codigo_ciudad,
            'usuario_id': self.usuario_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active
        }