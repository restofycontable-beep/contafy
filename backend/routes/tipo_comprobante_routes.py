"""
Rutas para tipos de comprobantes
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from config.database import get_db
from models.user import User
from routes.auth_routes import get_current_user
from controllers.tipo_comprobante_controller import TipoComprobanteController
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tipos-comprobantes", tags=["tipos-comprobantes"])

# Schemas
class ComprobanteCreate(BaseModel):
    tipo_comprobante: str
    categoria: str
    codigo: str
    activo: bool = True
    descripcion: Optional[str] = None

class ComprobanteUpdate(BaseModel):
    codigo: Optional[str] = None
    activo: Optional[bool] = None
    descripcion: Optional[str] = None

@router.get("/empresa/{empresa_id}")
async def obtener_comprobantes(
    empresa_id: int,
    categoria: Optional[str] = Query(None, description="Filtrar por categoría: venta o compra"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene todos los comprobantes de una empresa
    """
    return TipoComprobanteController.obtener_comprobantes(
        empresa_id=empresa_id,
        categoria=categoria,
        db=db,
        current_user=current_user
    )

@router.post("/empresa/{empresa_id}")
async def crear_comprobante(
    empresa_id: int,
    comprobante: ComprobanteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crea un nuevo comprobante para una empresa
    """
    return TipoComprobanteController.crear_comprobante(
        empresa_id=empresa_id,
        tipo_comprobante=comprobante.tipo_comprobante,
        categoria=comprobante.categoria,
        codigo=comprobante.codigo,
        activo=comprobante.activo,
        descripcion=comprobante.descripcion,
        db=db,
        current_user=current_user
    )

@router.put("/{comprobante_id}/empresa/{empresa_id}")
async def actualizar_comprobante(
    comprobante_id: int,
    empresa_id: int,
    comprobante: ComprobanteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza un comprobante existente
    """
    return TipoComprobanteController.actualizar_comprobante(
        comprobante_id=comprobante_id,
        empresa_id=empresa_id,
        codigo=comprobante.codigo,
        activo=comprobante.activo,
        descripcion=comprobante.descripcion,
        db=db,
        current_user=current_user
    )

@router.delete("/{comprobante_id}/empresa/{empresa_id}")
async def eliminar_comprobante(
    comprobante_id: int,
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Elimina un comprobante (soft delete)
    """
    return TipoComprobanteController.eliminar_comprobante(
        comprobante_id=comprobante_id,
        empresa_id=empresa_id,
        db=db,
        current_user=current_user
    )

@router.post("/empresa/{empresa_id}/migrar")
async def migrar_comprobantes(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Migra comprobantes desde JSON (configuracion_comprobantes) a la tabla tipos_comprobantes
    """
    return TipoComprobanteController.migrar_comprobantes(
        empresa_id=empresa_id,
        db=db,
        current_user=current_user
    )

