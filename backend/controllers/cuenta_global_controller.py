"""
Controlador para cuentas globales
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session
from models.user import User
from models.empresa import Empresa
from services.cuenta_global_service import CuentaGlobalService
from typing import List, Dict

class CuentaGlobalController:
    @staticmethod
    def obtener_tipos_cuentas_globales(db: Session, current_user: User):
        """Obtiene todos los tipos de cuentas globales"""
        try:
            service = CuentaGlobalService(db)
            tipos = service.get_tipos_cuentas_globales()
            return {
                "success": True,
                "data": [tipo.to_dict() for tipo in tipos],
                "total": len(tipos)
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error obteniendo tipos de cuentas globales: {str(e)}")

    @staticmethod
    def obtener_cuentas_globales_empresa(empresa_id: int, db: Session, current_user: User):
        """Obtiene todas las cuentas globales de una empresa"""
        try:
            # Verificar que la empresa pertenece al usuario
            empresa = db.query(Empresa).filter(
                Empresa.id == empresa_id,
                Empresa.usuario_id == current_user.id,
                Empresa.is_active == True
            ).first()
            
            if not empresa:
                raise HTTPException(status_code=404, detail="Empresa no encontrada")
            
            service = CuentaGlobalService(db)
            cuentas = service.get_cuentas_globales_by_empresa(empresa_id)
            return {
                "success": True,
                "data": [cuenta.to_dict() for cuenta in cuentas],
                "total": len(cuentas)
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error obteniendo cuentas globales: {str(e)}")

    @staticmethod
    def crear_actualizar_cuenta_global(empresa_id: int, tipo_cuenta_id: int, codigo: str, nombre: str = None, descripcion: str = None, orden: int = 0, db: Session = None, current_user: User = None):
        """Crea o actualiza una cuenta global"""
        try:
            # Verificar que la empresa pertenece al usuario
            empresa = db.query(Empresa).filter(
                Empresa.id == empresa_id,
                Empresa.usuario_id == current_user.id,
                Empresa.is_active == True
            ).first()
            
            if not empresa:
                raise HTTPException(status_code=404, detail="Empresa no encontrada")
            
            service = CuentaGlobalService(db)
            cuenta = service.create_or_update_cuenta_global(
                empresa_id=empresa_id,
                tipo_cuenta_id=tipo_cuenta_id,
                codigo=codigo,
                nombre=nombre,
                descripcion=descripcion,
                orden=orden
            )
            
            return {
                "success": True,
                "data": cuenta.to_dict(),
                "message": "Cuenta global guardada exitosamente"
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error guardando cuenta global: {str(e)}")

    @staticmethod
    def eliminar_cuenta_global(cuenta_id: int, empresa_id: int, db: Session, current_user: User):
        """Elimina una cuenta global"""
        try:
            # Verificar que la empresa pertenece al usuario
            empresa = db.query(Empresa).filter(
                Empresa.id == empresa_id,
                Empresa.usuario_id == current_user.id,
                Empresa.is_active == True
            ).first()
            
            if not empresa:
                raise HTTPException(status_code=404, detail="Empresa no encontrada")
            
            service = CuentaGlobalService(db)
            eliminada = service.delete_cuenta_global(cuenta_id, empresa_id)
            
            if not eliminada:
                raise HTTPException(status_code=404, detail="Cuenta global no encontrada")
            
            return {
                "success": True,
                "message": "Cuenta global eliminada exitosamente"
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error eliminando cuenta global: {str(e)}")

