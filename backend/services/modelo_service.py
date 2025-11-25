"""
Servicio para generar modelos de ventas y compras desde archivos DIAN
Basado en el script scripts.py existente
"""
import pandas as pd
import io
import os
from datetime import datetime
import logging
from sqlalchemy.orm import Session
from models.archivo_procesado import ArchivoProcesado

# Importar tus scripts personalizados
try:
    from scripts import procesar_ventas, procesar_compras, es_archivo_dian
except ImportError:
    # Si no existen aún los scripts, usar versión básica
    procesar_ventas = None
    procesar_compras = None
    es_archivo_dian = None

logger = logging.getLogger(__name__)

class ModeloService:
    """
    Servicio para generar modelos de ventas y compras
    """
    
    @staticmethod
    def _get_encabezados():
        """
        Retorna los encabezados del modelo Excel
        """
        return [
            "Tipo de comprobante", "Consecutivo comprobante", "Fecha de elaboración", "Sigla moneda",
            "Tasa de cambio", "Código cuenta contable", "Identificación tercero", "Sucursal",
            "Código producto", "Código de bodega", "Acción", "Cantidad producto", "Prefijo",
            "Consecutivo", "No. cuota", "Fecha vencimiento", "Código impuesto", 
            "Código grupo activo fijo", "Código activo fijo", "Descripción",
            "Código centro/subcentro de costos", "Débito", "Crédito", "Observaciones",
            "Base gravable libro compras/ventas", "Base exenta libro compras/ventas", "Mes de cierre"
        ]
    
    @staticmethod
    def generar_modelo_ventas(
        archivo_id: int,
        user_id: int,
        nit_empresa: str,
        db: Session
    ) -> dict:
        """
        Genera modelo de ventas desde archivo DIAN procesado usando tu script personalizado
        """
        try:
            logger.info(f"Generando modelo de ventas para archivo {archivo_id}, usuario {user_id}")
            
            # Obtener archivo procesado
            archivo = db.query(ArchivoProcesado).filter(
                ArchivoProcesado.id == archivo_id,
                ArchivoProcesado.usuario_id == user_id
            ).first()
            
            if not archivo:
                raise ValueError("Archivo no encontrado")
            
            # Verificar si es archivo DIAN
            if es_archivo_dian and not es_archivo_dian(archivo.contenido):
                raise ValueError("El archivo no es un reporte válido de la DIAN")
            
            # Usar tu script personalizado de ventas
            if procesar_ventas:
                # Obtener configuración de la empresa
                from models.empresa import Empresa
                empresa = db.query(Empresa).filter(Empresa.nit == nit_empresa).first()
                
                if not empresa:
                    raise ValueError(f"Empresa con NIT {nit_empresa} no encontrada")
                
                # Obtener configuración de comprobantes
                configuracion_comprobantes = None
                if empresa.configuracion_comprobantes:
                    import json
                    try:
                        configuracion_comprobantes = json.loads(empresa.configuracion_comprobantes)
                    except json.JSONDecodeError:
                        pass
                
                # Obtener configuración de cuentas
                registro_cuentas = None
                if empresa.registro_cuentas:
                    try:
                        registro_cuentas = json.loads(empresa.registro_cuentas)
                    except json.JSONDecodeError:
                        pass
                
                archivos_script = procesar_ventas(
                    excel_dian_content=archivo.contenido,
                    nit_empresa=nit_empresa,
                    configuracion_comprobantes=configuracion_comprobantes,
                    registro_cuentas_factura_venta=registro_cuentas.get('factura_venta') if registro_cuentas else None,
                    registro_cuentas_nota_credito=registro_cuentas.get('nota_credito') if registro_cuentas else None
                )
                archivos_guardados = []
                
                # Guardar cada archivo generado en la base de datos
                for archivo_data in archivos_script:
                    archivo_procesado = ArchivoProcesado(
                        nombre_archivo=archivo_data['nombre'],
                        nombre_original=archivo_data['nombre'],
                        contenido=archivo_data['contenido'],
                        tamano_bytes=len(archivo_data['contenido']),
                        descripcion=f"Modelo de ventas generado automáticamente - {archivo_data['filas']} filas",
                        estado="procesado",
                        empresa_id=archivo.empresa_id,
                        usuario_id=user_id,
                        tipo_archivo="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        numero_modelo=len(archivos_guardados) + 1,
                        total_documentos=archivo_data['filas'],
                        filas_procesadas=archivo_data['filas']
                    )
                    
                    db.add(archivo_procesado)
                    db.commit()
                    db.refresh(archivo_procesado)
                    
                    archivos_guardados.append(archivo_procesado.to_dict())
                
                logger.info(f"Modelo de ventas generado exitosamente: {len(archivos_guardados)} archivos")
                return {
                    "success": True,
                    "message": f"Modelo de ventas generado exitosamente",
                    "archivos_generados": len(archivos_guardados),
                    "archivos": archivos_guardados
                }
            else:
                raise ValueError("Script de ventas no disponible")
            
        except Exception as e:
            logger.error(f"Error generando modelo de ventas: {str(e)}")
            raise
    
    @staticmethod
    def generar_modelo_compras(
        archivo_id: int,
        user_id: int,
        nit_empresa: str,
        db: Session
    ) -> dict:
        """
        Genera modelo de compras desde archivo DIAN procesado usando tu script personalizado
        """
        try:
            logger.info(f"Generando modelo de compras para archivo {archivo_id}, usuario {user_id}")
            
            # Obtener archivo procesado
            archivo = db.query(ArchivoProcesado).filter(
                ArchivoProcesado.id == archivo_id,
                ArchivoProcesado.usuario_id == user_id
            ).first()
            
            if not archivo:
                raise ValueError("Archivo no encontrado")
            
            # Verificar si es archivo DIAN
            if es_archivo_dian and not es_archivo_dian(archivo.contenido):
                raise ValueError("El archivo no es un reporte válido de la DIAN")
            
            # Usar tu script personalizado de compras
            if procesar_compras:
                archivos_script = procesar_compras(archivo.contenido, nit_empresa)
                archivos_guardados = []
                
                # Guardar cada archivo generado en la base de datos
                for archivo_data in archivos_script:
                    archivo_procesado = ArchivoProcesado(
                        nombre_archivo=archivo_data['nombre'],
                        nombre_original=archivo_data['nombre'],
                        contenido=archivo_data['contenido'],
                        tamano_bytes=len(archivo_data['contenido']),
                        descripcion=f"Modelo de compras generado automáticamente - {archivo_data['filas']} filas",
                        estado="procesado",
                        empresa_id=archivo.empresa_id,
                        usuario_id=user_id,
                        tipo_archivo="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        numero_modelo=len(archivos_guardados) + 1,
                        total_documentos=archivo_data['filas'],
                        filas_procesadas=archivo_data['filas']
                    )
                    
                    db.add(archivo_procesado)
                    db.commit()
                    db.refresh(archivo_procesado)
                    
                    archivos_guardados.append(archivo_procesado.to_dict())
                
                logger.info(f"Modelo de compras generado exitosamente: {len(archivos_guardados)} archivos")
                return {
                    "success": True,
                    "message": f"Modelo de compras generado exitosamente",
                    "archivos_generados": len(archivos_guardados),
                    "archivos": archivos_guardados
                }
            else:
                raise ValueError("Script de compras no disponible")
            
        except Exception as e:
            logger.error(f"Error generando modelo de compras: {str(e)}")
            raise
    
    @staticmethod
    def _procesar_datos(excel_dian, parametros, tipo_modelo, user_id, db):
        """
        Procesa los datos del Excel DIAN y genera los archivos modelo
        """
        encabezados = ModeloService._get_encabezados()
        excel_modelo = pd.DataFrame(columns=encabezados)
        numero_excel = 1
        numero_fila_modelo = 0
        archivos_generados = []
        
        for numero_de_fila_dian, fila_completa_dian in excel_dian.iterrows():
            # Filtrar por NIT emisor para ventas o receptor para compras
            nit_campo = 'NIT Emisor' if tipo_modelo == 'ventas' else 'NIT Receptor'
            
            if str(fila_completa_dian.get(nit_campo, '')) == parametros["documento"]:
                valor_total = float(fila_completa_dian.get('Total', 0))
                valor_iva = float(fila_completa_dian.get('IVA', 0))
                valor_base = valor_total - valor_iva
                
                tipo_documento = str(fila_completa_dian.get('Tipo de documento', ''))
                
                if tipo_documento == 'Factura electrónica':            
                    numero_fila_modelo = ModeloService._agregar_filas_factura(
                        excel_modelo, numero_fila_modelo, fila_completa_dian, 
                        parametros, valor_base, valor_iva, valor_total, tipo_modelo
                    )
                elif tipo_documento == 'Nota de crédito electrónica':  
                    # Solo procesar si la empresa tiene configuradas notas de crédito
                    if parametros.get("tipoComprobanteNotaCredito") is None:
                        logger.warning(f"⚠️ Nota de crédito encontrada pero no configurada para la empresa. Saltando registro.")
                        continue
                        
                    numero_fila_modelo = ModeloService._agregar_filas_nota_credito(
                        excel_modelo, numero_fila_modelo, fila_completa_dian, 
                        parametros, valor_base, valor_iva, valor_total, tipo_modelo
                    )
                
                numero_fila_modelo += 1
                
                # Si llegamos a 495 filas, guardar archivo
                if numero_fila_modelo > 495:
                    archivo_generado = ModeloService._guardar_archivo_modelo(
                        excel_modelo, numero_excel, tipo_modelo, user_id, db
                    )
                    archivos_generados.append(archivo_generado)
                    numero_excel += 1
                    numero_fila_modelo = 0
                    excel_modelo = pd.DataFrame(columns=encabezados)
        
        # Guardar último archivo si hay datos
        if numero_fila_modelo > 0:
            excel_modelo = excel_modelo.fillna("")
            archivo_generado = ModeloService._guardar_archivo_modelo(
                excel_modelo, numero_excel, tipo_modelo, user_id, db
            )
            archivos_generados.append(archivo_generado)
        
        return archivos_generados
    
    @staticmethod
    def detectar_y_procesar_dian(
        archivo_id: int,
        user_id: int,
        nit_empresa: str,
        db: Session
    ) -> dict:
        """
        Detecta automáticamente si es archivo DIAN y ofrece opciones de procesamiento
        """
        try:
            logger.info(f"Detectando tipo de archivo {archivo_id} para usuario {user_id}")
            
            # Obtener archivo procesado
            archivo = db.query(ArchivoProcesado).filter(
                ArchivoProcesado.id == archivo_id,
                ArchivoProcesado.usuario_id == user_id
            ).first()
            
            if not archivo:
                raise ValueError("Archivo no encontrado")
            
            # Verificar si es archivo DIAN
            if es_archivo_dian and es_archivo_dian(archivo.contenido):
                logger.info(f"✅ Archivo {archivo_id} detectado como reporte DIAN")
                
                # Analizar contenido para dar información
                try:
                    df = pd.read_excel(io.BytesIO(archivo.contenido))
                    total_filas = len(df)
                    
                    # Contar tipos de documento
                    tipos_documento = df['Tipo de documento'].value_counts().to_dict()
                    
                    # Contar por emisor/receptor
                    emisores = df['NIT Emisor'].nunique()
                    receptores = df['NIT Receptor'].nunique()
                    
                    return {
                        "es_archivo_dian": True,
                        "total_filas": total_filas,
                        "tipos_documento": tipos_documento,
                        "total_emisores": emisores,
                        "total_receptores": receptores,
                        "puede_procesar_ventas": True,
                        "puede_procesar_compras": True,
                        "archivo_id": archivo_id,
                        "nit_empresa": nit_empresa,
                        "message": "Archivo DIAN detectado. Listo para procesar modelos de ventas y compras."
                    }
                    
                except Exception as e:
                    logger.warning(f"Error analizando contenido DIAN: {str(e)}")
                    return {
                        "es_archivo_dian": True,
                        "puede_procesar_ventas": True,
                        "puede_procesar_compras": True,
                        "archivo_id": archivo_id,
                        "nit_empresa": nit_empresa,
                        "message": "Archivo DIAN detectado. Listo para procesar."
                    }
            else:
                logger.info(f"❌ Archivo {archivo_id} NO es un reporte DIAN")
                return {
                    "es_archivo_dian": False,
                    "puede_procesar_ventas": False,
                    "puede_procesar_compras": False,
                    "message": "Este archivo no es un reporte de la DIAN."
                }
                
        except Exception as e:
            logger.error(f"Error detectando archivo DIAN: {str(e)}")
            raise
    
    @staticmethod
    def _agregar_filas_factura(excel_modelo, numero_fila, fila_dian, parametros, valor_base, valor_iva, valor_total, tipo_modelo):
        """
        Agrega filas para factura electrónica
        """
        nit_campo = 'NIT Receptor' if tipo_modelo == 'ventas' else 'NIT Emisor'
        
        # Fila base
        excel_modelo.loc[numero_fila, 'Tipo de comprobante'] = parametros["tipoComprobanteFactura"]
        excel_modelo.loc[numero_fila, 'Consecutivo comprobante'] = fila_dian.get('Folio', '')
        excel_modelo.loc[numero_fila, 'Fecha de elaboración'] = fila_dian.get('Fecha Emisión', '')
        excel_modelo.loc[numero_fila, 'Código cuenta contable'] = parametros["cuentaBase"]
        excel_modelo.loc[numero_fila, 'Identificación tercero'] = fila_dian.get(nit_campo, '')
        
        if tipo_modelo == 'ventas':
            excel_modelo.loc[numero_fila, 'Crédito'] = valor_base
        else:
            excel_modelo.loc[numero_fila, 'Débito'] = valor_base
        
        # Fila impuesto
        numero_fila += 1
        excel_modelo.loc[numero_fila, 'Tipo de comprobante'] = parametros["tipoComprobanteFactura"]
        excel_modelo.loc[numero_fila, 'Consecutivo comprobante'] = fila_dian.get('Folio', '')
        excel_modelo.loc[numero_fila, 'Fecha de elaboración'] = fila_dian.get('Fecha Emisión', '')
        excel_modelo.loc[numero_fila, 'Código cuenta contable'] = parametros["cuentaImpuesto"]
        excel_modelo.loc[numero_fila, 'Identificación tercero'] = fila_dian.get(nit_campo, '')
        
        if tipo_modelo == 'ventas':
            excel_modelo.loc[numero_fila, 'Crédito'] = valor_iva
        else:
            excel_modelo.loc[numero_fila, 'Débito'] = valor_iva
        
        # Fila total
        numero_fila += 1
        excel_modelo.loc[numero_fila, 'Tipo de comprobante'] = parametros["tipoComprobanteFactura"]
        excel_modelo.loc[numero_fila, 'Consecutivo comprobante'] = fila_dian.get('Folio', '')
        excel_modelo.loc[numero_fila, 'Fecha de elaboración'] = fila_dian.get('Fecha Emisión', '')
        excel_modelo.loc[numero_fila, 'Código cuenta contable'] = parametros["cuentaTotal"]
        excel_modelo.loc[numero_fila, 'Identificación tercero'] = fila_dian.get(nit_campo, '')
        
        if tipo_modelo == 'ventas':
            excel_modelo.loc[numero_fila, 'Débito'] = valor_total
        else:
            excel_modelo.loc[numero_fila, 'Crédito'] = valor_total
        
        return numero_fila
    
    @staticmethod
    def _agregar_filas_nota_credito(excel_modelo, numero_fila, fila_dian, parametros, valor_base, valor_iva, valor_total, tipo_modelo):
        """
        Agrega filas para nota de crédito electrónica
        """
        nit_campo = 'NIT Receptor' if tipo_modelo == 'ventas' else 'NIT Emisor'
        
        # Fila base (invertida para nota de crédito)
        excel_modelo.loc[numero_fila, 'Tipo de comprobante'] = parametros["tipoComprobanteNotaCredito"]
        excel_modelo.loc[numero_fila, 'Consecutivo comprobante'] = fila_dian.get('Folio', '')
        excel_modelo.loc[numero_fila, 'Fecha de elaboración'] = fila_dian.get('Fecha Emisión', '')
        excel_modelo.loc[numero_fila, 'Código cuenta contable'] = parametros["cuentaBase"]
        excel_modelo.loc[numero_fila, 'Identificación tercero'] = fila_dian.get(nit_campo, '')
        
        if tipo_modelo == 'ventas':
            excel_modelo.loc[numero_fila, 'Débito'] = valor_base
        else:
            excel_modelo.loc[numero_fila, 'Crédito'] = valor_base
        
        # Fila impuesto
        numero_fila += 1
        excel_modelo.loc[numero_fila, 'Tipo de comprobante'] = parametros["tipoComprobanteNotaCredito"]
        excel_modelo.loc[numero_fila, 'Consecutivo comprobante'] = fila_dian.get('Folio', '')
        excel_modelo.loc[numero_fila, 'Fecha de elaboración'] = fila_dian.get('Fecha Emisión', '')
        excel_modelo.loc[numero_fila, 'Código cuenta contable'] = parametros["cuentaImpuesto"]
        excel_modelo.loc[numero_fila, 'Identificación tercero'] = fila_dian.get(nit_campo, '')
        
        if tipo_modelo == 'ventas':
            excel_modelo.loc[numero_fila, 'Débito'] = valor_iva
        else:
            excel_modelo.loc[numero_fila, 'Crédito'] = valor_iva
        
        # Fila total
        numero_fila += 1
        excel_modelo.loc[numero_fila, 'Tipo de comprobante'] = parametros["tipoComprobanteNotaCredito"]
        excel_modelo.loc[numero_fila, 'Consecutivo comprobante'] = fila_dian.get('Folio', '')
        excel_modelo.loc[numero_fila, 'Fecha de elaboración'] = fila_dian.get('Fecha Emisión', '')
        excel_modelo.loc[numero_fila, 'Código cuenta contable'] = parametros["cuentaTotal"]
        excel_modelo.loc[numero_fila, 'Identificación tercero'] = fila_dian.get(nit_campo, '')
        
        if tipo_modelo == 'ventas':
            excel_modelo.loc[numero_fila, 'Crédito'] = valor_total
        else:
            excel_modelo.loc[numero_fila, 'Débito'] = valor_total
        
        return numero_fila
    
    @staticmethod
    def _guardar_archivo_modelo(excel_modelo, numero_excel, tipo_modelo, user_id, db):
        """
        Guarda el archivo modelo en la base de datos
        """
        # Generar archivo Excel en memoria
        buffer = io.BytesIO()
        excel_modelo.to_excel(buffer, index=False)
        buffer.seek(0)
        contenido_bytes = buffer.getvalue()
        
        # Crear nombre de archivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre_archivo = f"Modelo_{tipo_modelo}_{numero_excel}_{timestamp}.xlsx"
        
        # Guardar en base de datos
        archivo_procesado = ArchivoProcesado(
            nombre_archivo=nombre_archivo,
            nombre_original=nombre_archivo,
            contenido=contenido_bytes,
            tamano_bytes=len(contenido_bytes),
            descripcion=f"Modelo de {tipo_modelo} generado automáticamente",
            estado="procesado",
            empresa_id=1,  # ID de la empresa por defecto
            usuario_id=user_id,
            tipo_archivo="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            numero_modelo=numero_excel,
            total_documentos=len(excel_modelo),
            filas_procesadas=len(excel_modelo)
        )
        
        db.add(archivo_procesado)
        db.commit()
        db.refresh(archivo_procesado)
        
        logger.info(f"Archivo {nombre_archivo} guardado con ID: {archivo_procesado.id}")
        
        return archivo_procesado.to_dict()
