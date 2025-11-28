"""
Modelo para tipos de comprobantes
"""
from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from .base import BaseModel

class TipoComprobante(BaseModel):
    """
    Modelo para la tabla tipos_comprobantes
    """
    __tablename__ = "tipos_comprobantes"
    
    # Relación con empresa
    empresa_id = Column(Integer, ForeignKey('empresas.id'), nullable=False)
    
    # Tipo de comprobante: factura, nota_credito, nota_debito
    tipo_comprobante = Column(String(50), nullable=False)
    
    # Categoría: venta, compra
    categoria = Column(String(20), nullable=False)
    
    # Código del comprobante (ej: '01', '20', '30', '40')
    codigo = Column(String(20), nullable=False)
    
    # Si el comprobante está activo
    activo = Column(Boolean, default=True, nullable=False)
    
    # Descripción opcional
    descripcion = Column(Text, nullable=True)
    
    # Relaciones
    empresa = relationship("Empresa", back_populates="tipos_comprobantes")
    
    def __repr__(self):
        return f"<TipoComprobante(empresa_id={self.empresa_id}, tipo='{self.tipo_comprobante}', categoria='{self.categoria}', codigo='{self.codigo}')>"
    
    def to_dict(self):
        """
        Convierte el modelo a diccionario para JSON
        """
        return {
            'id': self.id,
            'empresa_id': self.empresa_id,
            'tipo_comprobante': self.tipo_comprobante,
            'categoria': self.categoria,
            'codigo': self.codigo,
            'activo': self.activo,
            'descripcion': self.descripcion,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active
        }
    
    @staticmethod
    def from_json_dict(data: dict, empresa_id: int):
        """
        Crea un TipoComprobante desde un diccionario JSON (formato antiguo)
        """
        return TipoComprobante(
            empresa_id=empresa_id,
            tipo_comprobante=data.get('tipo', ''),
            categoria=data.get('categoria', 'venta'),
            codigo=data.get('codigo', ''),
            activo=data.get('activo', False),
            descripcion=data.get('descripcion', None)
        )

