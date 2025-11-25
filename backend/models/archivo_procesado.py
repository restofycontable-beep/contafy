"""
Modelo para almacenar archivos Excel procesados
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, LargeBinary, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .base import BaseModel

class ArchivoProcesado(BaseModel):
    """
    Modelo para almacenar archivos Excel procesados
    """
    __tablename__ = 'archivos_procesados'
    
    # Información del archivo
    nombre_archivo = Column(String(255), nullable=False)
    nombre_original = Column(String(255), nullable=False)
    contenido = Column(LargeBinary, nullable=False)
    tipo_archivo = Column(String(100), default='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    tamano_bytes = Column(Integer, nullable=False)
    
    # Fechas
    fecha_procesamiento = Column(DateTime(timezone=True), server_default=func.now())
    fecha_creacion = Column(DateTime(timezone=True), nullable=True)
    
    # Metadatos
    descripcion = Column(Text, nullable=True)
    estado = Column(String(20), default='subido')  # subido, procesando, procesado, error, eliminado
    
    # Campos adicionales según el script
    empresa_id = Column(Integer, ForeignKey('empresas.id'))
    usuario_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Agregado usuario_id
    numero_modelo = Column(Integer, nullable=True)
    total_documentos = Column(Integer, nullable=True)
    filas_procesadas = Column(Integer, nullable=True)
    
    # Relaciones
    empresa = relationship("Empresa", back_populates="archivos_procesados")
    usuario = relationship("User", back_populates="archivos_procesados")  # Agregada relación con User
    
    def __repr__(self):
        return f"<ArchivoProcesado(id={self.id}, nombre='{self.nombre_archivo}', empresa_id={self.empresa_id}, usuario_id={self.usuario_id})>"
    
    def to_dict(self):
        """
        Convierte el modelo a diccionario para JSON
        """
        return {
            'id': self.id,
            'nombre_archivo': self.nombre_archivo,
            'nombre_original': self.nombre_original,
            'tamano_bytes': self.tamano_bytes,
            'tamano_mb': round(self.tamano_bytes / (1024 * 1024), 2),
            'fecha_procesamiento': self.fecha_procesamiento.isoformat() if self.fecha_procesamiento else None,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'descripcion': self.descripcion,
            'estado': self.estado,
            'tipo_archivo': self.tipo_archivo,
            'empresa_id': self.empresa_id,
            'usuario_id': self.usuario_id,  # Agregado usuario_id
            'numero_modelo': self.numero_modelo,
            'total_documentos': self.total_documentos,
            'filas_procesadas': self.filas_procesadas,
            'empresa_nit': self.empresa.nit if self.empresa else None,
            'empresa_nombre': self.empresa.razon_social if self.empresa else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ArchivoZipGenerado(BaseModel):
    """
    Modelo para almacenar archivos ZIP generados con modelos de ventas/compras
    """
    __tablename__ = 'archivos_zip_generados'
    
    # Información del archivo ZIP
    nombre_archivo = Column(String(255), nullable=False)
    contenido_zip = Column(LargeBinary, nullable=False)
    tamano_bytes = Column(Integer, nullable=False)
    
    # Información del procesamiento
    tipo_procesamiento = Column(String(20), nullable=False)  # 'ventas' o 'compras'
    numero_cedula = Column(String(20), nullable=False)
    fecha_generacion = Column(DateTime(timezone=True), server_default=func.now())
    
    # Metadatos
    descripcion = Column(Text, nullable=True)
    estado = Column(String(20), default='generado')  # generado, descargado, eliminado
    
    # Relaciones
    empresa_id = Column(Integer, ForeignKey('empresas.id'), nullable=False)
    usuario_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    empresa = relationship("Empresa", back_populates="archivos_zip_generados")
    usuario = relationship("User", back_populates="archivos_zip_generados")
    
    def __repr__(self):
        return f"<ArchivoZipGenerado(id={self.id}, nombre='{self.nombre_archivo}', tipo='{self.tipo_procesamiento}', cedula='{self.numero_cedula}')>"
    
    def to_dict(self):
        """
        Convierte el modelo a diccionario para JSON
        """
        return {
            'id': self.id,
            'nombre_archivo': self.nombre_archivo,
            'tamano_bytes': self.tamano_bytes,
            'tamano_mb': round(self.tamano_bytes / (1024 * 1024), 2),
            'tipo_procesamiento': self.tipo_procesamiento,
            'numero_cedula': self.numero_cedula,
            'fecha_generacion': self.fecha_generacion.isoformat() if self.fecha_generacion else None,
            'descripcion': self.descripcion,
            'estado': self.estado,
            'empresa_id': self.empresa_id,
            'usuario_id': self.usuario_id,
            'empresa': {
                'id': self.empresa.id if self.empresa else None,
                'nit': self.empresa.nit if self.empresa else None,
                'razon_social': self.empresa.razon_social if self.empresa else None,
                'nombre_comercial': self.empresa.nombre_comercial if self.empresa else None
            } if self.empresa else None,
            'empresa_nit': self.empresa.nit if self.empresa else None,
            'empresa_nombre': self.empresa.razon_social if self.empresa else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }