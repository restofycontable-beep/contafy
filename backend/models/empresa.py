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
    
    # Token ContRestofySas (opcional)
    token_restofysas = Column("restofysas_token", String(500), nullable=True)
    
    # URL de Restofy (opcional) - Cada empresa tiene su propia URL completa
    url_restofy = Column("restofy_url", String(500), nullable=True)
    
    # Indicador si la empresa está vinculada con Restofy
    vinculada_restofy = Column(Boolean, default=False, nullable=False)
    
    # Configuración de comprobantes (JSON)
    configuracion_comprobantes = Column(String(1000), nullable=True)
    
    # Configuración de comprobantes de compras (JSON)
    configuracion_comprobantes_compras = Column(String(1000), nullable=True)
    
    # Registro de cuentas (JSON) - Compatibilidad hacia atrás
    registro_cuentas = Column(String(5000), nullable=True)
    
    # Registro de cuentas separadas (JSON)
    registro_cuentas_ventas = Column(String(2500), nullable=True)
    registro_cuentas_compras = Column(String(2500), nullable=True)
    
    # Registro de cuentas específicas - 10 cuentas cada una
    registro_cuentas_factura_venta = Column(String(5000), nullable=True)
    registro_cuentas_nota_credito = Column(String(5000), nullable=True)
    
    # Registro de cuentas específicas de compras - 10 cuentas cada una
    registro_cuentas_factura_compra = Column(String(5000), nullable=True)
    registro_cuentas_nota_credito_compra = Column(String(5000), nullable=True)
    
    # Relaciones
    usuario = relationship("User", back_populates="empresas")
    archivos_procesados = relationship("ArchivoProcesado", back_populates="empresa", cascade="all, delete-orphan")
    archivos_zip_generados = relationship("ArchivoZipGenerado", back_populates="empresa", cascade="all, delete-orphan")
    cuentas_importadas = relationship("CuentaImportada", back_populates="empresa", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Empresa(nit='{self.nit}', razon_social='{self.razon_social}')>"
    
    def tiene_restofy_configurado(self) -> bool:
        """
        Verifica si la empresa tiene Restofy configurado
        Retorna True si está vinculada con Restofy Y tiene URL y token configurados
        """
        return bool(self.vinculada_restofy and self.url_restofy and self.token_restofysas)
    
    def to_dict(self):
        """
        Convierte el modelo a diccionario para JSON
        """
        import json
        
        # Parsear configuración de comprobantes si existe
        config_comprobantes = None
        if self.configuracion_comprobantes:
            try:
                config_comprobantes = json.loads(self.configuracion_comprobantes)
            except json.JSONDecodeError:
                config_comprobantes = None
        
        # Parsear configuración de comprobantes de compras si existe
        config_comprobantes_compras = None
        if self.configuracion_comprobantes_compras:
            try:
                config_comprobantes_compras = json.loads(self.configuracion_comprobantes_compras)
            except json.JSONDecodeError:
                config_comprobantes_compras = None
        
        # Parsear registro de cuentas si existe
        registro_cuentas = None
        if self.registro_cuentas:
            try:
                registro_cuentas = json.loads(self.registro_cuentas)
            except json.JSONDecodeError:
                registro_cuentas = None
        
        # Parsear registro de cuentas de ventas si existe
        registro_cuentas_ventas = None
        if self.registro_cuentas_ventas:
            try:
                registro_cuentas_ventas = json.loads(self.registro_cuentas_ventas)
            except json.JSONDecodeError:
                registro_cuentas_ventas = None
        
        # Parsear registro de cuentas de compras si existe
        registro_cuentas_compras = None
        if self.registro_cuentas_compras:
            try:
                registro_cuentas_compras = json.loads(self.registro_cuentas_compras)
            except json.JSONDecodeError:
                registro_cuentas_compras = None
        
        # Parsear registro de cuentas de factura de venta si existe
        registro_cuentas_factura_venta = None
        if self.registro_cuentas_factura_venta:
            try:
                registro_cuentas_factura_venta = json.loads(self.registro_cuentas_factura_venta)
            except json.JSONDecodeError:
                registro_cuentas_factura_venta = None
        
        # Parsear registro de cuentas de nota crédito si existe
        registro_cuentas_nota_credito = None
        if self.registro_cuentas_nota_credito:
            try:
                registro_cuentas_nota_credito = json.loads(self.registro_cuentas_nota_credito)
            except json.JSONDecodeError:
                registro_cuentas_nota_credito = None
        
        # Parsear registro de cuentas de factura de compra si existe
        registro_cuentas_factura_compra = None
        if self.registro_cuentas_factura_compra:
            try:
                registro_cuentas_factura_compra = json.loads(self.registro_cuentas_factura_compra)
            except json.JSONDecodeError:
                registro_cuentas_factura_compra = None
        
        # Parsear registro de cuentas de nota crédito de compra si existe
        registro_cuentas_nota_credito_compra = None
        if self.registro_cuentas_nota_credito_compra:
            try:
                registro_cuentas_nota_credito_compra = json.loads(self.registro_cuentas_nota_credito_compra)
            except json.JSONDecodeError:
                registro_cuentas_nota_credito_compra = None
        
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
            'token_restofysas': self.token_restofysas,
            'url_restofy': self.url_restofy,
            'vinculada_restofy': self.vinculada_restofy if hasattr(self, 'vinculada_restofy') else False,
            'configuracion_comprobantes': config_comprobantes,
            'configuracion_comprobantes_compras': config_comprobantes_compras,
            'registro_cuentas': registro_cuentas,
            'registro_cuentas_ventas': registro_cuentas_ventas,
            'registro_cuentas_compras': registro_cuentas_compras,
            'registro_cuentas_factura_venta': registro_cuentas_factura_venta,
            'registro_cuentas_nota_credito': registro_cuentas_nota_credito,
            'registro_cuentas_factura_compra': registro_cuentas_factura_compra,
            'registro_cuentas_nota_credito_compra': registro_cuentas_nota_credito_compra,
            'tiene_restofy': self.tiene_restofy_configurado(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active
        }