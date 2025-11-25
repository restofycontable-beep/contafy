"""
Rutas de administración para gestión de clientes/usuarios
Solo accesible para superusuarios
"""

from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import func

from config.database import get_db
from models.user import User
from schemas.auth_schemas import UserPublic, UserCreate, UserUpdate, UserListResponse, UserResponse
from services.auth_service import AuthService, get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_current_superuser(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Verificar que el usuario actual sea superusuario
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador"
        )
    return current_user


@router.get("/usuarios")
async def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """
    Listar todos los usuarios (solo superusuarios)
    """
    try:
        # Obtener TODOS los usuarios (activos e inactivos) para que el admin pueda ver todo
        usuarios = db.query(User).offset(skip).limit(limit).all()
        
        total = db.query(func.count(User.id)).scalar()
        
        logger.info(f"✅ Usuarios listados por admin: {total} total, {len(usuarios)} en esta página")
        
        # Convertir usuarios a UserPublic usando model_validate con manejo de errores
        usuarios_public = []
        for user in usuarios:
            try:
                usuario_public = UserPublic.model_validate(user)
                usuarios_public.append(usuario_public)
            except Exception as e:
                logger.error(f"Error validando usuario {user.id}: {str(e)}")
                # Continuar con el siguiente usuario en lugar de fallar todo
                continue
        
        # Crear respuesta usando el esquema
        response_data = UserListResponse(
            success=True,
            data=usuarios_public,
            total=total
        )
        
        # Convertir a diccionario y usar jsonable_encoder para asegurar serialización correcta
        response_dict = response_data.model_dump(mode='json')
        response_dict = jsonable_encoder(response_dict)
        
        logger.info(f"✅ Respuesta preparada: {len(usuarios_public)} usuarios serializados")
        
        return JSONResponse(content=response_dict)
        
    except Exception as e:
        logger.error(f"Error listando usuarios: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error listando usuarios: {str(e)}"
            }
        )


@router.get("/usuarios/{user_id}")
async def obtener_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):

    try:
        usuario = db.query(User).filter(
            User.id == user_id
        ).first()
        
        if not usuario:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": "Usuario no encontrado"
                }
            )
        
        usuario_public = UserPublic.model_validate(usuario)
        response_data = UserResponse(
            success=True,
            data=usuario_public
        )
        
        # Usar jsonable_encoder para asegurar serialización correcta
        response_dict = response_data.model_dump()
        response_dict = jsonable_encoder(response_dict)
        
        return JSONResponse(content=response_dict)
    except Exception as e:
        logger.error(f"Error obteniendo usuario: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error obteniendo usuario: {str(e)}"
            }
        )


@router.post("/usuarios", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def crear_usuario(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):

    try:
        # Verificar si el email ya existe
        existing_user = AuthService.get_user_by_email(db, user_data.email)
        if existing_user:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "El email ya está en uso"
                }
            )
        
        # Verificar si el username ya existe
        existing_user = AuthService.get_user_by_username(db, user_data.username)
        if existing_user:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "El username ya está en uso"
                }
            )
        
        # Crear usuario
        user_dict = user_data.model_dump()
        user_dict['hashed_password'] = AuthService.get_password_hash(user_data.password)
        del user_dict['password']
        
        nuevo_usuario = User(**user_dict)
        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)
        
        logger.info(f"✅ Usuario creado por admin: {nuevo_usuario.username} (ID: {nuevo_usuario.id})")
        
        usuario_public = UserPublic.model_validate(nuevo_usuario)
        response_data = UserResponse(
            success=True,
            data=usuario_public
        )
        
        # Usar jsonable_encoder para asegurar serialización correcta
        response_dict = response_data.model_dump()
        response_dict = jsonable_encoder(response_dict)
        
        return JSONResponse(content=response_dict, status_code=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f"Error creando usuario: {str(e)}")
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error creando usuario: {str(e)}"
            }
        )


