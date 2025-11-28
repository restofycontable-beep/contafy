
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
from models.user import User
from models.empresa import Empresa
from services.auth_service import get_current_user
from services.tipo_comprobante_service import TipoComprobanteService
from config.database import get_db
from pydantic import BaseModel
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()

async def cargar_plantilla_cuentas_empresa(empresa_id: int, user_id: int, db: Session):

    try:
        from models.cuenta_importada import CuentaImportada
        
        # Plantilla de cuentas por defecto (columnas opcionales pueden estar vacías)
        plantilla_cuentas = [
            {"nit": "900123456", "nombre": "PROVEEDOR EJEMPLO 1 - Completo", "cuenta": "51050101", "cuenta_exenta": "51050102", "cuenta_iva": "24080101", "cuenta_contrapartida": "22050101"},
            {"nit": "900234567", "nombre": "PROVEEDOR EJEMPLO 2 - Parcial", "cuenta": "51351001", "cuenta_exenta": None, "cuenta_iva": "24080501", "cuenta_contrapartida": None},
            {"nit": "900345678", "nombre": "PROVEEDOR EJEMPLO 3 - Solo base", "cuenta": "51352001", "cuenta_exenta": None, "cuenta_iva": None, "cuenta_contrapartida": None},
        ]
        
        # Verificar si ya existen cuentas para esta empresa
        cuentas_existentes = db.query(CuentaImportada).filter(
            CuentaImportada.empresa_id == empresa_id,
            CuentaImportada.user_id == user_id
        ).count()
        
        if cuentas_existentes == 0:
            # Crear cuentas de la plantilla
            for cuenta_data in plantilla_cuentas:
                nueva_cuenta = CuentaImportada(
                    user_id=user_id,
                    empresa_id=empresa_id,
                    nit=cuenta_data["nit"],
                    nombre=cuenta_data["nombre"],
                    cuenta=cuenta_data["cuenta"],
                    cuenta_exenta=cuenta_data.get("cuenta_exenta"),
                    cuenta_iva=cuenta_data.get("cuenta_iva"),
                    cuenta_contrapartida=cuenta_data.get("cuenta_contrapartida")
                )
                db.add(nueva_cuenta)
            
            db.commit()
            logger.info(f"✅ Plantilla de cuentas cargada para empresa {empresa_id}")
        else:
            logger.info(f"ℹ️ Empresa {empresa_id} ya tiene cuentas importadas")
            
    except Exception as e:
        logger.error(f"❌ Error cargando plantilla de cuentas: {str(e)}")
        db.rollback()

class EmpresaCreate(BaseModel):
    nit: str
    razon_social: str
    nombre_comercial: str = None
    representante_nombre: str
    representante_nit: str
    direccion: str  # Obligatorio
    codigo_departamento: str  # Obligatorio
    codigo_ciudad: str  # Obligatorio
    # Los comprobantes se guardan en la tabla tipos_comprobantes
    configuracion_comprobantes: dict = None  # Para compatibilidad, se migra a tipos_comprobantes
    configuracion_comprobantes_compras: dict = None  # Para compatibilidad, se migra a tipos_comprobantes

class ConfiguracionEmpresa(BaseModel):
    # Los comprobantes se guardan en la tabla tipos_comprobantes
    configuracion_comprobantes: dict = None  # Para compatibilidad, se migra a tipos_comprobantes
    configuracion_comprobantes_compras: dict = None  # Para compatibilidad, se migra a tipos_comprobantes

class EmpresaResponse(BaseModel):
    id: int
    nit: str
    razon_social: str
    nombre_comercial: str = None
    representante_nombre: str
    representante_nit: str
    is_active: bool

