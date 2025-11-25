
from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from sqlalchemy.orm import Session
from typing import Optional
from config.database import get_db
from config.settings import settings
from services.auth_service import get_current_user
from services.zip_service import ZipService
from models.user import User
from models.archivo_procesado import ArchivoZipGenerado
from models.empresa import Empresa
import json

router = APIRouter(tags=["Archivos ZIP"])

@router.post("/generar-ventas")
async def generar_zip_ventas(
    archivo_dian: UploadFile = File(...),
    empresa_id: int = Form(...),
    nit_empresa: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        print(f"🔍 Iniciando generación ZIP ventas para empresa {empresa_id}, NIT: {nit_empresa}")
        print(f"👤 Usuario: {current_user.username} (ID: {current_user.id})")
        
        # Validar tamaño del archivo
        if archivo_dian.size and archivo_dian.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"Archivo demasiado grande. Máximo permitido: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        # Obtener configuración de la empresa
        empresa = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()
        
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        # Extraer configuraciones específicas para VENTAS
        configuracion_comprobantes = None
        registro_cuentas_factura_venta = None
        registro_cuentas_nota_credito = None
        
        print(f"🔍 DEBUG: Configuraciones de empresa:")
        print(f"  - configuracion_comprobantes: {empresa.configuracion_comprobantes}")
        print(f"  - registro_cuentas_factura_venta: {empresa.registro_cuentas_factura_venta}")
        print(f"  - registro_cuentas_nota_credito: {empresa.registro_cuentas_nota_credito}")
        
        if empresa.configuracion_comprobantes:
            try:
                configuracion_comprobantes = json.loads(empresa.configuracion_comprobantes)
                print(f"✅ configuracion_comprobantes cargada: {configuracion_comprobantes}")
            except json.JSONDecodeError as e:
                print(f"❌ Error parseando configuracion_comprobantes: {e}")
                pass
                
        if empresa.registro_cuentas_factura_venta:
            try:
                registro_cuentas_factura_venta = json.loads(empresa.registro_cuentas_factura_venta)
                print(f"✅ registro_cuentas_factura_venta cargada: {registro_cuentas_factura_venta}")
            except json.JSONDecodeError as e:
                print(f"❌ Error parseando registro_cuentas_factura_venta: {e}")
                pass
                
        if empresa.registro_cuentas_nota_credito:
            try:
                registro_cuentas_nota_credito = json.loads(empresa.registro_cuentas_nota_credito)
                print(f"✅ registro_cuentas_nota_credito cargada: {registro_cuentas_nota_credito}")
            except json.JSONDecodeError as e:
                print(f"❌ Error parseando registro_cuentas_nota_credito: {e}")
                pass
        
        # Leer el contenido del archivo DIAN
        contenido = await archivo_dian.read()
        print(f"📁 Archivo DIAN leído: {len(contenido)} bytes")
        
        # Generar el ZIP de ventas
        print("🔄 Llamando a ZipService.generar_zip_ventas...")
        resultado = ZipService.generar_zip_ventas(
            db=db,
            archivo_dian_content=contenido,
            empresa_id=empresa_id,
            usuario_id=current_user.id,
            nit_empresa=nit_empresa,
            configuracion_comprobantes=configuracion_comprobantes,
            registro_cuentas_factura_venta=registro_cuentas_factura_venta,
            registro_cuentas_nota_credito=registro_cuentas_nota_credito
        )
        
        print(f"📊 Resultado: {resultado}")
        
        if not resultado["success"]:
            print(f"❌ Error en resultado: {resultado['message']}")
            raise HTTPException(status_code=400, detail=resultado["message"])
        
        print("✅ ZIP generado exitosamente")
        return resultado
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"🚨 Error 500 en generar_zip_ventas: {str(e)}")
        import traceback
        print(f"📋 Traceback completo: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error generando ZIP de ventas: {str(e)}")