@router.put("/usuarios/{user_id}")
async def actualizar_usuario(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    try:
        # Buscar usuario sin filtrar por is_active para permitir actualizar usuarios inactivos
        usuario = db.query(User).filter(
            User.id == user_id
        ).first()
        
        if not usuario:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": "Usuario no encontrado"
                }
            )
        
        # Verificar si el email ya existe (si se está cambiando)
        if user_update.email and user_update.email != usuario.email:
            existing_user = AuthService.get_user_by_email(db, user_update.email)
            if existing_user:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "error": "El email ya está en uso"
                    }
                )
        
        # Verificar si el username ya existe (si se está cambiando)
        if user_update.username and user_update.username != usuario.username:
            existing_user = AuthService.get_user_by_username(db, user_update.username)
            if existing_user:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "error": "El username ya está en uso"
                    }
                )
        
        # Actualizar campos
        update_data = user_update.model_dump(exclude_unset=True, exclude_none=True)
        for field, value in update_data.items():
            if hasattr(usuario, field):
                setattr(usuario, field, value)
        
        db.commit()
        db.refresh(usuario)
        
        logger.info(f"✅ Usuario actualizado por admin: {usuario.username} (ID: {usuario.id})")
        
        usuario_public = UserPublic.model_validate(usuario)
        response_data = UserResponse(
            success=True,
            data=usuario_public
        )
        
        # Usar jsonable_encoder para asegurar serialización correcta
        response_dict = response_data.model_dump()
        response_dict = jsonable_encoder(response_dict)
        
        return JSONResponse(content=response_dict)
    except Exception as e:
        logger.error(f"Error actualizando usuario: {str(e)}")
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error actualizando usuario: {str(e)}"
            }
        )


@router.delete("/usuarios/{user_id}")
async def eliminar_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    try:
        # Buscar usuario sin filtrar por is_active para permitir desactivar usuarios ya inactivos
        usuario = db.query(User).filter(
            User.id == user_id
        ).first()
        
        if not usuario:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": "Usuario no encontrado"
                }
            )
        
        # No permitir eliminar superusuarios
        if usuario.is_superuser:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "No se puede eliminar un superusuario"
                }
            )
        
        # No permitir auto-eliminación
        if usuario.id == current_user.id:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "No puedes eliminar tu propia cuenta"
                }
            )
        
        # Si ya está desactivado, informar pero no hacer nada
        if not usuario.is_active:
            return JSONResponse(
                content={
                    "success": True,
                    "message": f"El usuario {usuario.username} ya está desactivado"
                }
            )
        
        # Desactivar usuario (soft delete) - NO se eliminan sus datos
        usuario.is_active = False
        db.commit()
        
        logger.info(f"✅ Usuario desactivado por admin: {usuario.username} (ID: {usuario.id}) - Sus datos se mantienen intactos")
        
        return JSONResponse(
            content={
                "success": True,
                "message": f"Usuario {usuario.username} desactivado exitosamente. Sus datos se mantienen y puede ser reactivado cuando pague."
            }
        )
    except Exception as e:
        logger.error(f"Error eliminando usuario: {str(e)}")
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error eliminando usuario: {str(e)}"
            }
        )


@router.put("/usuarios/{user_id}/activar")
async def activar_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    
    try:
        usuario = db.query(User).filter(User.id == user_id).first()
        
        if not usuario:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": "Usuario no encontrado"
                }
            )
        
        # Si ya está activo, informar pero no hacer nada
        if usuario.is_active:
            return JSONResponse(
                content={
                    "success": True,
                    "message": f"El usuario {usuario.username} ya está activo"
                }
            )
        
        # Activar usuario - recupera acceso a todos sus datos
        usuario.is_active = True
        db.commit()
        db.refresh(usuario)
        
        # Contar empresas para informar al admin
        empresas_count = len([e for e in usuario.empresas if e.is_active])
        
        logger.info(f"✅ Usuario reactivado por admin: {usuario.username} (ID: {usuario.id}) - {empresas_count} empresas disponibles")
        
        usuario_public = UserPublic.model_validate(usuario)
        response_data = UserResponse(
            success=True,
            data=usuario_public
        )
        response_dict = response_data.model_dump()
        response_dict["message"] = f"Usuario {usuario.username} activado exitosamente. Ahora tiene acceso a {empresas_count} empresa(s) y todos sus datos."
        
        # Usar jsonable_encoder para asegurar serialización correcta
        response_dict = jsonable_encoder(response_dict)
        
        return JSONResponse(content=response_dict)
    except Exception as e:
        logger.error(f"Error activando usuario: {str(e)}")
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error activando usuario: {str(e)}"
            }
        )


@router.get("/usuarios/{user_id}/empresas")
async def obtener_empresas_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    try:
        # Buscar usuario sin filtrar por is_active para ver empresas de usuarios inactivos
        usuario = db.query(User).filter(
            User.id == user_id
        ).first()
        
        if not usuario:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": "Usuario no encontrado"
                }
            )

        empresas = [empresa.to_dict() for empresa in usuario.empresas if empresa.is_active]
        
        logger.info(f"📦 Empresas del usuario {usuario.username} (ID: {user_id}): {len(empresas)} empresas activas")
        
        return JSONResponse(
            content={
                "success": True,
                "data": empresas,
                "total": len(empresas),
                "usuario_activo": usuario.is_active
            }
        )
    except Exception as e:
        logger.error(f"Error obteniendo empresas del usuario: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error obteniendo empresas: {str(e)}"
            }
        )


