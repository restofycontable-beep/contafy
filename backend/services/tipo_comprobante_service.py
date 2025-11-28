"""
Servicio para manejar operaciones de tipos de comprobantes
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from models.tipo_comprobante import TipoComprobante
from models.empresa import Empresa
import json
import logging

logger = logging.getLogger(__name__)

class TipoComprobanteService:
    """
    Servicio para operaciones CRUD de tipos de comprobantes
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def obtener_comprobantes_empresa(self, empresa_id: int, categoria: str = None) -> list:
        """
        Obtiene todos los comprobantes de una empresa
        Si se especifica categoria, filtra por ella
        """
        query = self.db.query(TipoComprobante).filter(
            and_(
                TipoComprobante.empresa_id == empresa_id,
                TipoComprobante.is_active == True
            )
        )
        
        if categoria:
            query = query.filter(TipoComprobante.categoria == categoria)
        
        return query.all()
    
    def obtener_comprobante_por_tipo(self, empresa_id: int, tipo_comprobante: str, categoria: str) -> TipoComprobante:
        """
        Obtiene un comprobante específico por tipo y categoría
        """
        return self.db.query(TipoComprobante).filter(
            and_(
                TipoComprobante.empresa_id == empresa_id,
                TipoComprobante.tipo_comprobante == tipo_comprobante,
                TipoComprobante.categoria == categoria,
                TipoComprobante.is_active == True
            )
        ).first()
    
    def crear_comprobante(self, empresa_id: int, tipo_comprobante: str, categoria: str, 
                         codigo: str, activo: bool = True, descripcion: str = None) -> TipoComprobante:
        """
        Crea un nuevo comprobante
        """
        # Verificar si ya existe
        existente = self.obtener_comprobante_por_tipo(empresa_id, tipo_comprobante, categoria)
        if existente:
            raise ValueError(f"Ya existe un comprobante de tipo '{tipo_comprobante}' para categoría '{categoria}'")
        
        comprobante = TipoComprobante(
            empresa_id=empresa_id,
            tipo_comprobante=tipo_comprobante,
            categoria=categoria,
            codigo=codigo,
            activo=activo,
            descripcion=descripcion
        )
        
        self.db.add(comprobante)
        self.db.commit()
        self.db.refresh(comprobante)
        
        logger.info(f"✅ Comprobante creado: {comprobante}")
        return comprobante
    
    def actualizar_comprobante(self, comprobante_id: int, empresa_id: int, **kwargs) -> TipoComprobante:
        """
        Actualiza un comprobante existente
        """
        comprobante = self.db.query(TipoComprobante).filter(
            and_(
                TipoComprobante.id == comprobante_id,
                TipoComprobante.empresa_id == empresa_id,
                TipoComprobante.is_active == True
            )
        ).first()
        
        if not comprobante:
            raise ValueError("Comprobante no encontrado")
        
        # Actualizar campos permitidos
        campos_permitidos = ['codigo', 'activo', 'descripcion']
        for campo, valor in kwargs.items():
            if campo in campos_permitidos:
                setattr(comprobante, campo, valor)
        
        self.db.commit()
        self.db.refresh(comprobante)
        
        logger.info(f"✅ Comprobante actualizado: {comprobante}")
        return comprobante
    
    def eliminar_comprobante(self, comprobante_id: int, empresa_id: int) -> bool:
        """
        Elimina (soft delete) un comprobante
        """
        comprobante = self.db.query(TipoComprobante).filter(
            and_(
                TipoComprobante.id == comprobante_id,
                TipoComprobante.empresa_id == empresa_id,
                TipoComprobante.is_active == True
            )
        ).first()
        
        if not comprobante:
            raise ValueError("Comprobante no encontrado")
        
        comprobante.is_active = False
        self.db.commit()
        
        logger.info(f"✅ Comprobante eliminado: {comprobante}")
        return True
    
    def migrar_desde_json(self, empresa_id: int) -> dict:
        """
        Migra comprobantes desde JSON (configuracion_comprobantes) a la tabla
        Retorna estadísticas de la migración
        """
        empresa = self.db.query(Empresa).filter(Empresa.id == empresa_id).first()
        if not empresa:
            raise ValueError("Empresa no encontrada")
        
        stats = {
            'ventas_creados': 0,
            'compras_creados': 0,
            'ventas_actualizados': 0,
            'compras_actualizados': 0,
            'errores': []
        }
        
        # Migrar comprobantes de ventas
        if empresa.configuracion_comprobantes:
            try:
                config_ventas = json.loads(empresa.configuracion_comprobantes)
                for tipo, config in config_ventas.items():
                    try:
                        # Validar tipo
                        if tipo not in ['factura', 'nota_credito', 'nota_debito']:
                            continue
                        
                        # Verificar si ya existe
                        existente = self.obtener_comprobante_por_tipo(empresa_id, tipo, 'venta')
                        
                        if existente:
                            # Actualizar existente
                            self.actualizar_comprobante(
                                existente.id,
                                empresa_id,
                                codigo=config.get('codigo', ''),
                                activo=config.get('activo', False)
                            )
                            stats['ventas_actualizados'] += 1
                        else:
                            # Crear nuevo
                            self.crear_comprobante(
                                empresa_id=empresa_id,
                                tipo_comprobante=tipo,
                                categoria='venta',
                                codigo=config.get('codigo', ''),
                                activo=config.get('activo', False),
                                descripcion=f"Migrado desde JSON - {tipo}"
                            )
                            stats['ventas_creados'] += 1
                    except Exception as e:
                        stats['errores'].append(f"Error migrando {tipo} venta: {str(e)}")
                        logger.error(f"Error migrando comprobante {tipo} venta: {e}")
            except json.JSONDecodeError as e:
                stats['errores'].append(f"Error parseando JSON de ventas: {str(e)}")
                logger.error(f"Error parseando configuracion_comprobantes: {e}")
        
        # Migrar comprobantes de compras
        if empresa.configuracion_comprobantes_compras:
            try:
                config_compras = json.loads(empresa.configuracion_comprobantes_compras)
                for tipo, config in config_compras.items():
                    try:
                        # Validar tipo
                        if tipo not in ['factura', 'nota_credito', 'nota_debito']:
                            continue
                        
                        # Verificar si ya existe
                        existente = self.obtener_comprobante_por_tipo(empresa_id, tipo, 'compra')
                        
                        if existente:
                            # Actualizar existente
                            self.actualizar_comprobante(
                                existente.id,
                                empresa_id,
                                codigo=config.get('codigo', ''),
                                activo=config.get('activo', False)
                            )
                            stats['compras_actualizados'] += 1
                        else:
                            # Crear nuevo
                            self.crear_comprobante(
                                empresa_id=empresa_id,
                                tipo_comprobante=tipo,
                                categoria='compra',
                                codigo=config.get('codigo', ''),
                                activo=config.get('activo', False),
                                descripcion=f"Migrado desde JSON - {tipo}"
                            )
                            stats['compras_creados'] += 1
                    except Exception as e:
                        stats['errores'].append(f"Error migrando {tipo} compra: {str(e)}")
                        logger.error(f"Error migrando comprobante {tipo} compra: {e}")
            except json.JSONDecodeError as e:
                stats['errores'].append(f"Error parseando JSON de compras: {str(e)}")
                logger.error(f"Error parseando configuracion_comprobantes_compras: {e}")
        
        logger.info(f"📊 Migración completada para empresa {empresa_id}: {stats}")
        return stats
    
    def convertir_a_formato_json(self, empresa_id: int, categoria: str) -> dict:
        """
        Convierte comprobantes de la tabla al formato JSON antiguo (para compatibilidad)
        """
        comprobantes = self.obtener_comprobantes_empresa(empresa_id, categoria)
        
        resultado = {}
        for comp in comprobantes:
            resultado[comp.tipo_comprobante] = {
                'activo': comp.activo,
                'codigo': comp.codigo
            }
        
        return resultado

