"""
Controlador para manejar operaciones de empresas
"""
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from config.database import get_db
from models.user import User
from routes.auth_routes import get_current_user
from services.empresa_service import EmpresaService

class EmpresaController:
    def __init__(self, db: Session):
        self.db = db
        self.empresa_service = EmpresaService(db)
    
    def crear_empresa(self, empresa_data: dict, current_user: User) -> dict:
        """
        Crear una nueva empresa
        """
        try:
            empresa = self.empresa_service.crear_empresa(empresa_data, current_user.id)
            
            return {
                "success": True,
                "message": "Empresa creada exitosamente",
                "empresa": {
                    "id": empresa.id,
                    "nit": empresa.nit,
                    "razon_social": empresa.razon_social,
                    "nombre_comercial": empresa.nombre_comercial,
                    "representante_nombre": empresa.representante_nombre,
                    "representante_nit": empresa.representante_nit,
                    "created_at": empresa.created_at.isoformat() if empresa.created_at else None
                }
            }
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
    
    def obtener_empresas_usuario(self, current_user: User) -> dict:
        """
        Obtener todas las empresas del usuario
        """
        try:
            empresas = self.empresa_service.obtener_empresas_usuario(current_user.id)
            
            empresas_data = []
            for empresa in empresas:
                empresas_data.append({
                    "id": empresa.id,
                    "nit": empresa.nit,
                    "razon_social": empresa.razon_social,
                    "nombre_comercial": empresa.nombre_comercial,
                    "representante_nombre": empresa.representante_nombre,
                    "representante_nit": empresa.representante_nit,
                    "created_at": empresa.created_at.isoformat() if empresa.created_at else None,
                    "updated_at": empresa.updated_at.isoformat() if empresa.updated_at else None
                })
            
            return {
                "success": True,
                "empresas": empresas_data,
                "total": len(empresas_data)
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
    
    def obtener_empresa_por_id(self, empresa_id: int, current_user: User) -> dict:
        """
        Obtener una empresa específica por ID
        """
        try:
            empresa = self.empresa_service.obtener_empresa_por_id(empresa_id, current_user.id)
            
            if not empresa:
                raise HTTPException(status_code=404, detail="Empresa no encontrada")
            
            return {
                "success": True,
                "empresa": {
                    "id": empresa.id,
                    "nit": empresa.nit,
                    "razon_social": empresa.razon_social,
                    "nombre_comercial": empresa.nombre_comercial,
                    "representante_nombre": empresa.representante_nombre,
                    "representante_nit": empresa.representante_nit,
                    "created_at": empresa.created_at.isoformat() if empresa.created_at else None,
                    "updated_at": empresa.updated_at.isoformat() if empresa.updated_at else None
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
    
    def actualizar_empresa(self, empresa_id: int, empresa_data: dict, current_user: User) -> dict:
        """
        Actualizar una empresa existente
        """
        try:
            empresa = self.empresa_service.actualizar_empresa(empresa_id, empresa_data, current_user.id)
            
            if not empresa:
                raise HTTPException(status_code=404, detail="Empresa no encontrada")
            
            return {
                "success": True,
                "message": "Empresa actualizada exitosamente",
                "empresa": {
                    "id": empresa.id,
                    "nit": empresa.nit,
                    "razon_social": empresa.razon_social,
                    "nombre_comercial": empresa.nombre_comercial,
                    "representante_nombre": empresa.representante_nombre,
                    "representante_nit": empresa.representante_nit,
                    "updated_at": empresa.updated_at.isoformat() if empresa.updated_at else None
                }
            }
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
    
    def eliminar_empresa(self, empresa_id: int, current_user: User) -> dict:
        """
        Eliminar una empresa
        """
        try:
            success = self.empresa_service.eliminar_empresa(empresa_id, current_user.id)
            
            if not success:
                raise HTTPException(status_code=404, detail="Empresa no encontrada")
            
            return {
                "success": True,
                "message": "Empresa eliminada exitosamente"
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")