@router.post("/", response_model=EmpresaResponse)
async def crear_empresa(
    empresa: EmpresaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        logger.info(f"🔄 Creando empresa para usuario {current_user.id}")
        logger.info(f"📋 Datos empresa: NIT={empresa.nit}, Razón Social={empresa.razon_social}")
        
        # Verificar si ya existe una empresa con ese NIT para el usuario actual
        empresa_existente = db.query(Empresa).filter(
            Empresa.nit == empresa.nit,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()
        if empresa_existente:
            logger.warning(f"⚠️ Ya existe empresa con NIT {empresa.nit}")
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "Ya existe una empresa con ese NIT"
                }
            )

        # Configuración por defecto de comprobantes - CADA EMPRESA DEBE CONFIGURAR LOS SUYOS
        config_default = {
            "factura": {"activo": False, "codigo": ""},
            "nota_credito": {"activo": False, "codigo": ""},
            "nota_debito": {"activo": False, "codigo": ""}
        }
        
        # Configuración por defecto de comprobantes de compras - CADA EMPRESA DEBE CONFIGURAR LOS SUYOS
        config_compras_default = {
            "factura": {"activo": False, "codigo": ""},
            "nota_credito": {"activo": False, "codigo": ""},
            "nota_debito": {"activo": False, "codigo": ""}
        }
        
        # Usar configuración proporcionada o la por defecto
        config_comprobantes = empresa.configuracion_comprobantes if empresa.configuracion_comprobantes else config_default
        config_comprobantes_compras = empresa.configuracion_comprobantes_compras if empresa.configuracion_comprobantes_compras else config_compras_default

        nueva_empresa = Empresa(
            nit=empresa.nit,
            razon_social=empresa.razon_social,
            nombre_comercial=empresa.nombre_comercial,
            representante_nombre=empresa.representante_nombre,
            representante_nit=empresa.representante_nit,
            direccion=empresa.direccion,
            codigo_pais='Co',  # Colombia por defecto
            codigo_departamento=empresa.codigo_departamento,
            codigo_ciudad=empresa.codigo_ciudad,
            usuario_id=current_user.id
        )

        logger.info("💾 Guardando empresa en base de datos...")
        db.add(nueva_empresa)
        db.commit()
        db.refresh(nueva_empresa)
        
        logger.info(f"✅ Empresa creada exitosamente con ID: {nueva_empresa.id}")
        
        # Guardar comprobantes en la nueva tabla tipos_comprobantes
        if config_comprobantes:
            try:
                service_comprobantes = TipoComprobanteService(db)
                for tipo, config in config_comprobantes.items():
                    if tipo in ['factura', 'nota_credito', 'nota_debito']:
                        try:
                            service_comprobantes.crear_comprobante(
                                empresa_id=nueva_empresa.id,
                                tipo_comprobante=tipo,
                                categoria='venta',
                                codigo=config.get('codigo', ''),
                                activo=config.get('activo', False)
                            )
                        except ValueError:
                            # Ya existe, actualizar
                            existente = service_comprobantes.obtener_comprobante_por_tipo(
                                nueva_empresa.id, tipo, 'venta'
                            )
                            if existente:
                                service_comprobantes.actualizar_comprobante(
                                    existente.id,
                                    nueva_empresa.id,
                                    codigo=config.get('codigo', ''),
                                    activo=config.get('activo', False)
                                )
                logger.info("✅ Comprobantes de ventas guardados en la nueva tabla")
            except Exception as e:
                logger.warning(f"⚠️ Error guardando comprobantes de ventas: {e}")
        
        if config_comprobantes_compras:
            try:
                service_comprobantes = TipoComprobanteService(db)
                for tipo, config in config_comprobantes_compras.items():
                    if tipo in ['factura', 'nota_credito', 'nota_debito']:
                        try:
                            service_comprobantes.crear_comprobante(
                                empresa_id=nueva_empresa.id,
                                tipo_comprobante=tipo,
                                categoria='compra',
                                codigo=config.get('codigo', ''),
                                activo=config.get('activo', False)
                            )
                        except ValueError:
                            # Ya existe, actualizar
                            existente = service_comprobantes.obtener_comprobante_por_tipo(
                                nueva_empresa.id, tipo, 'compra'
                            )
                            if existente:
                                service_comprobantes.actualizar_comprobante(
                                    existente.id,
                                    nueva_empresa.id,
                                    codigo=config.get('codigo', ''),
                                    activo=config.get('activo', False)
                                )
                logger.info("✅ Comprobantes de compras guardados en la nueva tabla")
            except Exception as e:
                logger.warning(f"⚠️ Error guardando comprobantes de compras: {e}")

        return JSONResponse(
            content={
                "success": True,
                "data": nueva_empresa.to_dict()
            }
        )

    except Exception as e:
        logger.error(f"❌ Error creando empresa: {str(e)}")
        logger.error(f"🔍 Tipo de error: {type(e).__name__}")
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error creando empresa: {str(e)}"
            }
        )

@router.get("/", response_model=List[EmpresaResponse])
async def listar_empresas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    try:
        empresas = db.query(Empresa).filter(
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).all()

        return JSONResponse(
            content={
                "success": True,
                "data": [empresa.to_dict() for empresa in empresas]
            }
        )

    except Exception as e:
        logger.error(f"Error listando empresas: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error listando empresas: {str(e)}"
            }
        )