@router.get("/usuarios/{user_id}/estadisticas-documentos")
async def obtener_estadisticas_documentos(
    user_id: int,
    empresa_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    try:
        from models.archivo_procesado import ArchivoProcesado, ArchivoZipGenerado
        from sqlalchemy import func, and_
        
        # Verificar que el usuario existe
        usuario = db.query(User).filter(User.id == user_id).first()
        if not usuario:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": "Usuario no encontrado"
                }
            )
        
        filtros_archivos = [ArchivoProcesado.usuario_id == user_id]
        filtros_zip = [ArchivoZipGenerado.usuario_id == user_id]
        
        # Si se especifica empresa_id, filtrar por empresa
        if empresa_id:
            filtros_archivos.append(ArchivoProcesado.empresa_id == empresa_id)
            filtros_zip.append(ArchivoZipGenerado.empresa_id == empresa_id)
        
        total_filas_procesadas = db.query(
            func.coalesce(func.sum(ArchivoProcesado.filas_procesadas), 0)
        ).filter(
            and_(*filtros_archivos),
            ArchivoProcesado.filas_procesadas.isnot(None),
            ArchivoProcesado.filas_procesadas > 0
        ).scalar() or 0
        
        if total_filas_procesadas == 0:
            zips = db.query(ArchivoZipGenerado).filter(
                and_(*filtros_zip)
                # NO filtrar por estado para contar TODOS los ZIPs procesados históricamente
            ).all()
            
            # Extraer total de filas desde la descripción de los ZIPs
            import re
            for zip_file in zips:
                if zip_file.descripcion:
                    # Buscar "Total filas: X" en la descripción
                    match = re.search(r'Total filas:\s*(\d+)', zip_file.descripcion)
                    if match:
                        filas_zip = int(match.group(1))
                        total_filas_procesadas += filas_zip
                        logger.info(f"📊 Extraídas {filas_zip} filas del ZIP {zip_file.id} desde descripción")
                    else:
                        # Si no está en la descripción, estimar basándose en el tamaño
                        # Un archivo Excel típico con 500 filas puede ser ~50-100KB
                        archivos_estimados = max(1, int(zip_file.tamano_bytes / 80000))
                        total_filas_procesadas += archivos_estimados * 500
                        logger.info(f"📊 Estimadas {archivos_estimados * 500} filas del ZIP {zip_file.id} basándose en tamaño")
        
        # Contar total de archivos procesados (archivos DIAN originales)
        # Contamos TODOS los archivos, incluso los eliminados, para control histórico
        total_archivos_procesados = db.query(ArchivoProcesado).filter(
            and_(*filtros_archivos)
            # NO filtrar por estado para contar TODOS los archivos procesados históricamente
        ).count()
        
        # Contar archivos activos (no eliminados) por separado para información adicional
        total_archivos_activos = db.query(ArchivoProcesado).filter(
            and_(*filtros_archivos),
            ArchivoProcesado.estado.in_(['procesado', 'subido']),
            ArchivoProcesado.is_active == True
        ).count()
        
        # Contar total de archivos ZIP generados
        # Contamos TODOS los ZIPs, incluso los eliminados, para control histórico
        total_archivos_zip = db.query(ArchivoZipGenerado).filter(
            and_(*filtros_zip)
            # NO filtrar por estado para contar TODOS los ZIPs generados históricamente
        ).count()
        
        # Contar ZIPs activos (no eliminados) por separado
        total_archivos_zip_activos = db.query(ArchivoZipGenerado).filter(
            and_(*filtros_zip),
            ArchivoZipGenerado.estado.in_(['generado', 'descargado']),
            ArchivoZipGenerado.is_active == True
        ).count()
        
        documentos_dian_aprox = int(total_filas_procesadas / 4) if total_filas_procesadas > 0 else 0
        
        # Obtener estadísticas por empresa si no se especifica empresa_id
        estadisticas_por_empresa = []
        if not empresa_id:
            # Obtener todas las empresas del usuario
            empresas = usuario.empresas if hasattr(usuario, 'empresas') else []
            
            for empresa in empresas:
                if not empresa.is_active:
                    continue
                
                # Filtrar por esta empresa
                # NO filtrar por is_active para contar TODOS los archivos históricamente
                filtros_archivos_empresa = [
                    ArchivoProcesado.usuario_id == user_id,
                    ArchivoProcesado.empresa_id == empresa.id
                ]
                filtros_zip_empresa = [
                    ArchivoZipGenerado.usuario_id == user_id,
                    ArchivoZipGenerado.empresa_id == empresa.id
                ]
                
                # Contar para esta empresa
                filas_empresa = db.query(
                    func.coalesce(func.sum(ArchivoProcesado.filas_procesadas), 0)
                ).filter(
                    and_(*filtros_archivos_empresa),
                    ArchivoProcesado.filas_procesadas.isnot(None),
                    ArchivoProcesado.filas_procesadas > 0
                ).scalar() or 0
                
                # Si no hay filas_procesadas, extraer desde ZIPs
                # Contamos TODOS los ZIPs, incluso los eliminados
                if filas_empresa == 0:
                    zips_empresa_list = db.query(ArchivoZipGenerado).filter(
                        and_(*filtros_zip_empresa)
                        # NO filtrar por estado para contar TODOS los ZIPs históricamente
                    ).all()
                    
                    # Extraer total de filas desde la descripción de los ZIPs
                    import re
                    for zip_file in zips_empresa_list:
                        if zip_file.descripcion:
                            # Buscar "Total filas: X" en la descripción
                            match = re.search(r'Total filas:\s*(\d+)', zip_file.descripcion)
                            if match:
                                filas_zip = int(match.group(1))
                                filas_empresa += filas_zip
                            else:
                                # Si no está en la descripción, estimar basándose en el tamaño
                                archivos_estimados = max(1, int(zip_file.tamano_bytes / 80000))
                                filas_empresa += archivos_estimados * 500
                
                # Contar TODOS los archivos de esta empresa (histórico)
                archivos_empresa = db.query(ArchivoProcesado).filter(
                    and_(*filtros_archivos_empresa)
                    # NO filtrar por estado para contar TODOS los archivos históricamente
                ).count()
                
                # Contar archivos activos por separado
                archivos_empresa_activos = db.query(ArchivoProcesado).filter(
                    and_(*filtros_archivos_empresa),
                    ArchivoProcesado.estado.in_(['procesado', 'subido']),
                    ArchivoProcesado.is_active == True
                ).count()
                
                # Contar TODOS los ZIPs de esta empresa (histórico)
                zips_empresa = db.query(ArchivoZipGenerado).filter(
                    and_(*filtros_zip_empresa)
                    # NO filtrar por estado para contar TODOS los ZIPs históricamente
                ).count()
                
                # Contar ZIPs activos por separado
                zips_empresa_activos = db.query(ArchivoZipGenerado).filter(
                    and_(*filtros_zip_empresa),
                    ArchivoZipGenerado.estado.in_(['generado', 'descargado']),
                    ArchivoZipGenerado.is_active == True
                ).count()
                
                documentos_dian_empresa = int(filas_empresa / 4) if filas_empresa > 0 else 0
                
                estadisticas_por_empresa.append({
                    "empresa_id": empresa.id,
                    "empresa_nit": empresa.nit,
                    "empresa_nombre": empresa.razon_social,
                    "total_filas_excel": filas_empresa,
                    "documentos_dian_aproximados": documentos_dian_empresa,
                    "archivos_procesados": archivos_empresa,  # Total histórico
                    "archivos_procesados_activos": archivos_empresa_activos,  # Solo activos
                    "archivos_zip_generados": zips_empresa,  # Total histórico
                    "archivos_zip_activos": zips_empresa_activos  # Solo activos
                })
        
        logger.info(f"📊 Estadísticas de documentos para usuario {usuario.username} (ID: {user_id}): {total_filas_procesadas} filas, {total_archivos_procesados} archivos (histórico), {total_archivos_activos} activos, {total_archivos_zip} ZIPs (histórico), {total_archivos_zip_activos} ZIPs activos")
        
        return JSONResponse(
            content={
                "success": True,
                "data": {
                    "usuario_id": user_id,
                    "usuario_username": usuario.username,
                    "total_filas_excel_generadas": total_filas_procesadas,
                    "documentos_dian_aproximados": documentos_dian_aprox,
                    "total_archivos_procesados": total_archivos_procesados,  # Total histórico (incluye eliminados)
                    "total_archivos_procesados_activos": total_archivos_activos,  # Solo archivos activos
                    "total_archivos_zip_generados": total_archivos_zip,  # Total histórico (incluye eliminados)
                    "total_archivos_zip_activos": total_archivos_zip_activos,  # Solo ZIPs activos
                    "estadisticas_por_empresa": estadisticas_por_empresa,
                    "nota": "1 línea DIAN puede generar hasta 4 líneas Excel. Los documentos DIAN son aproximados. Los totales incluyen archivos eliminados para control histórico completo."
                }
            }
        )
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas de documentos: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error obteniendo estadísticas: {str(e)}"
            }
        )

