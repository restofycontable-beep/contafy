"""
Controlador para manejar operaciones de tipos de comprobantes
"""
from fastapi import HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from config.database import get_db
from models.user import User
from models.empresa import Empresa
from routes.auth_routes import get_current_user
from services.tipo_comprobante_service import TipoComprobanteService
import logging

logger = logging.getLogger(__name__)

class TipoComprobanteController:
    """
    Controlador para operaciones CRUD de tipos de comprobantes
    """
    
    @staticmethod
    def obtener_comprobantes(
        empresa_id: int,
        categoria: Optional[str] = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
    ) -> dict:
        """
        Obtiene todos los comprobantes de una empresa
        """
        # Verificar que la empresa pertenece al usuario
        empresa = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()
        
        if not empresa:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa no encontrada"
            )
        
        service = TipoComprobanteService(db)
        comprobantes = service.obtener_comprobantes_empresa(empresa_id, categoria)
        
        return {
            "success": True,
            "data": [comp.to_dict() for comp in comprobantes],
            "total": len(comprobantes)
        }
    
    @staticmethod
    def crear_comprobante(
        empresa_id: int,
        tipo_comprobante: str,
        categoria: str,
        codigo: str,
        activo: bool = True,
        descripcion: Optional[str] = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
    ) -> dict:
        """
        Crea un nuevo comprobante
        """
        # Verificar que la empresa pertenece al usuario
        empresa = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()
        
        if not empresa:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa no encontrada"
            )
        
        # Validar tipo_comprobante
        tipos_validos = ['factura', 'nota_credito', 'nota_debito']
        if tipo_comprobante not in tipos_validos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de comprobante inválido. Debe ser uno de: {tipos_validos}"
            )
        
        # Validar categoria
        categorias_validas = ['venta', 'compra']
        if categoria not in categorias_validas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Categoría inválida. Debe ser una de: {categorias_validas}"
            )
        
        try:
            service = TipoComprobanteService(db)
            comprobante = service.crear_comprobante(
                empresa_id=empresa_id,
                tipo_comprobante=tipo_comprobante,
                categoria=categoria,
                codigo=codigo,
                activo=activo,
                descripcion=descripcion
            )
            
            return {
                "success": True,
                "data": comprobante.to_dict(),
                "message": "Comprobante creado exitosamente"
            }
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    @staticmethod
    def actualizar_comprobante(
        comprobante_id: int,
        empresa_id: int,
        codigo: Optional[str] = None,
        activo: Optional[bool] = None,
        descripcion: Optional[str] = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
    ) -> dict:
        """
        Actualiza un comprobante existente
        """
        # Verificar que la empresa pertenece al usuario
        empresa = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()
        
        if not empresa:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa no encontrada"
            )
        
        try:
            service = TipoComprobanteService(db)
            comprobante = service.actualizar_comprobante(
                comprobante_id=comprobante_id,
                empresa_id=empresa_id,
                codigo=codigo,
                activo=activo,
                descripcion=descripcion
            )
            
            return {
                "success": True,
                "data": comprobante.to_dict(),
                "message": "Comprobante actualizado exitosamente"
            }
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
    
    @staticmethod
    def eliminar_comprobante(
        comprobante_id: int,
        empresa_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
    ) -> dict:
        """
        Elimina un comprobante (soft delete)
        """
        # Verificar que la empresa pertenece al usuario
        empresa = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()
        
        if not empresa:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa no encontrada"
            )
        
        try:
            service = TipoComprobanteService(db)
            service.eliminar_comprobante(comprobante_id, empresa_id)
            
            return {
                "success": True,
                "message": "Comprobante eliminado exitosamente"
            }
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
    
    @staticmethod
    def migrar_comprobantes(
        empresa_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
    ) -> dict:
        """
        Migra comprobantes desde JSON a la tabla tipos_comprobantes
        """
        # Verificar que la empresa pertenece al usuario
        empresa = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()
        
        if not empresa:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa no encontrada"
            )
        
        try:
            service = TipoComprobanteService(db)
            stats = service.migrar_desde_json(empresa_id)
            
            return {
                "success": True,
                "data": stats,
                "message": "Migración completada"
            }
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            logger.error(f"Error en migración: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error durante la migración: {str(e)}"
            )

