"""
Servicio para procesamiento de archivos
"""
import pandas as pd
import io
import os
from datetime import datetime
import logging
from sqlalchemy.orm import Session
from fastapi import UploadFile
from models.archivo_procesado import ArchivoProcesado
from models.empresa import Empresa
from scripts.ventas_script import procesar_ventas, es_archivo_dian
from scripts.compras_script import procesar_compras
from scripts.creacion_def_terceros import procesar_terceros
from utils.number_utils import remove_trailing_zeros, normalize_nit

logger = logging.getLogger(__name__)

class ProcesamientoService:
    """
    Servicio para procesar archivos Excel
    """
    
    @staticmethod
    async def procesar_archivo(
        file: UploadFile,
        nit_empresa: str,
        user_id: int,  # Agregado user_id
        configuracion_comprobantes: dict = None,  # Configuración de comprobantes de ventas
        configuracion_comprobantes_compras: dict = None,  # Configuración de comprobantes de compras
        registro_cuentas: dict = None,  # Configuración de cuentas de la empresa
        db: Session = None
    ) -> dict:
        """
        Procesa un archivo Excel y lo guarda en la base de datos
        """
        try:
            logger.info(f"Procesando archivo: {file.filename} para usuario {user_id}")
            logger.info(f"Configuración de comprobantes: {configuracion_comprobantes}")
            logger.info(f"Configuración de cuentas: {registro_cuentas}")
            
            # Leer contenido del archivo
            contenido = await file.read()
            
            # Verificar si es un archivo DIAN
            if not es_archivo_dian(contenido):
                raise Exception("El archivo no es un reporte válido de la DIAN")
            
            # Determinar si es ventas o compras basándose en el NIT
            # Si el NIT emisor es igual al NIT de la empresa, es VENTAS
            # Si el NIT receptor es igual al NIT de la empresa, es COMPRAS
            
            df = pd.read_excel(io.BytesIO(contenido))
            nit_emisores = df['NIT Emisor'].unique()
            nit_receptores = df['NIT Receptor'].unique()
            
            logger.info(f"NITs emisores en archivo: {list(nit_emisores)}")
            logger.info(f"NITs receptores en archivo: {list(nit_receptores)}")
            logger.info(f"NIT empresa: {nit_empresa}")
            
            nit_empresa_normalizado = normalize_nit(nit_empresa)
            
            es_ventas = False
            es_compras = False
            
            for nit in nit_emisores:
                nit_normalizado = normalize_nit(nit)
                if nit_normalizado == nit_empresa_normalizado:
                    es_ventas = True
                    break
            
            for nit in nit_receptores:
                nit_normalizado = normalize_nit(nit)
                if nit_normalizado == nit_empresa_normalizado:
                    es_compras = True
                    break
            
            logger.info(f"Tipo de procesamiento - Ventas: {es_ventas}, Compras: {es_compras}")
            
            # Ejecutar script correspondiente
            if es_ventas:
                logger.info("🛒 Ejecutando script de VENTAS")
                archivos_generados = procesar_ventas(
                    excel_dian_content=contenido,
                    nit_empresa=nit_empresa,
                    configuracion_comprobantes=configuracion_comprobantes,
                    registro_cuentas_factura_venta=registro_cuentas.get('factura_venta') if registro_cuentas else None,
                    registro_cuentas_nota_credito=registro_cuentas.get('nota_credito') if registro_cuentas else None
                )
                tipo_procesamiento = "ventas"
            elif es_compras:
                logger.info("🛍️ Ejecutando script de COMPRAS")
                
                # RECUPERAR CUENTAS DE LA BASE DE DATOS
                excel_cuentas_bytes = None
                if db:
                    try:
                        from models.cuenta_importada import CuentaImportada
                        from models.empresa import Empresa
                        
                        nit_buscar_normalizado = normalize_nit(nit_empresa)
                        
                        logger.info(f"Buscando empresa - NIT: '{nit_empresa}' (user_id: {user_id})")
                        
                        empresas_usuario = db.query(Empresa).filter(
                            Empresa.usuario_id == user_id,
                            Empresa.is_active == True
                        ).all()
                        
                        logger.info(f"Empresas activas del usuario: {len(empresas_usuario)}")
                        
                        empresa = None
                        for emp in empresas_usuario:
                            nit_emp_normalizado = normalize_nit(emp.nit)
                            if nit_emp_normalizado == nit_buscar_normalizado:
                                empresa = emp
                                logger.info(f"Empresa encontrada: {empresa.razon_social} (ID: {empresa.id})")
                                break
                        
                        if empresa:
                            cuentas = db.query(CuentaImportada).filter(
                                CuentaImportada.empresa_id == empresa.id,
                                CuentaImportada.user_id == user_id
                            ).all()
                            
                            logger.info(f"Buscando cuentas para empresa_id={empresa.id}, user_id={user_id}")
                            
                            total_cuentas_usuario = db.query(CuentaImportada).filter(
                                CuentaImportada.user_id == user_id
                            ).count()
                            logger.info(f"Total cuentas del usuario: {total_cuentas_usuario}, para esta empresa: {len(cuentas)}")
                            
                            if cuentas:
                                logger.info(f"Recuperadas {len(cuentas)} cuentas para {empresa.razon_social}")
                                
                                cuentas_data = []
                                for cuenta in cuentas:
                                    cuentas_data.append({
                                        'NIT': remove_trailing_zeros(cuenta.nit),
                                        'NOMBRE': cuenta.nombre,
                                        'CUENTA': remove_trailing_zeros(cuenta.cuenta),
                                        'CUENTA_EXENTA': remove_trailing_zeros(cuenta.cuenta_exenta) if cuenta.cuenta_exenta else '',
                                        'CUENTA_IVA': remove_trailing_zeros(cuenta.cuenta_iva) if cuenta.cuenta_iva else '',
                                        'CUENTA_CONTRAPARTIDA': remove_trailing_zeros(cuenta.cuenta_contrapartida) if cuenta.cuenta_contrapartida else ''
                                    })
                                
                                if cuentas_data:
                                    df_cuentas = pd.DataFrame(cuentas_data)
                                    
                                    columnas_numericas = ['NIT', 'CUENTA', 'CUENTA_EXENTA', 'CUENTA_IVA', 'CUENTA_CONTRAPARTIDA']
                                    for col in columnas_numericas:
                                        if col in df_cuentas.columns:
                                            df_cuentas[col] = df_cuentas[col].astype(str)
                                    
                                    buffer_cuentas = io.BytesIO()
                                    with pd.ExcelWriter(buffer_cuentas, engine='openpyxl') as writer:
                                        df_cuentas.to_excel(writer, index=False, sheet_name='Cuentas')
                                        
                                        workbook = writer.book
                                        worksheet = writer.sheets['Cuentas']
                                        
                                        for row in worksheet.iter_rows(min_row=2, max_row=worksheet.max_row):
                                            if row[0].value:
                                                row[0].number_format = '@'
                                            if len(row) > 2 and row[2].value:
                                                row[2].number_format = '@'
                                            if len(row) > 3 and row[3].value:
                                                row[3].number_format = '@'
                                            if len(row) > 4 and row[4].value:
                                                row[4].number_format = '@'
                                            if len(row) > 5 and row[5].value:
                                                row[5].number_format = '@'
                                    
                                    buffer_cuentas.seek(0)
                                    excel_cuentas_bytes = buffer_cuentas.getvalue()
                                    
                                    logger.info(f"Excel generado con {len(cuentas_data)} registros")
                                else:
                                    logger.warning(f"No hay datos de cuentas para generar Excel para empresa {empresa.razon_social}")
                                    excel_cuentas_bytes = None
                            else:
                                logger.warning(f"No se encontraron cuentas para empresa {empresa.razon_social} (empresa_id={empresa.id}, user_id={user_id})")
                                excel_cuentas_bytes = None
                        else:
                            logger.error(f"Empresa con NIT '{nit_empresa}' no encontrada para usuario {user_id}")
                            if empresas_usuario:
                                logger.error(f"Empresas disponibles del usuario ({len(empresas_usuario)}):")
                                for emp in empresas_usuario:
                                    nit_emp_norm = normalize_nit(emp.nit)
                                    logger.error(f"  - {emp.razon_social} (ID: {emp.id}, NIT: '{emp.nit}', NIT normalizado: '{nit_emp_norm}')")
                            excel_cuentas_bytes = None
                    except Exception as e:
                        logger.error(f"Error recuperando cuentas de la base de datos: {str(e)}")
                        import traceback
                        logger.error(f"Traceback: {traceback.format_exc()}")
                        excel_cuentas_bytes = None
                
                # Ejecutar script de compras con las cuentas recuperadas
                archivos_generados = procesar_compras(
                    excel_dian_content=contenido,
                    nit_empresa=nit_empresa,
                    excel_cuentas_content=excel_cuentas_bytes,  # 🎯 AHORA PASA LAS CUENTAS DE LA BD
                    configuracion_comprobantes_compras=configuracion_comprobantes_compras,
                    registro_cuentas_factura_compra=registro_cuentas.get('factura_compra') if registro_cuentas else None,
                    registro_cuentas_nota_credito_compra=registro_cuentas.get('nota_credito_compra') if registro_cuentas else None
                )
                tipo_procesamiento = "compras"
            else:
                raise Exception(f"No se pudo determinar si el archivo es de ventas o compras para el NIT {nit_empresa}")
            
            # Crear archivo procesado
            archivo_procesado = ArchivoProcesado(
                nombre_archivo=file.filename,
                nombre_original=file.filename,
                contenido=contenido,
                tamano_bytes=len(contenido),
                descripcion=f"Archivo procesado para empresa {nit_empresa} - {tipo_procesamiento}",
                estado="procesado",
                empresa_id=1,  # ID de la empresa por defecto
                usuario_id=user_id,  # Agregado usuario_id
                tipo_archivo=file.content_type
            )
            
            # Guardar en base de datos
            if db:
                db.add(archivo_procesado)
                db.commit()
                db.refresh(archivo_procesado)
                logger.info(f"Archivo guardado con ID: {archivo_procesado.id}")
            
            return {
                "archivo_procesado": archivo_procesado.to_dict() if db else None,
                "archivos_generados": archivos_generados,
                "tipo_procesamiento": tipo_procesamiento,
                "configuracion_usada": {
                    "comprobantes": configuracion_comprobantes,
                    "cuentas": registro_cuentas
                }
            }
            
        except Exception as e:
            logger.error(f"Error procesando archivo: {str(e)}")
            if db:
                db.rollback()
            raise
    
    @staticmethod
    async def procesar_archivo_terceros(
        file: UploadFile,
        nit_empresa: str,
        user_id: int,
        configuracion_terceros: dict = None,
        empresa_id: int = None,
        db: Session = None
    ) -> dict:
        """
        Procesa un archivo Excel para extraer información de terceros (emisores y receptores)
        """
        try:
            logger.info(f"Procesando archivo de terceros: {file.filename} para usuario {user_id}")
            logger.info(f"Configuración de terceros: {configuracion_terceros}")
            
            # Leer contenido del archivo
            contenido = await file.read()
            
            # Verificar si es un archivo DIAN
            if not es_archivo_dian(contenido):
                raise Exception("El archivo no es un reporte válido de la DIAN")
            
            # Obtener datos de la empresa para el script
            datos_empresa = None
            if empresa_id and db:
                empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
                if empresa:
                    # Verificar que la empresa tenga los datos necesarios
                    if not empresa.direccion or not empresa.codigo_departamento or not empresa.codigo_ciudad:
                        raise Exception(f"La empresa {empresa.razon_social} no tiene configurada la información de ubicación necesaria. Por favor, actualiza la dirección, código de departamento y código de ciudad en la configuración de la empresa.")
                    
                    datos_empresa = {
                        'codigo_pais': empresa.codigo_pais or 'Co',
                        'codigo_departamento': empresa.codigo_departamento,
                        'codigo_ciudad': empresa.codigo_ciudad,
                        'direccion': empresa.direccion
                    }
                    logger.info(f"🏢 Datos de empresa obtenidos: {datos_empresa}")
                else:
                    raise Exception("Empresa no encontrada")
            else:
                raise Exception("ID de empresa no proporcionado")
            
            # Ejecutar script de terceros
            logger.info("👥 Ejecutando script de TERCEROS")
            resultado_terceros = procesar_terceros(
                excel_dian_content=contenido,
                nit_empresa=nit_empresa,
                configuracion_terceros=configuracion_terceros,
                datos_empresa=datos_empresa
            )
            
            # NO guardar en base de datos como los otros procesamientos
            # Solo retornar los archivos generados directamente
            return {
                "archivos_generados": resultado_terceros["archivos_generados"],
                "estadisticas": resultado_terceros["estadisticas"],
                "tipo_procesamiento": "terceros",
                "configuracion_usada": {
                    "terceros": configuracion_terceros
                }
            }
            
        except Exception as e:
            logger.error(f"Error procesando archivo de terceros: {str(e)}")
            if db:
                db.rollback()
            raise
    
    @staticmethod
    def listar_archivos(
        db: Session,
        user_id: int,  # Agregado user_id para filtrar por usuario
        skip: int = 0,
        limit: int = 100
    ) -> list:
        """
        Lista los archivos procesados del usuario
        """
        try:
            archivos = db.query(ArchivoProcesado).filter(
                ArchivoProcesado.estado != "eliminado",
                ArchivoProcesado.usuario_id == user_id  # Filtrar por usuario
            ).order_by(ArchivoProcesado.fecha_procesamiento.desc()).offset(skip).limit(limit).all()
            
            return [archivo.to_dict() for archivo in archivos]
            
        except Exception as e:
            logger.error(f"Error listando archivos: {str(e)}")
            raise
    
    @staticmethod
    def obtener_archivo(
        archivo_id: int,
        user_id: int,  # Agregado user_id
        db: Session
    ) -> ArchivoProcesado:
        """
        Obtiene un archivo procesado del usuario
        """
        try:
            archivo = db.query(ArchivoProcesado).filter(
                ArchivoProcesado.id == archivo_id,
                ArchivoProcesado.usuario_id == user_id,  # Filtrar por usuario
                ArchivoProcesado.estado != "eliminado"
            ).first()
            
            return archivo
            
        except Exception as e:
            logger.error(f"Error obteniendo archivo: {str(e)}")
            raise
    
    @staticmethod
    def eliminar_archivo(
        archivo_id: int,
        user_id: int,  # Agregado user_id
        db: Session
    ) -> bool:
        """
        Elimina un archivo procesado del usuario
        """
        try:
            archivo = db.query(ArchivoProcesado).filter(
                ArchivoProcesado.id == archivo_id,
                ArchivoProcesado.usuario_id == user_id  # Filtrar por usuario
            ).first()
            
            if archivo:
                archivo.estado = "eliminado"
                db.commit()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error eliminando archivo: {str(e)}")
            db.rollback()
            raise