@router.get("/{empresa_id}", response_model=EmpresaResponse)
async def obtener_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        empresa = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()

        if not empresa:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": "Empresa no encontrada"
                }
            )

        return JSONResponse(
            content={
                "success": True,
                "data": empresa.to_dict()
            }
        )

    except Exception as e:
        logger.error(f"Error obteniendo empresa: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error obteniendo empresa: {str(e)}"
            }
        )

@router.put("/{empresa_id}", response_model=EmpresaResponse)
async def actualizar_empresa(
    empresa_id: int,
    empresa: EmpresaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        empresa_actual = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()

        if not empresa_actual:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": "Empresa no encontrada"
                }
            )

        # Actualizar campos
        empresa_actual.razon_social = empresa.razon_social
        empresa_actual.nombre_comercial = empresa.nombre_comercial
        empresa_actual.representante_nombre = empresa.representante_nombre
        empresa_actual.representante_nit = empresa.representante_nit
        empresa_actual.direccion = empresa.direccion
        empresa_actual.codigo_departamento = empresa.codigo_departamento
        empresa_actual.codigo_ciudad = empresa.codigo_ciudad
        # Actualizar comprobantes en la nueva tabla tipos_comprobantes (no en JSON)
        if empresa.configuracion_comprobantes is not None:
            try:
                service_comprobantes = TipoComprobanteService(db)
                for tipo, config in empresa.configuracion_comprobantes.items():
                    if tipo in ['factura', 'nota_credito', 'nota_debito']:
                        try:
                            service_comprobantes.crear_comprobante(
                                empresa_id=empresa_actual.id,
                                tipo_comprobante=tipo,
                                categoria='venta',
                                codigo=config.get('codigo', ''),
                                activo=config.get('activo', False)
                            )
                        except ValueError:
                            # Ya existe, actualizar
                            existente = service_comprobantes.obtener_comprobante_por_tipo(
                                empresa_actual.id, tipo, 'venta'
                            )
                            if existente:
                                service_comprobantes.actualizar_comprobante(
                                    existente.id,
                                    empresa_actual.id,
                                    codigo=config.get('codigo', ''),
                                    activo=config.get('activo', False)
                                )
                logger.info("✅ Comprobantes de ventas actualizados en la nueva tabla")
            except Exception as e:
                logger.warning(f"⚠️ Error actualizando comprobantes de ventas: {e}")
        
        if empresa.configuracion_comprobantes_compras is not None:
            try:
                service_comprobantes = TipoComprobanteService(db)
                for tipo, config in empresa.configuracion_comprobantes_compras.items():
                    if tipo in ['factura', 'nota_credito', 'nota_debito']:
                        try:
                            service_comprobantes.crear_comprobante(
                                empresa_id=empresa_actual.id,
                                tipo_comprobante=tipo,
                                categoria='compra',
                                codigo=config.get('codigo', ''),
                                activo=config.get('activo', False)
                            )
                        except ValueError:
                            # Ya existe, actualizar
                            existente = service_comprobantes.obtener_comprobante_por_tipo(
                                empresa_actual.id, tipo, 'compra'
                            )
                            if existente:
                                service_comprobantes.actualizar_comprobante(
                                    existente.id,
                                    empresa_actual.id,
                                    codigo=config.get('codigo', ''),
                                    activo=config.get('activo', False)
                                )
                logger.info("✅ Comprobantes de compras actualizados en la nueva tabla")
            except Exception as e:
                logger.warning(f"⚠️ Error actualizando comprobantes de compras: {e}")
        
        # Las cuentas ahora se gestionan en la tabla cuentas_importadas
        # No se actualizan aquí

        db.commit()
        db.refresh(empresa_actual)
        
        # Cargar plantilla de cuentas por defecto para la nueva empresa
        await cargar_plantilla_cuentas_empresa(empresa_actual.id, current_user.id, db)

        return JSONResponse(
            content={
                "success": True,
                "data": empresa_actual.to_dict()
            }
        )

    except Exception as e:
        logger.error(f"Error actualizando empresa: {str(e)}")
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error actualizando empresa: {str(e)}"
            }
        )

