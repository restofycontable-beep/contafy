"""
Servicio para manejar archivos ZIP generados con modelos de ventas/compras
"""
import io
import zipfile
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from models.archivo_procesado import ArchivoZipGenerado
from models.empresa import Empresa
from scripts.ventas_script import procesar_ventas
from scripts.compras_script import procesar_compras
from utils.number_utils import remove_trailing_zeros

class ZipService:
    """
    Servicio para generar y gestionar archivos ZIP con modelos de ventas/compras
    """
    
    @staticmethod
    def generar_zip_ventas(
        db: Session, 
        archivo_dian_content: bytes, 
        empresa_id: int, 
        usuario_id: int,
        nit_empresa: str,
        configuracion_comprobantes: dict = None,
        registro_cuentas_factura_venta: dict = None,
        registro_cuentas_nota_credito: dict = None
    ) -> Dict[str, Any]:
        """
        Genera un archivo ZIP con los modelos de ventas procesados
        """
        try:
            # Procesar el archivo DIAN con el script de ventas
            modelos_ventas = procesar_ventas(
                excel_dian_content=archivo_dian_content, 
                nit_empresa=nit_empresa,
                configuracion_comprobantes=configuracion_comprobantes,
                registro_cuentas_factura_venta=registro_cuentas_factura_venta,
                registro_cuentas_nota_credito=registro_cuentas_nota_credito
            )
            
            if not modelos_ventas:
                raise Exception("No se pudieron generar modelos de ventas")
            
            # Calcular total de filas procesadas desde los modelos generados
            total_filas_procesadas = sum(modelo.get('filas', 0) for modelo in modelos_ventas if 'filas' in modelo)
            
            # Crear archivo ZIP en memoria
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for modelo in modelos_ventas:
                    nombre_archivo = modelo['nombre']
                    contenido = modelo['contenido']
                    zip_file.writestr(nombre_archivo, contenido)
            
            # Obtener el contenido del ZIP
            zip_content = zip_buffer.getvalue()
            zip_buffer.close()
            
            # Generar nombre del archivo ZIP
            fecha_actual = datetime.now().strftime("%Y%m%d_%H%M%S")
            nombre_zip = f"MODELOS_VENTAS_{nit_empresa.upper()}_{fecha_actual}.ZIP"
            
            # Guardar en la base de datos
            # Guardar también el total de filas en la descripción para poder extraerlo después
            descripcion_con_filas = f"Modelos de ventas generados el {datetime.now().strftime('%d/%m/%Y %H:%M:%S')} | Total filas: {total_filas_procesadas}"
            
            archivo_zip = ArchivoZipGenerado(
                nombre_archivo=nombre_zip,
                contenido_zip=zip_content,
                tamano_bytes=len(zip_content),
                tipo_procesamiento='ventas',
                numero_cedula=nit_empresa,
                descripcion=descripcion_con_filas,
                empresa_id=empresa_id,
                usuario_id=usuario_id
            )
            
            db.add(archivo_zip)
            db.commit()
            db.refresh(archivo_zip)
            
            return {
                "success": True,
                "message": f"Archivo ZIP de ventas generado exitosamente: {nombre_zip}",
                "data": {
                    "id": archivo_zip.id,
                    "nombre_archivo": archivo_zip.nombre_archivo,
                    "tamano_bytes": archivo_zip.tamano_bytes,
                    "tamano_mb": round(archivo_zip.tamano_bytes / (1024 * 1024), 2),
                    "tipo_procesamiento": archivo_zip.tipo_procesamiento,
                    "numero_cedula": archivo_zip.numero_cedula,
                    "fecha_generacion": archivo_zip.fecha_generacion.isoformat() if archivo_zip.fecha_generacion else None,
                    "modelos_generados": len(modelos_ventas)
                }
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"Error generando ZIP de ventas: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def generar_zip_compras(
        db: Session, 
        archivo_dian_content: bytes, 
        empresa_id: int, 
        usuario_id: int,
        nit_empresa: str,
        configuracion_comprobantes_compras: dict = None,
        registro_cuentas_factura_compra: dict = None,
        registro_cuentas_nota_credito_compra: dict = None
    ) -> Dict[str, Any]:
        """
        Genera un archivo ZIP con los modelos de compras procesados
        """
        try:
            # RECUPERAR CUENTAS DE LA BASE DE DATOS
            excel_cuentas_bytes = None
            try:
                from models.cuenta_importada import CuentaImportada
                import pandas as pd
                
                # Recuperar cuentas de esta empresa
                cuentas = db.query(CuentaImportada).filter(
                    CuentaImportada.empresa_id == empresa_id,
                    CuentaImportada.user_id == usuario_id
                ).all()
                
                if cuentas:
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
                    
                    # Crear Excel en memoria
                    df_cuentas = pd.DataFrame(cuentas_data)
                    buffer_cuentas = io.BytesIO()
                    df_cuentas.to_excel(buffer_cuentas, index=False, sheet_name='Cuentas')
                    buffer_cuentas.seek(0)
                    excel_cuentas_bytes = buffer_cuentas.getvalue()
            except Exception as e_cuentas:
                pass
            
            # Procesar el archivo DIAN con el script de compras
            modelos_compras = procesar_compras(
                excel_dian_content=archivo_dian_content, 
                nit_empresa=nit_empresa,
                excel_cuentas_content=excel_cuentas_bytes,  # 🎯 AHORA PASA LAS CUENTAS
                configuracion_comprobantes_compras=configuracion_comprobantes_compras,
                registro_cuentas_factura_compra=registro_cuentas_factura_compra,
                registro_cuentas_nota_credito_compra=registro_cuentas_nota_credito_compra
            )
            
            if not modelos_compras:
                raise Exception("No se pudieron generar modelos de compras")
            
            # Calcular total de filas procesadas desde los modelos generados
            total_filas_procesadas = sum(modelo.get('filas', 0) for modelo in modelos_compras if 'filas' in modelo)
            
            # Crear archivo ZIP en memoria
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for modelo in modelos_compras:
                    nombre_archivo = modelo['nombre']
                    contenido = modelo['contenido']
                    zip_file.writestr(nombre_archivo, contenido)
            
            # Obtener el contenido del ZIP
            zip_content = zip_buffer.getvalue()
            zip_buffer.close()
            
            # Generar nombre del archivo ZIP
            fecha_actual = datetime.now().strftime("%Y%m%d_%H%M%S")
            nombre_zip = f"MODELOS_COMPRAS_{nit_empresa.upper()}_{fecha_actual}.ZIP"
            
            # Guardar en la base de datos
            # Guardar también el total de filas en la descripción para poder extraerlo después
            descripcion_con_filas = f"Modelos de compras generados el {datetime.now().strftime('%d/%m/%Y %H:%M:%S')} | Total filas: {total_filas_procesadas}"
            
            archivo_zip = ArchivoZipGenerado(
                nombre_archivo=nombre_zip,
                contenido_zip=zip_content,
                tamano_bytes=len(zip_content),
                tipo_procesamiento='compras',
                numero_cedula=nit_empresa,
                descripcion=descripcion_con_filas,
                empresa_id=empresa_id,
                usuario_id=usuario_id
            )
            
            db.add(archivo_zip)
            db.commit()
            db.refresh(archivo_zip)
            
            return {
                "success": True,
                "message": f"Archivo ZIP de compras generado exitosamente: {nombre_zip}",
                "data": {
                    "id": archivo_zip.id,
                    "nombre_archivo": archivo_zip.nombre_archivo,
                    "tamano_bytes": archivo_zip.tamano_bytes,
                    "tamano_mb": round(archivo_zip.tamano_bytes / (1024 * 1024), 2),
                    "tipo_procesamiento": archivo_zip.tipo_procesamiento,
                    "numero_cedula": archivo_zip.numero_cedula,
                    "fecha_generacion": archivo_zip.fecha_generacion.isoformat() if archivo_zip.fecha_generacion else None,
                    "modelos_generados": len(modelos_compras)
                }
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"Error generando ZIP de compras: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def obtener_archivos_zip_usuario(
        db: Session, 
        usuario_id: int, 
        limit: int = 100, 
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Obtiene los archivos ZIP generados por un usuario
        """
        try:
            # Buscar archivos del usuario específico
            archivos = db.query(ArchivoZipGenerado).filter(
                ArchivoZipGenerado.usuario_id == usuario_id,
                ArchivoZipGenerado.estado != 'eliminado'
            ).order_by(ArchivoZipGenerado.fecha_generacion.desc()).limit(limit).offset(offset).all()
            
            # Convertir a diccionarios
            archivos_dict = [archivo.to_dict() for archivo in archivos]
            
            return archivos_dict
            
        except Exception as e:
            return []
    
    @staticmethod
    def descargar_archivo_zip(db: Session, zip_id: int, usuario_id: int) -> Dict[str, Any]:
        """
        Obtiene el contenido de un archivo ZIP para descarga
        """
        try:
            archivo = db.query(ArchivoZipGenerado).filter(
                ArchivoZipGenerado.id == zip_id,
                ArchivoZipGenerado.usuario_id == usuario_id,
                ArchivoZipGenerado.estado != 'eliminado'
            ).first()
            
            if not archivo:
                return {
                    "success": False,
                    "message": "Archivo ZIP no encontrado",
                    "data": None
                }
            
            # Actualizar estado a descargado
            archivo.estado = 'descargado'
            db.commit()
            
            return {
                "success": True,
                "message": "Archivo ZIP obtenido exitosamente",
                "data": {
                    "id": archivo.id,
                    "nombre_archivo": archivo.nombre_archivo,
                    "contenido_zip": archivo.contenido_zip,
                    "tamano_bytes": archivo.tamano_bytes,
                    "tipo_procesamiento": archivo.tipo_procesamiento,
                    "numero_cedula": archivo.numero_cedula,
                    "fecha_generacion": archivo.fecha_generacion.isoformat() if archivo.fecha_generacion else None
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Error obteniendo archivo ZIP: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def generar_zip_terceros(
        db: Session, 
        archivo_dian_content: bytes, 
        empresa_id: int, 
        usuario_id: int,
        nit_empresa: str
    ) -> Dict[str, Any]:
        """
        Genera un archivo ZIP con modelos de terceros procesados
        """
        try:
            # Forzar refresh de la sesión de BD para asegurar datos actualizados
            db.expire_all()
            
            # Crear buffer en memoria para el ZIP
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                
                # === PROCESAR TERCEROS ===
                try:
                    # Importar el script de terceros
                    from scripts.creacion_def_terceros import procesar_terceros
                    
                    # Obtener datos de la empresa con refresh para asegurar datos actualizados
                    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
                    if empresa:
                        db.refresh(empresa)  # Forzar refresh de la empresa
                    
                    datos_empresa = None
                    if empresa:
                        datos_empresa = {
                            'codigo_pais': empresa.codigo_pais or 'Co',
                            'codigo_departamento': empresa.codigo_departamento,
                            'codigo_ciudad': empresa.codigo_ciudad,
                            'direccion': empresa.direccion
                        }
                    else:
                        raise Exception(f"Empresa {empresa_id} no encontrada")
                    
                    # Verificar que el contenido del archivo no esté vacío
                    if not archivo_dian_content or len(archivo_dian_content) == 0:
                        raise Exception("El archivo DIAN está vacío o no se pudo leer correctamente")
                    
                    resultado_terceros = procesar_terceros(
                        excel_dian_content=archivo_dian_content,
                        nit_empresa=nit_empresa,
                        configuracion_terceros=None,
                        datos_empresa=datos_empresa
                    )
                    
                    # Agregar archivos de terceros al ZIP
                    for i, archivo_info in enumerate(resultado_terceros['archivos_generados']):
                        nombre_archivo = f"TERCEROS_{archivo_info['nombre']}"
                        # Decodificar el contenido base64
                        import base64
                        contenido_bytes = base64.b64decode(archivo_info['contenido'])
                        zip_file.writestr(nombre_archivo, contenido_bytes)
                        
                except Exception as e:
                    raise Exception(f"Error procesando terceros: {str(e)}")
            
            # Obtener el contenido del ZIP
            zip_buffer.seek(0)
            zip_content = zip_buffer.getvalue()
            
            
            # Generar nombre del archivo
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            nombre_archivo = f"TERCEROS_{nit_empresa.upper()}_{timestamp}.ZIP"
            
            # Guardar en base de datos
            archivo_zip = ArchivoZipGenerado(
                usuario_id=usuario_id,
                empresa_id=empresa_id,
                nombre_archivo=nombre_archivo,
                contenido_zip=zip_content,
                tamano_bytes=len(zip_content),
                tipo_procesamiento='terceros',
                numero_cedula=nit_empresa,
                estado='generado',
                is_active=True,
                fecha_generacion=datetime.now()
            )
            
            db.add(archivo_zip)
            db.commit()
            db.refresh(archivo_zip)
            
            return {
                "success": True,
                "message": "Archivo ZIP de terceros generado exitosamente",
                "data": {
                    "id": archivo_zip.id,
                    "nombre_archivo": nombre_archivo,
                    "tamaño_bytes": len(zip_content),
                    "tamano_mb": round(len(zip_content) / (1024 * 1024), 2),
                    "zip_id": archivo_zip.id,
                    "tipo_procesamiento": "terceros",
                    "modelos_generados": "Archivos de terceros",
                    "fecha_generacion": archivo_zip.fecha_generacion.isoformat() if archivo_zip.fecha_generacion else None
                }
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"Error generando ZIP de terceros: {str(e)}",
                "data": None
            }
    
    @staticmethod
    def generar_zip_ambos(
        db: Session, 
        archivo_dian_content: bytes, 
        empresa_id: int, 
        usuario_id: int,
        nit_empresa: str,
        configuracion_comprobantes: dict = None,
        configuracion_comprobantes_compras: dict = None,
        registro_cuentas_factura_venta: dict = None,
        registro_cuentas_nota_credito: dict = None,
        registro_cuentas_factura_compra: dict = None,
        registro_cuentas_nota_credito_compra: dict = None
    ) -> Dict[str, Any]:
        """
        Genera un archivo ZIP con modelos de ventas Y compras procesados
        """
        try:
            # Forzar refresh de la sesión de BD para asegurar datos actualizados
            db.expire_all()
            
            # PASO 1: Recuperar cuentas de BD ANTES de iniciar procesamiento
            excel_cuentas_bytes = None
            try:
                from models.cuenta_importada import CuentaImportada
                import pandas as pd
                
                cuentas = db.query(CuentaImportada).filter(
                    CuentaImportada.empresa_id == empresa_id,
                    CuentaImportada.user_id == usuario_id
                ).all()
                
                if cuentas:
                    cuentas_data = []
                    for cuenta in cuentas:
                        cuentas_data.append({
                            'NIT': cuenta.nit,
                            'NOMBRE': cuenta.nombre,
                            'CUENTA': cuenta.cuenta,
                            'CUENTA_EXENTA': cuenta.cuenta_exenta if cuenta.cuenta_exenta else '',
                            'CUENTA_IVA': cuenta.cuenta_iva if cuenta.cuenta_iva else cuenta.cuenta,
                            'CUENTA_CONTRAPARTIDA': cuenta.cuenta_contrapartida if cuenta.cuenta_contrapartida else ''
                        })
                    
                    df_cuentas = pd.DataFrame(cuentas_data)
                    buffer_cuentas = io.BytesIO()
                    df_cuentas.to_excel(buffer_cuentas, index=False, sheet_name='Cuentas')
                    buffer_cuentas.seek(0)
                    excel_cuentas_bytes = buffer_cuentas.getvalue()
                    
                # Hacer commit para liberar recursos
                db.commit()
            except Exception as e_bd:
                db.rollback()
            
            # PASO 2: Crear buffer en memoria para el ZIP (SIN operaciones de BD)
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                
                # === PROCESAR VENTAS ===
                try:
                    # Convertir strings JSON a diccionarios si es necesario
                    factura_venta_dict = registro_cuentas_factura_venta
                    nota_credito_dict = registro_cuentas_nota_credito
                    
                    if isinstance(registro_cuentas_factura_venta, str):
                        import json
                        factura_venta_dict = json.loads(registro_cuentas_factura_venta)
                    
                    if isinstance(registro_cuentas_nota_credito, str):
                        import json
                        nota_credito_dict = json.loads(registro_cuentas_nota_credito)
                    
                    archivos_ventas = procesar_ventas(
                        excel_dian_content=archivo_dian_content,
                        nit_empresa=nit_empresa,
                        configuracion_comprobantes=configuracion_comprobantes or {},
                        registro_cuentas_factura_venta=factura_venta_dict,
                        registro_cuentas_nota_credito=nota_credito_dict
                    )
                    
                    # Agregar archivos de ventas al ZIP
                    for i, archivo_info in enumerate(archivos_ventas):
                        nombre_archivo = f"VENTAS_{archivo_info['nombre']}"
                        zip_file.writestr(nombre_archivo, archivo_info['contenido'])
                        
                except Exception as e:
                    pass
                
                # === PROCESAR COMPRAS ===
                try:
                    # Convertir strings JSON a diccionarios si es necesario
                    factura_compra_dict = registro_cuentas_factura_compra
                    nota_credito_compra_dict = registro_cuentas_nota_credito_compra
                    
                    if isinstance(registro_cuentas_factura_compra, str):
                        import json
                        factura_compra_dict = json.loads(registro_cuentas_factura_compra)
                    
                    if isinstance(registro_cuentas_nota_credito_compra, str):
                        import json
                        nota_credito_compra_dict = json.loads(registro_cuentas_nota_credito_compra)
                    
                    archivos_compras = procesar_compras(
                        excel_dian_content=archivo_dian_content,
                        nit_empresa=nit_empresa,
                        excel_cuentas_content=excel_cuentas_bytes,  # 🎯 AHORA PASA LAS CUENTAS
                        configuracion_comprobantes_compras=configuracion_comprobantes_compras or {},
                        registro_cuentas_factura_compra=factura_compra_dict,
                        registro_cuentas_nota_credito_compra=nota_credito_compra_dict
                    )
                    
                    # Agregar archivos de compras al ZIP
                    for i, archivo_info in enumerate(archivos_compras):
                        nombre_archivo = f"COMPRAS_{archivo_info['nombre']}"
                        zip_file.writestr(nombre_archivo, archivo_info['contenido'])
                        
                except Exception as e:
                    # NO lanzar error, continuar con terceros
                    pass
                
                # === PROCESAR TERCEROS ===
                try:
                    # Importar el script de terceros
                    from scripts.creacion_def_terceros import procesar_terceros
                    
                    # Obtener datos de la empresa con refresh para asegurar datos actualizados
                    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
                    if empresa:
                        db.refresh(empresa)  # Forzar refresh de la empresa
                    
                    datos_empresa = None
                    if empresa:
                        datos_empresa = {
                            'codigo_pais': empresa.codigo_pais or 'Co',
                            'codigo_departamento': empresa.codigo_departamento,
                            'codigo_ciudad': empresa.codigo_ciudad,
                            'direccion': empresa.direccion
                        }
                    else:
                        raise Exception(f"Empresa {empresa_id} no encontrada")
                    
                    # Verificar que el contenido del archivo no esté vacío
                    if not archivo_dian_content or len(archivo_dian_content) == 0:
                        raise Exception("El archivo DIAN está vacío o no se pudo leer correctamente")
                    
                    resultado_terceros = procesar_terceros(
                        excel_dian_content=archivo_dian_content,
                        nit_empresa=nit_empresa,
                        configuracion_terceros=None,
                        datos_empresa=datos_empresa
                    )
                    
                    # Agregar archivos de terceros al ZIP
                    for i, archivo_info in enumerate(resultado_terceros['archivos_generados']):
                        nombre_archivo = f"TERCEROS_{archivo_info['nombre']}"
                        # Decodificar el contenido base64
                        import base64
                        contenido_bytes = base64.b64decode(archivo_info['contenido'])
                        zip_file.writestr(nombre_archivo, contenido_bytes)
                        
                except Exception as e:
                    pass
            
            # Obtener el contenido del ZIP
            zip_buffer.seek(0)
            zip_content = zip_buffer.getvalue()
            
            
            # Generar nombre del archivo
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            nombre_archivo = f"MODELOS_COMPLETOS_{nit_empresa.upper()}_{timestamp}.ZIP"
            
            # Hacer rollback de cualquier transacción pendiente antes de guardar
            try:
                db.rollback()
            except:
                pass
            
            # Guardar en base de datos
            archivo_zip = ArchivoZipGenerado(
                usuario_id=usuario_id,
                empresa_id=empresa_id,
                nombre_archivo=nombre_archivo,
                contenido_zip=zip_content,
                tamano_bytes=len(zip_content),
                tipo_procesamiento='completo',
                numero_cedula=nit_empresa,
                estado='generado',
                is_active=True,
                fecha_generacion=datetime.now()
            )
            
            db.add(archivo_zip)
            db.commit()
            db.refresh(archivo_zip)
            
            return {
                "id": archivo_zip.id,
                "nombre_archivo": nombre_archivo,
                "tamano_bytes": len(zip_content),
                "tipo_procesamiento": "ambos",
                "numero_cedula": nit_empresa,
                "fecha_generacion": archivo_zip.fecha_generacion.isoformat() if archivo_zip.fecha_generacion else None
            }
            
        except Exception as e:
            db.rollback()
            raise e