@router.post("/generar-compras")
async def generar_zip_compras(
    archivo_dian: UploadFile = File(...),
    empresa_id: int = Form(...),
    nit_empresa: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        # Validar tamaño del archivo
        if archivo_dian.size and archivo_dian.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"Archivo demasiado grande. Máximo permitido: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        # Leer el contenido del archivo DIAN
        # Obtener configuración de la empresa
        empresa = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()
        
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        # Extraer configuraciones específicas para COMPRAS
        configuracion_comprobantes_compras = None
        registro_cuentas_factura_compra = None
        registro_cuentas_nota_credito_compra = None
        
        if empresa.configuracion_comprobantes_compras:
            try:
                configuracion_comprobantes_compras = json.loads(empresa.configuracion_comprobantes_compras)
            except json.JSONDecodeError:
                pass
                
        if empresa.registro_cuentas_factura_compra:
            try:
                registro_cuentas_factura_compra = json.loads(empresa.registro_cuentas_factura_compra)
            except json.JSONDecodeError:
                pass
                
        if empresa.registro_cuentas_nota_credito_compra:
            try:
                registro_cuentas_nota_credito_compra = json.loads(empresa.registro_cuentas_nota_credito_compra)
            except json.JSONDecodeError:
                pass
        
        contenido = await archivo_dian.read()
        
        # Generar el ZIP de compras
        resultado = ZipService.generar_zip_compras(
            db=db,
            archivo_dian_content=contenido,
            empresa_id=empresa_id,
            usuario_id=current_user.id,
            nit_empresa=nit_empresa,
            configuracion_comprobantes_compras=configuracion_comprobantes_compras,
            registro_cuentas_factura_compra=registro_cuentas_factura_compra,
            registro_cuentas_nota_credito_compra=registro_cuentas_nota_credito_compra
        )
        
        if not resultado["success"]:
            raise HTTPException(status_code=400, detail=resultado["message"])
        
        return resultado
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando ZIP de compras: {str(e)}")

@router.get("/archivos-usuario")
async def obtener_archivos_zip_usuario(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        archivos = ZipService.obtener_archivos_zip_usuario(
            db=db,
            usuario_id=current_user.id,
            limit=limit,
            offset=offset
        )
        
        return {
            "success": True,
            "message": "Archivos ZIP obtenidos exitosamente",
            "data": archivos
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo archivos ZIP: {str(e)}")

@router.get("/listar")
async def listar_archivos_zip(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        print(f"📋 Endpoint /listar llamado por usuario: {current_user.username} (ID: {current_user.id})")
        
        archivos = ZipService.obtener_archivos_zip_usuario(
            db=db,
            usuario_id=current_user.id,
            limit=100,
            offset=0
        )
        
        print(f"📦 Archivos obtenidos del servicio: {len(archivos)}")
        
        response_data = {
            "success": True,
            "message": "Archivos ZIP listados exitosamente",
            "data": archivos
        }
        
        print(f"✅ Respuesta preparada: {response_data}")
        
        return response_data
        
    except Exception as e:
        print(f"❌ Error en endpoint /listar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listando archivos ZIP: {str(e)}")

@router.get("/descargar/{zip_id}")
async def descargar_archivo_zip(
    zip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        resultado = ZipService.descargar_archivo_zip(
            db=db,
            zip_id=zip_id,
            usuario_id=current_user.id
        )
        
        if not resultado["success"]:
            raise HTTPException(status_code=404, detail=resultado["message"])
        
        # Crear respuesta de descarga
        from fastapi.responses import Response
        import base64
        
        contenido_zip = resultado["data"]["contenido_zip"]
        nombre_archivo = resultado["data"]["nombre_archivo"]
        
        return Response(
            content=contenido_zip,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={nombre_archivo}",
                "Content-Type": "application/zip"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error descargando archivo ZIP: {str(e)}")

@router.delete("/eliminar/{zip_id}")
async def eliminar_archivo_zip(
    zip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    try:
        print(f"🗑️ Endpoint /eliminar/{zip_id} llamado por usuario: {current_user.username} (ID: {current_user.id})")
        
        # Buscar el archivo ZIP
        archivo = db.query(ArchivoZipGenerado).filter(
            ArchivoZipGenerado.id == zip_id,
            ArchivoZipGenerado.usuario_id == current_user.id,
            ArchivoZipGenerado.estado != 'eliminado'
        ).first()
        
        if not archivo:
            raise HTTPException(status_code=404, detail="Archivo ZIP no encontrado")
        
        print(f"✅ Archivo encontrado: {archivo.nombre_archivo}")
        
        # Marcar como eliminado
        archivo.estado = 'eliminado'
        archivo.is_active = False
        db.commit()
        
        print(f"✅ Archivo marcado como eliminado")
        
        return {
            "success": True,
            "message": f"Archivo ZIP '{archivo.nombre_archivo}' eliminado exitosamente",
            "data": {
                "id": archivo.id,
                "nombre_archivo": archivo.nombre_archivo
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error eliminando archivo ZIP: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error eliminando archivo ZIP: {str(e)}")

@router.post("/generar-ambos")
async def generar_zip_ambos(
    archivo_dian: UploadFile = File(...),
    empresa_id: int = Form(...),
    nit_empresa: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        print(f"🔍 Iniciando generación ZIP AMBOS para empresa {empresa_id}, NIT: {nit_empresa}")
        
        # Verificar que la empresa existe y pertenece al usuario
        empresa = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()
        
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        # Forzar refresh de la sesión de BD para asegurar datos actualizados
        db.expire_all()
        db.refresh(empresa)
        
        # Obtener configuraciones de la empresa
        configuracion_comprobantes = json.loads(empresa.configuracion_comprobantes or '{}')
        configuracion_comprobantes_compras = json.loads(empresa.configuracion_comprobantes_compras or '{}')
        
        # Obtener registros de cuentas
        registro_cuentas_factura_venta = empresa.registro_cuentas_factura_venta
        registro_cuentas_nota_credito = empresa.registro_cuentas_nota_credito
        registro_cuentas_factura_compra = empresa.registro_cuentas_factura_compra
        registro_cuentas_nota_credito_compra = empresa.registro_cuentas_nota_credito_compra
        
        # Asegurar que la tabla existe
        try:
            ArchivoZipGenerado.__table__.create(bind=db.get_bind(), checkfirst=True)
        except Exception:
            pass
        
        # Leer el contenido del archivo DIAN completamente
        contenido = await archivo_dian.read()
        
        # Validar que el archivo no esté vacío
        if not contenido or len(contenido) == 0:
            raise HTTPException(status_code=400, detail="El archivo DIAN está vacío. Por favor, sube un archivo válido.")
        
        # Validar que sea un archivo Excel válido
        if not archivo_dian.filename.lower().endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")
        
        # Generar el ZIP con ambos modelos + terceros
        resultado = ZipService.generar_zip_ambos(
            db=db,
            archivo_dian_content=contenido,
            empresa_id=empresa_id,
            usuario_id=current_user.id,
            nit_empresa=nit_empresa,
            configuracion_comprobantes=configuracion_comprobantes,
            configuracion_comprobantes_compras=configuracion_comprobantes_compras,
            registro_cuentas_factura_venta=registro_cuentas_factura_venta,
            registro_cuentas_nota_credito=registro_cuentas_nota_credito,
            registro_cuentas_factura_compra=registro_cuentas_factura_compra,
            registro_cuentas_nota_credito_compra=registro_cuentas_nota_credito_compra
        )
        
        print(f"✅ ZIP AMBOS generado exitosamente: {resultado['nombre_archivo']}")
        
        return {
            "success": True,
            "message": "Archivo ZIP con ambos modelos generado exitosamente",
            "data": resultado
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generando ZIP AMBOS: {str(e)}")
        import traceback
        print(f"📋 Traceback completo: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error generando ZIP con ambos modelos: {str(e)}")

@router.post("/generar-terceros")
async def generar_zip_terceros(
    archivo_dian: UploadFile = File(...),
    empresa_id: int = Form(...),
    nit_empresa: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        # Validar tamaño del archivo
        if archivo_dian.size and archivo_dian.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"Archivo demasiado grande. Máximo permitido: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        # Verificar que la empresa existe y pertenece al usuario
        empresa = db.query(Empresa).filter(
            Empresa.id == empresa_id,
            Empresa.usuario_id == current_user.id,
            Empresa.is_active == True
        ).first()
        
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        
        # Forzar refresh de la sesión de BD para asegurar datos actualizados
        db.expire_all()
        db.refresh(empresa)
        
        # Leer el contenido del archivo DIAN completamente
        contenido = await archivo_dian.read()
        
        # Validar que el archivo no esté vacío
        if not contenido or len(contenido) == 0:
            raise HTTPException(status_code=400, detail="El archivo DIAN está vacío. Por favor, sube un archivo válido.")
        
        # Validar que sea un archivo Excel válido
        if not archivo_dian.filename.lower().endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")
        
        # Generar el ZIP de terceros
        print("🔄 Llamando a ZipService.generar_zip_terceros...")
        resultado = ZipService.generar_zip_terceros(
            db=db,
            archivo_dian_content=contenido,
            empresa_id=empresa_id,
            usuario_id=current_user.id,
            nit_empresa=nit_empresa
        )
        
        print(f"📊 Resultado: {resultado}")
        
        if not resultado["success"]:
            print(f"❌ Error en resultado: {resultado['message']}")
            raise HTTPException(status_code=400, detail=resultado["message"])
        
        print("✅ ZIP de terceros generado exitosamente")
        return resultado
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generando ZIP de terceros: {str(e)}")
        import traceback
        print(f"📋 Traceback completo: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error generando ZIP de terceros: {str(e)}")