@router.put("/{empresa_id}/configuracion")
async def actualizar_configuracion_empresa(
    empresa_id: int,
    configuracion: ConfiguracionEmpresa,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        empresa = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()

        if not empresa:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": "Empresa no encontrada"
                }
            )

        # Actualizar configuración de comprobantes si se proporciona
        # Actualizar comprobantes en la nueva tabla tipos_comprobantes (no en JSON)
        if configuracion.configuracion_comprobantes is not None:
            try:
                service_comprobantes = TipoComprobanteService(db)
                for tipo, config in configuracion.configuracion_comprobantes.items():
                    if tipo in ['factura', 'nota_credito', 'nota_debito']:
                        try:
                            service_comprobantes.crear_comprobante(
                                empresa_id=empresa.id,
                                tipo_comprobante=tipo,
                                categoria='venta',
                                codigo=config.get('codigo', ''),
                                activo=config.get('activo', False)
                            )
                        except ValueError:
                            # Ya existe, actualizar
                            existente = service_comprobantes.obtener_comprobante_por_tipo(
                                empresa.id, tipo, 'venta'
                            )
                            if existente:
                                service_comprobantes.actualizar_comprobante(
                                    existente.id,
                                    empresa.id,
                                    codigo=config.get('codigo', ''),
                                    activo=config.get('activo', False)
                                )
                logger.info("✅ Comprobantes de ventas actualizados en la nueva tabla")
            except Exception as e:
                logger.warning(f"⚠️ Error actualizando comprobantes de ventas: {e}")
        
        # Actualizar comprobantes de compras en la nueva tabla tipos_comprobantes
        if hasattr(configuracion, 'configuracion_comprobantes_compras') and configuracion.configuracion_comprobantes_compras is not None:
            try:
                service_comprobantes = TipoComprobanteService(db)
                for tipo, config in configuracion.configuracion_comprobantes_compras.items():
                    if tipo in ['factura', 'nota_credito', 'nota_debito']:
                        try:
                            service_comprobantes.crear_comprobante(
                                empresa_id=empresa.id,
                                tipo_comprobante=tipo,
                                categoria='compra',
                                codigo=config.get('codigo', ''),
                                activo=config.get('activo', False)
                            )
                        except ValueError:
                            # Ya existe, actualizar
                            existente = service_comprobantes.obtener_comprobante_por_tipo(
                                empresa.id, tipo, 'compra'
                            )
                            if existente:
                                service_comprobantes.actualizar_comprobante(
                                    existente.id,
                                    empresa.id,
                                    codigo=config.get('codigo', ''),
                                    activo=config.get('activo', False)
                                )
                logger.info("✅ Comprobantes de compras actualizados en la nueva tabla")
            except Exception as e:
                logger.warning(f"⚠️ Error actualizando comprobantes de compras: {e}")
        
        # Actualizar registro de cuentas si se proporciona
        # Las cuentas ahora se gestionan en la tabla cuentas_importadas
        # No se actualizan aquí

        db.commit()
        db.refresh(empresa)

        return JSONResponse(
            content={
                "success": True,
                "data": empresa.to_dict(),
                "message": "Configuración actualizada correctamente"
            }
        )

    except Exception as e:
        logger.error(f"Error actualizando configuración de empresa: {str(e)}")
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error actualizando configuración: {str(e)}"
            }
        )

@router.delete("/{empresa_id}")
async def eliminar_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        empresa = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()

        if not empresa:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": "Empresa no encontrada"
                }
            )

        # Desactivar en lugar de eliminar
        empresa.is_active = False
        db.commit()

        return JSONResponse(
            content={
                "success": True,
                "message": "Empresa eliminada correctamente"
            }
        )

    except Exception as e:
        logger.error(f"Error eliminando empresa: {str(e)}")
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error eliminando empresa: {str(e)}"
            }
        )

@router.post("/fix-sequence")
async def arreglar_secuencia_empresas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        # Solo permitir a superusuarios
        if not current_user.is_superuser:
            return JSONResponse(
                status_code=403,
                content={
                    "success": False,
                    "error": "Acceso denegado. Solo administradores pueden ejecutar esta acción."
                }
            )
        
        # Obtener el máximo ID actual
        max_id = db.query(Empresa.id).order_by(Empresa.id.desc()).first()
        max_id = max_id[0] if max_id else 0
        
        # Resetear la secuencia
        db.execute(f"SELECT setval('empresas_id_seq', {max_id + 1}, false)")
        db.commit()
        
        return JSONResponse(
            content={
                "success": True,
                "message": f"Secuencia de empresas arreglada. Próximo ID será: {max_id + 1}"
            }
        )
        
    except Exception as e:
        logger.error(f"Error arreglando secuencia: {str(e)}")
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Error arreglando secuencia: {str(e)}"
            }
        )