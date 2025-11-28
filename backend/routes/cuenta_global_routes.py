"""
Rutas para cuentas globales
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from config.database import get_db
from models.user import User
from routes.auth_routes import get_current_user
from controllers.cuenta_global_controller import CuentaGlobalController
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cuentas-globales", tags=["cuentas-globales"])

# Schemas
class CuentaGlobalCreate(BaseModel):
    tipo_cuenta_id: int
    codigo: str
    nombre: str = None
    descripcion: str = None
    orden: int = 0

@router.get("/tipos")
async def obtener_tipos_cuentas_globales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene todos los tipos de cuentas globales"""
    return CuentaGlobalController.obtener_tipos_cuentas_globales(db, current_user)

@router.get("/empresa/{empresa_id}")
async def obtener_cuentas_globales_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene todas las cuentas globales de una empresa"""
    return CuentaGlobalController.obtener_cuentas_globales_empresa(empresa_id, db, current_user)

@router.post("/empresa/{empresa_id}")
async def crear_actualizar_cuenta_global(
    empresa_id: int,
    cuenta: CuentaGlobalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crea o actualiza una cuenta global"""
    return CuentaGlobalController.crear_actualizar_cuenta_global(
        empresa_id=empresa_id,
        tipo_cuenta_id=cuenta.tipo_cuenta_id,
        codigo=cuenta.codigo,
        nombre=cuenta.nombre,
        descripcion=cuenta.descripcion,
        orden=cuenta.orden,
        db=db,
        current_user=current_user
    )

@router.delete("/{cuenta_id}/empresa/{empresa_id}")
async def eliminar_cuenta_global(
    cuenta_id: int,
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Elimina una cuenta global"""
    return CuentaGlobalController.eliminar_cuenta_global(cuenta_id, empresa_id, db, current_user)

