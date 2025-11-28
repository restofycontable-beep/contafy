"""
Controlador para procesamiento de archivos
"""
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from services.procesamiento_service import ProcesamientoService
from models.empresa import Empresa
import logging
import json

logger = logging.getLogger(__name__)

class ProcesamientoController:
    """
    Controlador para procesamiento de archivos
    """
    
    @staticmethod
    async def ejecutar_script_procesamiento(
        file: UploadFile,
        nit_empresa: str,
        user_id: int,  # Agregado user_id
        db: Session
    ):
        """
        Ejecuta el procesamiento de un archivo Excel
        """
        try:
            logger.info(f"📥 Procesando archivo: {file.filename} para usuario {user_id}")
            logger.info(f"   NIT empresa: {nit_empresa}")
            
            # Obtener la empresa y su configuración
            empresa = db.query(Empresa).filter(
                Empresa.nit == nit_empresa,
                Empresa.usuario_id == user_id,
                Empresa.is_active == True
            ).first()
            
            if not empresa:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Empresa con NIT {nit_empresa} no encontrada"
                )
            
            # Obtener configuración de comprobantes de ventas (prioridad: tabla, fallback: JSON)
            configuracion_comprobantes = None
            from services.tipo_comprobante_service import TipoComprobanteService
            service_comprobantes = TipoComprobanteService(db)
            
            # Intentar obtener de la tabla primero
            comprobantes_ventas = service_comprobantes.obtener_comprobantes_empresa(empresa.id, 'venta')
            if comprobantes_ventas:
                # Convertir de tabla a formato JSON (compatibilidad)
                configuracion_comprobantes = service_comprobantes.convertir_a_formato_json(empresa.id, 'venta')
                logger.info(f"📋 Configuración de comprobantes de ventas cargada desde tabla: {configuracion_comprobantes}")
            elif empresa.configuracion_comprobantes:
                # Fallback a JSON
                try:
                    configuracion_comprobantes = json.loads(empresa.configuracion_comprobantes)
                    logger.info(f"📋 Configuración de comprobantes de ventas cargada desde JSON (fallback): {configuracion_comprobantes}")
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ Error decodificando configuración de comprobantes de ventas para empresa {nit_empresa}")
            
            # Obtener configuración de comprobantes de compras (prioridad: tabla, fallback: JSON)
            configuracion_comprobantes_compras = None
            comprobantes_compras = service_comprobantes.obtener_comprobantes_empresa(empresa.id, 'compra')
            if comprobantes_compras:
                # Convertir de tabla a formato JSON (compatibilidad)
                configuracion_comprobantes_compras = service_comprobantes.convertir_a_formato_json(empresa.id, 'compra')
                logger.info(f"🛒 Configuración de comprobantes de compras cargada desde tabla: {configuracion_comprobantes_compras}")
            elif empresa.configuracion_comprobantes_compras:
                # Fallback a JSON
                try:
                    configuracion_comprobantes_compras = json.loads(empresa.configuracion_comprobantes_compras)
                    logger.info(f"🛒 Configuración de comprobantes de compras cargada desde JSON (fallback): {configuracion_comprobantes_compras}")
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ Error decodificando configuración de comprobantes de compras para empresa {nit_empresa}")
            
            # Obtener configuración de cuentas - PRIORIDAD: Configuración específica por tipo de documento
            registro_cuentas = {}
            
            # 1. Configuración específica para facturas de venta
            if empresa.registro_cuentas_factura_venta:
                try:
                    registro_cuentas['factura_venta'] = json.loads(empresa.registro_cuentas_factura_venta)
                    logger.info(f"💰 Configuración de cuentas para facturas de venta cargada: {registro_cuentas['factura_venta']}")
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ Error decodificando configuración de cuentas para facturas de venta")
            
            # 2. Configuración específica para notas de crédito de venta
            if empresa.registro_cuentas_nota_credito:
                try:
                    registro_cuentas['nota_credito'] = json.loads(empresa.registro_cuentas_nota_credito)
                    logger.info(f"💰 Configuración de cuentas para notas de crédito cargada: {registro_cuentas['nota_credito']}")
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ Error decodificando configuración de cuentas para notas de crédito")
            
            # 3. Configuración específica para facturas de compra
            if empresa.registro_cuentas_factura_compra:
                try:
                    registro_cuentas['factura_compra'] = json.loads(empresa.registro_cuentas_factura_compra)
                    logger.info(f"💰 Configuración de cuentas para facturas de compra cargada: {registro_cuentas['factura_compra']}")
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ Error decodificando configuración de cuentas para facturas de compra")
            
            # 4. Configuración específica para notas de crédito de compra
            if empresa.registro_cuentas_nota_credito_compra:
                try:
                    registro_cuentas['nota_credito_compra'] = json.loads(empresa.registro_cuentas_nota_credito_compra)
                    logger.info(f"💰 Configuración de cuentas para notas de crédito de compra cargada: {registro_cuentas['nota_credito_compra']}")
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ Error decodificando configuración de cuentas para notas de crédito de compra")
            
            # 5. Fallback: Configuración general (compatibilidad hacia atrás)
            if not registro_cuentas and empresa.registro_cuentas:
                try:
                    registro_cuentas_general = json.loads(empresa.registro_cuentas)
                    logger.info(f"💰 Usando configuración general de cuentas: {registro_cuentas_general}")
                    # Mapear configuración general a específica
                    registro_cuentas = {
                        'factura_venta': registro_cuentas_general,
                        'nota_credito': registro_cuentas_general,
                        'factura_compra': registro_cuentas_general,
                        'nota_credito_compra': registro_cuentas_general
                    }
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ Error decodificando configuración general de cuentas para empresa {nit_empresa}")
            
            logger.info(f"💰 Configuración final de cuentas para empresa {nit_empresa}: {registro_cuentas}")
            
            resultado = await ProcesamientoService.procesar_archivo(
                file=file,
                nit_empresa=nit_empresa,
                user_id=user_id,  # Pasar user_id
                configuracion_comprobantes=configuracion_comprobantes,  # Pasar configuración de ventas
                configuracion_comprobantes_compras=configuracion_comprobantes_compras,  # Pasar configuración de compras
                registro_cuentas=registro_cuentas,  # Pasar cuentas
                db=db
            )
            
            logger.info(f"✅ Archivo procesado exitosamente")
            return {
                "success": True,
                "message": "Archivo procesado exitosamente",
                "data": resultado
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error procesando archivo: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error procesando archivo: {str(e)}"
            )
    
    @staticmethod
    async def ejecutar_procesamiento_terceros(
        file: UploadFile,
        nit_empresa: str,
        user_id: int,
        db: Session
    ):
        """
        Ejecuta el procesamiento de terceros de un archivo Excel
        """
        try:
            logger.info(f"📥 Procesando archivo de terceros: {file.filename} para usuario {user_id}")
            logger.info(f"   NIT empresa: {nit_empresa}")
            
            # Obtener la empresa y su configuración
            empresa = db.query(Empresa).filter(
                Empresa.nit == nit_empresa,
                Empresa.usuario_id == user_id,
                Empresa.is_active == True
            ).first()
            
            if not empresa:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Empresa con NIT {nit_empresa} no encontrada"
                )
            
            # Obtener configuración específica para terceros (si existe)
            configuracion_terceros = None
            if hasattr(empresa, 'configuracion_terceros') and empresa.configuracion_terceros:
                try:
                    configuracion_terceros = json.loads(empresa.configuracion_terceros)
                    logger.info(f"👥 Configuración de terceros cargada: {configuracion_terceros}")
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ Error decodificando configuración de terceros para empresa {nit_empresa}")
            
            resultado = await ProcesamientoService.procesar_archivo_terceros(
                file=file,
                nit_empresa=nit_empresa,
                user_id=user_id,
                configuracion_terceros=configuracion_terceros,
                empresa_id=empresa.id,  # Pasar el ID real de la empresa
                db=db
            )
            
            logger.info(f"✅ Archivo de terceros procesado exitosamente")
            return {
                "success": True,
                "message": "Archivo de terceros procesado exitosamente",
                "data": resultado
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error procesando archivo de terceros: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error procesando archivo de terceros: {str(e)}"
            )
    
    @staticmethod
    def listar_archivos_procesados(db: Session, user_id: int):  # Agregado user_id
        """
        Lista todos los archivos procesados del usuario
        """
        try:
            logger.info(f"📋 Listando archivos procesados para usuario {user_id}")
            
            archivos = ProcesamientoService.listar_archivos(db, user_id)  # Pasar user_id
            
            logger.info(f"✅ {len(archivos)} archivos encontrados")
            return archivos
            
        except Exception as e:
            logger.error(f"❌ Error listando archivos: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error listando archivos: {str(e)}"
            )
    
    @staticmethod
    async def descargar_archivo(archivo_id: int, user_id: int, db: Session):  # Agregado user_id
        """
        Descarga un archivo procesado del usuario
        """
        try:
            logger.info(f"📥 Descargando archivo {archivo_id} para usuario {user_id}")
            
            archivo = ProcesamientoService.obtener_archivo(
                archivo_id=archivo_id,
                user_id=user_id,  # Pasar user_id
                db=db
            )
            
            if not archivo:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Archivo no encontrado"
                )
            
            logger.info(f"✅ Archivo encontrado: {archivo.nombre_archivo}")
            return archivo
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error descargando archivo: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error descargando archivo: {str(e)}"
            )
    
    @staticmethod
    async def eliminar_archivo(archivo_id: int, user_id: int, db: Session):  # Agregado user_id
        """
        Elimina un archivo procesado del usuario
        """
        try:
            logger.info(f"🗑️ Eliminando archivo {archivo_id} para usuario {user_id}")
            
            resultado = ProcesamientoService.eliminar_archivo(
                archivo_id=archivo_id,
                user_id=user_id,  # Pasar user_id
                db=db
            )
            
            if not resultado:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Archivo no encontrado"
                )
            
            logger.info(f"✅ Archivo eliminado exitosamente")
            return True
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error eliminando archivo: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error eliminando archivo: {str(e)}"
            )