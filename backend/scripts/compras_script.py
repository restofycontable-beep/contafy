import pandas as pd
import re
import io
import json
import logging
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation, getcontext
from utils.number_utils import remove_trailing_zeros, normalize_nit

logger = logging.getLogger(__name__)

def procesar_compras(excel_dian_content, nit_empresa, excel_cuentas_content=None, configuracion_comprobantes_compras=None, registro_cuentas_factura_compra=None, registro_cuentas_nota_credito_compra=None):
    """
    Procesa archivo DIAN y genera modelo de compras
    
    LÓGICA DE COMPRAS:
    ==================
    
    REGLA PRINCIPAL: Todo documento NO emitido por la empresa = COMPRA
    - Facturas electrónicas
    - Contingencia
    - POS
    - Servicios públicos
    - Documento soporte con no obligados (AUNQUE lo emita la empresa, se registra como compra)
    
    ESTRUCTURA NORMAL (COMPRAS):
    - Cuenta 1 (51): Base Gravada = IVA ÷ 19 × 100 → DÉBITO
    - Cuenta 2 (51): Base Exenta = Total - Base Gravada - IVA → DÉBITO
    - Cuenta 3 (IVA): IVA → DÉBITO
    - Cuenta 4 (Total): Total → CRÉDITO (contrapartida proveedores)
    
    EXCEPCIÓN 1 - NOTA DE CRÉDITO (emitida por proveedor):
    - Misma estructura pero NATURALEZA CRUZADA:
    - Cuenta 1: Base Gravada → CRÉDITO
    - Cuenta 2: Base Exenta → CRÉDITO
    - Cuenta 3: IVA → CRÉDITO
    - Cuenta 4: Total → DÉBITO
    
    EXCEPCIÓN 2 - DOCUMENTO SOPORTE CON NO OBLIGADOS:
    - Aunque lo emita la empresa, se registra como COMPRA normal (estructura normal)
    
    PRIORIDAD DE CUENTAS:
    - Si NIT existe en archivo Excel: usar cuenta del Excel para cuentas 1, 2 y 3
    - Si NO existe en Excel: usar configuración de empresa
    - Cuenta 4 siempre usa configuración de empresa (contrapartida)
    """
    try:
        # Validar parámetros obligatorios
        if not nit_empresa or not str(nit_empresa).strip():
            raise Exception("❌ ERROR: NIT de empresa es obligatorio")

        if not configuracion_comprobantes_compras:
            raise Exception("❌ ERROR: Configuración de comprobantes de compras es obligatoria")

        if not registro_cuentas_factura_compra:
            raise Exception("❌ ERROR: Configuración de cuentas para facturas de compra es obligatoria")

        if not registro_cuentas_nota_credito_compra:
            raise Exception("❌ ERROR: Configuración de cuentas para notas de crédito de compra es obligatoria")

        # Validar que el archivo DIAN no esté vacío
        if not excel_dian_content or len(excel_dian_content) == 0:
            raise Exception("❌ ERROR: El archivo DIAN está vacío o no se pudo leer")
        encabezados = [
            "Tipo de comprobante", "Consecutivo comprobante", "Fecha de elaboración", "Sigla moneda",
            "Tasa de cambio", "Código cuenta contable", "Identificación tercero", "Sucursal",
            "Código producto", "Código de bodega", "Acción", "Cantidad producto", "Prefijo",
            "Consecutivo", "No. cuota", "Fecha vencimiento", "Código impuesto",
            "Código grupo activo fijo", "Código activo fijo", "Descripción",
            "Código centro/subcentro de costos", "Débito", "Crédito", "Observaciones",
            "Base gravable libro compras/ventas", "Base exenta libro compras/ventas", "Mes de cierre"
        ]

        logger.info(f"📊 ComprasScript: Iniciando procesamiento para NIT {nit_empresa}")
        logger.info(f"📊 ComprasScript: Tamaño archivo recibido: {len(excel_dian_content)} bytes")
        logger.info(f"📊 ComprasScript: Configuración de comprobantes de compras: {configuracion_comprobantes_compras}")
        logger.info(f"💰 ComprasScript: Configuración de cuentas factura compra: {registro_cuentas_factura_compra}")
        logger.info(f"💰 ComprasScript: Configuración de cuentas nota crédito compra: {registro_cuentas_nota_credito_compra}")

        # Validar y leer archivo Excel DIAN con optimización para archivos grandes
        try:
            # Para archivos grandes, usar chunks para optimizar memoria
            excelDian = pd.read_excel(io.BytesIO(excel_dian_content)).astype(str)
            if excelDian.empty:
                raise Exception("❌ ERROR: El archivo Excel DIAN está vacío")
        except Exception as e:
            raise Exception(f"❌ ERROR: No se pudo leer el archivo Excel DIAN: {str(e)}")

        # Validar columnas requeridas del archivo DIAN
        columnas_requeridas = ['NIT Emisor', 'NIT Receptor', 'Total', 'IVA', 'Tipo de documento', 'Folio', 'Fecha Emisión', 'Nombre Emisor']
        columnas_faltantes = [col for col in columnas_requeridas if col not in excelDian.columns]
        if columnas_faltantes:
            raise Exception(f"❌ ERROR: Faltan columnas requeridas en el archivo DIAN: {', '.join(columnas_faltantes)}")

        logger.info(f"📊 ComprasScript: Archivo DIAN cargado exitosamente - {len(excelDian)} registros encontrados")

        # Optimización: procesar en chunks si el archivo es muy grande (>10000 registros)
        chunk_size = 10000
        if len(excelDian) > chunk_size:
            logger.info(f"📊 ComprasScript: Archivo grande detectado ({len(excelDian)} registros). Procesando en chunks de {chunk_size} registros.")
            procesar_en_chunks = True
        else:
            procesar_en_chunks = False

        excelCuentas = None
        if excel_cuentas_content:
            try:
                excelCuentas = pd.read_excel(io.BytesIO(excel_cuentas_content))
                
                columnas_numericas = ['NIT', 'CUENTA', 'CUENTA_EXENTA', 'CUENTA_IVA', 'CUENTA_CONTRAPARTIDA']
                for col in columnas_numericas:
                    if col in excelCuentas.columns:
                        excelCuentas[col] = excelCuentas[col].apply(remove_trailing_zeros)
                
                excelCuentas = excelCuentas.astype(str)
                
                logger.info(f"Excel de cuentas cargado: {len(excelCuentas)} registros")
                if len(excelCuentas) > 0:
                    logger.info(f"Primeros NITs: {list(excelCuentas['NIT'].head(5).values)}")
            except Exception as e:
                logger.warning(f"Error cargando Excel de cuentas: {str(e)}")
                excelCuentas = None
        else:
            logger.info("No se proporcionó Excel de cuentas - usando configuración de empresa")

        excelModeloCompra = pd.DataFrame(columns=encabezados)
        numeroFilaModelo = 0
        archivos_generados = []

        # Contadores para estadísticas
        contadores = {
            'total_registros': 0,
            'facturas_procesadas': 0,
            'notas_credito_procesadas': 0,
            'notas_debito_procesadas': 0,
            'contingencia_procesadas': 0,
            'servicios_publicos_procesados': 0,
            'registros_omitidos': 0,
            'errores_calculo': 0
        }

        def almacenarFila(filaCompletaDian, tipoComprobanteFactura, cuentaContable, naturaleza, valor):
            nonlocal numeroFilaModelo
            numeroFolio = str(filaCompletaDian['Folio'])
            folioLimpio = re.sub(r'\D', '', numeroFolio)

            excelModeloCompra.loc[numeroFilaModelo, 'Tipo de comprobante'] = tipoComprobanteFactura
            excelModeloCompra.loc[numeroFilaModelo, 'Consecutivo comprobante'] = folioLimpio
            excelModeloCompra.loc[numeroFilaModelo, 'Fecha de elaboración'] = filaCompletaDian['Fecha Emisión']
            excelModeloCompra.loc[numeroFilaModelo, 'Código cuenta contable'] = cuentaContable
            excelModeloCompra.loc[numeroFilaModelo, 'Identificación tercero'] = str(int(float(filaCompletaDian['NIT Emisor'])))
            excelModeloCompra.loc[numeroFilaModelo, naturaleza] = valor
            excelModeloCompra.loc[numeroFilaModelo, 'Observaciones'] = filaCompletaDian['Tipo de documento']
            excelModeloCompra.loc[numeroFilaModelo, 'Descripción'] = filaCompletaDian['Nombre Emisor']
            # Campos vacíos para SIIGO - no llenar base gravable, base exenta ni mes de cierre
            excelModeloCompra.loc[numeroFilaModelo, 'Base gravable libro compras/ventas'] = ""
            excelModeloCompra.loc[numeroFilaModelo, 'Base exenta libro compras/ventas'] = ""
            excelModeloCompra.loc[numeroFilaModelo, 'Mes de cierre'] = ""
            numeroFilaModelo = numeroFilaModelo + 1

        def esEmisorDiferente(nit_emisor_archivo, nit_empresa_buscar, nit_empresa_sin_dv):
            """
            Verifica si el NIT emisor del archivo es diferente al NIT de la empresa que está comprando.
            En compras, queremos facturas de OTROS (emisores diferentes a nosotros).
            """
            # Normalizar ambos NITs
            nit_emisor_norm = str(nit_emisor_archivo).strip().replace('-', '').replace(' ', '').replace('.', '')
            nit_emisor_sin_dv = nit_emisor_norm[:9] if len(nit_emisor_norm) > 9 else nit_emisor_norm
            
            # Comparar con todas las variaciones del NIT de empresa
            coincide = (nit_emisor_norm == nit_empresa_buscar or
                    nit_emisor_norm == nit_empresa_sin_dv or
                    nit_emisor_sin_dv == nit_empresa_buscar or
                    nit_emisor_sin_dv == nit_empresa_sin_dv)
            
            return not coincide  # Retornar True si son DIFERENTES (es compra)

        numeroExcel = 1

        # Parametros
        documento = nit_empresa
        
        # Usar configuración de comprobantes de compras de la empresa - CADA EMPRESA DEBE CONFIGURAR LOS SUYOS
        if not configuracion_comprobantes_compras:
            raise Exception("❌ ERROR: No se ha configurado los tipos de comprobantes de compras para esta empresa. Cada empresa debe configurar sus propios tipos de comprobantes.")
        
        # Usar los códigos configurados por la empresa para compras
        factura_config = configuracion_comprobantes_compras.get('factura', {})
        nota_credito_config = configuracion_comprobantes_compras.get('nota_credito', {})
        nota_debito_config = configuracion_comprobantes_compras.get('nota_debito', {})
        
        # Obtener códigos de tipos de comprobantes (SIN valores por defecto)
        tipoComprobanteFactura = factura_config.get('codigo') if factura_config.get('codigo') else None
        tipoComprobanteNotaCredito = nota_credito_config.get('codigo') if nota_credito_config.get('codigo') else None
        tipoComprobanteNotaDebito = nota_debito_config.get('codigo') if nota_debito_config.get('codigo') else None
        
        # Validar que al menos las facturas estén configuradas (obligatorio)
        if not tipoComprobanteFactura:
            raise Exception("❌ ERROR: No se ha configurado el tipo de comprobante para facturas de compra. Cada empresa debe configurar sus propios tipos de comprobantes.")
        
        # Validar que las notas de crédito estén configuradas si se van a usar
        if not tipoComprobanteNotaCredito:
            logger.warning("⚠️ ComprasScript: No se ha configurado el tipo de comprobante para notas de crédito de compra")
        
        # Validar que las notas de débito estén configuradas si se van a usar
        if not tipoComprobanteNotaDebito:
            logger.warning("⚠️ ComprasScript: No se ha configurado el tipo de comprobante para notas de débito de compra")
        
        logger.info(f"🔧 ComprasScript: Configuración de comprobantes de compras - Factura: {tipoComprobanteFactura}, Nota Crédito: {tipoComprobanteNotaCredito}, Nota Débito: {tipoComprobanteNotaDebito}")

        # Función para obtener cuentas principales respetando el orden de configuración
        def obtener_cuentas_configuracion_principales(configuracion_cuentas, tipo_documento):
            """
            Obtiene las cuentas configuradas respetando el orden definido por la empresa:
            - Cuenta 1: BASE GRAVADA (Obligatoria)
            - Cuenta 2: BASE EXENTA (Opcional)
            - Cuenta 3: IVA (Opcional)
            - Cuenta 4: CONTRAPARTIDA (Obligatoria)
            También registra cuentas adicionales (5 a 10) para futuros usos.
            """
            resultado = {
                'base_gravada': None,
                'base_exenta': None,
                'iva': None,
                'contrapartida': None,
                'todas': []
            }

            if not configuracion_cuentas:
                logger.warning(f"⚠️ ComprasScript: No hay configuración de cuentas para {tipo_documento}")
                return resultado

            if isinstance(configuracion_cuentas, str):
                try:
                    configuracion_cuentas = json.loads(configuracion_cuentas)
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ ComprasScript: Configuración de cuentas inválida para {tipo_documento}")
                    return resultado

            logger.info(f"💰 ComprasScript: Analizando configuración específica de la empresa para {tipo_documento}...")
            logger.info(f"🔧 ComprasScript: Configuración recibida: {configuracion_cuentas}")

            def procesar_cuenta(posicion, clave_resultado, descripcion, obligatorio):
                cuenta_info = configuracion_cuentas.get(f'cuenta_{posicion}', {}) if isinstance(configuracion_cuentas, dict) else {}
                if cuenta_info.get('activo', False) and cuenta_info.get('codigo', '').strip():
                    cuenta_configurada = {
                        'codigo': cuenta_info.get('codigo', '').strip(),
                        'nombre': cuenta_info.get('nombre', ''),
                        'naturaleza': cuenta_info.get('naturaleza', '').lower() if cuenta_info.get('naturaleza') else '',
                        'posicion': posicion,
                        'descripcion': descripcion
                    }
                    resultado[clave_resultado] = cuenta_configurada
                    resultado['todas'].append(cuenta_configurada)
                    logger.info(f"✅ ComprasScript: Cuenta {posicion} ({descripcion}) configurada: {cuenta_configurada['codigo']} - {cuenta_configurada['nombre']}")
                else:
                    mensaje = f"⚠️ ComprasScript: Cuenta {posicion} ({descripcion}) no configurada"
                    if obligatorio:
                        raise Exception(f"❌ ERROR: {mensaje}. Es obligatoria para {tipo_documento}.")
                    logger.warning(mensaje + " (opcional)")

            procesar_cuenta(1, 'base_gravada', 'BASE GRAVADA', obligatorio=True)
            procesar_cuenta(2, 'base_exenta', 'BASE EXENTA', obligatorio=False)
            procesar_cuenta(3, 'iva', 'IVA', obligatorio=False)
            procesar_cuenta(4, 'contrapartida', 'CONTRAPARTIDA', obligatorio=True)

            for posicion in range(5, 11):
                cuenta_info = configuracion_cuentas.get(f'cuenta_{posicion}', {}) if isinstance(configuracion_cuentas, dict) else {}
                if cuenta_info.get('activo', False) and cuenta_info.get('codigo', '').strip():
                    cuenta_extra = {
                        'codigo': cuenta_info.get('codigo', '').strip(),
                        'nombre': cuenta_info.get('nombre', ''),
                        'naturaleza': cuenta_info.get('naturaleza', '').lower() if cuenta_info.get('naturaleza') else '',
                        'posicion': posicion,
                        'descripcion': f"Cuenta adicional {posicion}"
                    }
                    resultado['todas'].append(cuenta_extra)
                    logger.info(f"ℹ️ ComprasScript: Cuenta adicional {posicion} configurada: {cuenta_extra['codigo']} - {cuenta_extra['nombre']}")

            logger.info(f"💰 ComprasScript: Resumen cuentas {tipo_documento}:")
            logger.info(f"  - Base Gravada (Cuenta 1): {resultado['base_gravada']['codigo'] if resultado['base_gravada'] else 'NO CONFIGURADA'}")
            logger.info(f"  - Base Exenta (Cuenta 2): {resultado['base_exenta']['codigo'] if resultado['base_exenta'] else 'NO CONFIGURADA'}")
            logger.info(f"  - IVA (Cuenta 3): {resultado['iva']['codigo'] if resultado['iva'] else 'NO CONFIGURADA'}")
            logger.info(f"  - Contrapartida (Cuenta 4): {resultado['contrapartida']['codigo'] if resultado['contrapartida'] else 'NO CONFIGURADA'}")

            return resultado

        # Función para buscar cuenta en archivo de cuentas (PRIORIDAD MÁXIMA)
        def buscar_cuenta_en_archivo(nit_emisor, excel_cuentas):
            """
            Busca cuentas específicas para un NIT en el archivo de cuentas.
            Esta es la PRIORIDAD MÁXIMA - si existe archivo Excel, se usa SIEMPRE.
            
            Excel tiene 6 columnas: NIT, NOMBRE, CUENTA, CUENTA_EXENTA, CUENTA_IVA, CUENTA_CONTRAPARTIDA
            Retorna: (cuenta_gravada, cuenta_exenta, cuenta_iva, cuenta_contrapartida, nit_encontrado)
            nit_encontrado=True si el NIT está en Excel (incluso si las cuentas están vacías)
            """
            if excel_cuentas is None or excel_cuentas.empty:
                return None, None, None, None, False

            nit_emisor_norm = normalize_nit(nit_emisor)
            logger.info(f"Buscando NIT '{nit_emisor_norm}' en Excel ({len(excel_cuentas)} registros)")

            for _, fila_cuentas in excel_cuentas.iterrows():
                nit_archivo_norm = normalize_nit(fila_cuentas['NIT'])

                if nit_archivo_norm == nit_emisor_norm:
                    cuenta_gravada = fila_cuentas.get('CUENTA', None)
                    cuenta_exenta = fila_cuentas.get('CUENTA_EXENTA', None)
                    cuenta_iva = fila_cuentas.get('CUENTA_IVA', None)
                    cuenta_contrapartida = fila_cuentas.get('CUENTA_CONTRAPARTIDA', None)

                    def limpiar_valor(val):
                        if val and str(val).strip() not in ['', 'nan', 'None']:
                            return str(val).strip()
                        return None

                    cuenta_gravada = limpiar_valor(cuenta_gravada)
                    cuenta_exenta = limpiar_valor(cuenta_exenta)
                    cuenta_iva = limpiar_valor(cuenta_iva)
                    cuenta_contrapartida = limpiar_valor(cuenta_contrapartida)

                    logger.info(f"✅ NIT {nit_emisor} ENCONTRADO en Excel")
                    logger.info(f"   → Cuenta GRAVADA (Excel): {cuenta_gravada or 'vacía - usar config'}")
                    logger.info(f"   → Cuenta EXENTA (Excel): {cuenta_exenta or 'vacía - usar config'}")
                    logger.info(f"   → Cuenta IVA (Excel): {cuenta_iva or 'vacía - usar config'}")
                    logger.info(f"   → Cuenta CONTRAPARTIDA (Excel): {cuenta_contrapartida or 'vacía - usar config'}")
                    return cuenta_gravada, cuenta_exenta, cuenta_iva, cuenta_contrapartida, True
            
            logger.warning(f"NIT '{nit_emisor_norm}' no encontrado en Excel - usando configuración de empresa")
            return None, None, None, None, False

        # Función para obtener cuenta de gastos con prioridades CORREGIDAS
        def obtener_cuenta_gastos(nit_emisor, excel_cuentas, cuentas_disponibles):
            """
            Obtiene la cuenta de gastos usando la siguiente prioridad:
            1. ARCHIVO EXCEL DE CUENTAS (PRIORIDAD MÁXIMA) - Si existe archivo, se usa SIEMPRE
            2. Configuración de la empresa (solo si NO hay archivo Excel)
            
            SIEMPRE retorna una cuenta, incluso si no está configurada (usar primera disponible o "NO_CONFIGURADA")
            """
            # PRIMERO: Buscar en archivo de cuentas (PRIORIDAD MÁXIMA)
            cuenta_seleccionada = buscar_cuenta_en_archivo(nit_emisor, excel_cuentas)

            if cuenta_seleccionada:
                logger.info(f"📁 ComprasScript: PRIORIDAD ARCHIVO EXCEL - Usando cuenta del archivo para NIT {nit_emisor}: {cuenta_seleccionada}")
                return cuenta_seleccionada

            # SEGUNDO: Solo si NO hay archivo Excel, usar configuración de empresa
            if excel_cuentas is None or excel_cuentas.empty:
                cuenta_seleccionada = seleccionar_cuenta_inteligente(nit_emisor, cuentas_disponibles, "gastos")
                if cuenta_seleccionada:
                    logger.info(f"🏢 ComprasScript: SIN ARCHIVO EXCEL - Usando configuración de empresa para NIT {nit_emisor}: {cuenta_seleccionada}")
                    return cuenta_seleccionada

            # TERCERO: Si no hay cuenta configurada, usar primera disponible o "NO_CONFIGURADA"
            if cuentas_disponibles and len(cuentas_disponibles) > 0:
                cuenta_seleccionada = cuentas_disponibles[0]
                logger.warning(f"⚠️ ComprasScript: NIT {nit_emisor} no encontrado en archivo Excel. Usando primera cuenta disponible: {cuenta_seleccionada}")
                return cuenta_seleccionada
            else:
                logger.warning(f"⚠️ ComprasScript: NIT {nit_emisor} no encontrado y no hay cuentas configuradas. Usando 'NO_CONFIGURADA'")
                return "NO_CONFIGURADA"

        # Función para calcular valores contables con estructura CORREGIDA
        def _parse_decimal(valor):
            """
            Convierte valores provenientes del Excel (que vienen como string)
            a Decimal, limpiando caracteres comunes en exportaciones.
            """
            if valor is None:
                return Decimal('0')

            texto = str(valor).strip()
            if texto == "" or texto.lower() in ("nan", "none"):
                return Decimal('0')

            texto = texto.replace(" ", "").replace(",", "")

            try:
                return Decimal(texto)
            except InvalidOperation:
                logger.warning(f"⚠️ ComprasScript: Valor no numérico detectado '{valor}'. Usando 0.")
                return Decimal('0')

        def calcular_valores_contables(fila_dian, numero_fila):
            """
            Calcula los valores contables con la estructura correcta:
            - Cuenta 1 (Gravada): Base gravable = IVA ÷ 19 × 100 (SI IVA > 0, sino = 0)
            - Cuenta 2 (No gravada): Base exenta (sin IVA)
            - Cuenta 3 (Impuesto): IVA
            - Cuenta 4 (Forma de pago): Total
            
            SIEMPRE retorna las 4 cuentas, incluso si están vacías (valor 0)
            GARANTIZA que: Base Gravable + Base Exenta + IVA = Total
            """
            try:
                getcontext().prec = 28

                valor_total_decimal = _parse_decimal(fila_dian['Total'])
                valor_iva_decimal = _parse_decimal(fila_dian['IVA'])

                # Validar que los valores sean positivos
                if valor_total_decimal < 0 or valor_iva_decimal < 0:
                    logger.warning(f"⚠️ ComprasScript: Valores negativos encontrados en fila {numero_fila}. Usando valores en 0.")
                    valor_total = Decimal('0')
                    valor_iva = Decimal('0')
                    valor_base_gravada = Decimal('0')
                    valor_base_exenta = Decimal('0')
                else:
                    if valor_iva_decimal > 0:
                        valor_base_gravada = (valor_iva_decimal / Decimal('0.19')).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
                    else:
                        valor_base_gravada = Decimal('0')

                    valor_total = valor_total_decimal.quantize(Decimal('1'), rounding=ROUND_HALF_UP)
                    valor_iva = valor_iva_decimal.quantize(Decimal('1'), rounding=ROUND_HALF_UP)
                    valor_base_exenta = (valor_total - valor_base_gravada - valor_iva).quantize(Decimal('1'), rounding=ROUND_HALF_UP)

                    if valor_base_gravada < 0:
                        valor_base_gravada = Decimal('0')
                    if valor_base_exenta < 0:
                        valor_base_exenta = Decimal('0')

                suma_final = valor_base_gravada + valor_base_exenta + valor_iva
                diferencia = suma_final - valor_total

                if diferencia != 0:
                    logger.warning(f"⚠️ ComprasScript: Ajustando diferencia de {diferencia} en fila {numero_fila} para balancear débitos/créditos.")
                    valor_base_exenta -= diferencia
                    if valor_base_exenta < 0:
                        valor_base_gravada += valor_base_exenta
                        valor_base_exenta = Decimal('0')
                        if valor_base_gravada < 0:
                            valor_base_gravada = Decimal('0')

                valor_total = int(valor_total)
                valor_iva = int(valor_iva)
                valor_base_gravada = int(valor_base_gravada)
                valor_base_exenta = int(valor_base_exenta)

                suma_final = valor_base_gravada + valor_base_exenta + valor_iva
                if suma_final != valor_total:
                    logger.error(f"⚠️ ComprasScript: ERROR - Suma final no coincide tras ajuste: {suma_final} vs {valor_total}")

                logger.info(f"💰 ComprasScript: Cálculos contables - Total: {valor_total}, IVA: {valor_iva}, Base Gravable: {valor_base_gravada}, Base Exenta: {valor_base_exenta}")
                logger.info(f"💰 ComprasScript: Verificación suma: {valor_base_gravada} + {valor_base_exenta} + {valor_iva} = {suma_final} (Total: {valor_total})")

                return {
                    'total': valor_total,           # Cuenta 4 (Forma de pago) - SIN DECIMALES
                    'iva': valor_iva,               # Cuenta 3 (Impuesto) - SIN DECIMALES
                    'base_gravada': valor_base_gravada,  # Cuenta 1 (Gravada) - SIN DECIMALES
                    'base_exenta': valor_base_exenta      # Cuenta 2 (No gravada) - SIN DECIMALES
                }

            except (ValueError, TypeError) as e:
                logger.warning(f"⚠️ ComprasScript: Error procesando valores numéricos en fila {numero_fila}: {str(e)}. Usando valores en 0.")
                return {
                    'total': 0,
                    'iva': 0,
                    'base_gravada': 0,
                    'base_exenta': 0
                }

        # Obtener cuentas para facturas de compra respetando el orden configurado
        cuentas_factura_config = obtener_cuentas_configuracion_principales(
            registro_cuentas_factura_compra, "factura de compra"
        )
        cuentaGravadaFactura = cuentas_factura_config['base_gravada']['codigo'] if cuentas_factura_config['base_gravada'] else None
        cuentaExentaFactura = cuentas_factura_config['base_exenta']['codigo'] if cuentas_factura_config['base_exenta'] else None
        cuentaImpuestoFactura = cuentas_factura_config['iva']['codigo'] if cuentas_factura_config['iva'] else None
        cuentaTotalFactura = cuentas_factura_config['contrapartida']['codigo'] if cuentas_factura_config['contrapartida'] else None

        # Obtener cuentas para notas de crédito de compra respetando el orden configurado
        cuentas_nota_credito_config = obtener_cuentas_configuracion_principales(
            registro_cuentas_nota_credito_compra, "nota crédito de compra"
        )
        cuentaGravadaNotaCredito = cuentas_nota_credito_config['base_gravada']['codigo'] if cuentas_nota_credito_config['base_gravada'] else None
        cuentaExentaNotaCredito = cuentas_nota_credito_config['base_exenta']['codigo'] if cuentas_nota_credito_config['base_exenta'] else None
        cuentaImpuestoNotaCredito = cuentas_nota_credito_config['iva']['codigo'] if cuentas_nota_credito_config['iva'] else None
        cuentaTotalNotaCredito = cuentas_nota_credito_config['contrapartida']['codigo'] if cuentas_nota_credito_config['contrapartida'] else None

        # Validar cuentas obligatorias para facturas
        if not cuentaGravadaFactura:
            raise Exception("❌ ERROR: No se ha configurado la Cuenta 1 (Base Gravada) para facturas de compra.")
        if not cuentaTotalFactura:
            raise Exception("❌ ERROR: No se ha configurado la Cuenta 4 (Contrapartida) para facturas de compra.")

        if not cuentaExentaFactura:
            logger.warning("⚠️ ADVERTENCIA: Cuenta 2 (Base Exenta) no configurada. Se reutilizará la cuenta de base gravada cuando sea necesario.")

        if not cuentaImpuestoFactura:
            logger.warning("⚠️ ADVERTENCIA: No se ha configurado cuenta de IVA descontable para facturas de compra. Los registros con IVA se registrarán en la misma cuenta de base gravada.")

        logger.info(f"💰 ComprasScript: Cuentas FINALES para FACTURAS - Base Gravada: {cuentaGravadaFactura}, Base Exenta: {cuentaExentaFactura or cuentaGravadaFactura}, IVA: {cuentaImpuestoFactura or cuentaGravadaFactura}, Contrapartida: {cuentaTotalFactura}")
        logger.info(f"💰 ComprasScript: Cuentas FINALES para NOTAS CRÉDITO - Base Gravada: {cuentaGravadaNotaCredito}, Base Exenta: {cuentaExentaNotaCredito or cuentaGravadaNotaCredito}, IVA: {cuentaImpuestoNotaCredito or cuentaGravadaNotaCredito}, Contrapartida: {cuentaTotalNotaCredito or cuentaTotalFactura}")

        # Normalizar NIT a buscar (quitar espacios, guiones, puntos)
        nit_buscar = str(documento).strip().replace('-', '').replace(' ', '').replace('.', '')

        # También preparar versión sin dígito de verificación (primeros 9 dígitos)
        nit_buscar_sin_dv = nit_buscar[:9] if len(nit_buscar) > 9 else nit_buscar

        logger.info(f"🔍 ComprasScript: NIT original recibido: '{documento}'")
        logger.info(f"🔍 ComprasScript: NIT normalizado a buscar: '{nit_buscar}'")
        logger.info(f"🔍 ComprasScript: NIT sin dígito verificación: '{nit_buscar_sin_dv}'")

        # Función para verificar sumas iguales de débitos y créditos
        def verificar_sumas_iguales(df):
            """
            Verifica que las sumas de débitos y créditos sean iguales en el DataFrame
            """
            try:
                # Convertir columnas de débito y crédito a numérico, reemplazando valores no numéricos con 0
                df['Débito'] = pd.to_numeric(df['Débito'], errors='coerce').fillna(0)
                df['Crédito'] = pd.to_numeric(df['Crédito'], errors='coerce').fillna(0)

                suma_debitos = df['Débito'].sum()
                suma_creditos = df['Crédito'].sum()
                diferencia = abs(suma_debitos - suma_creditos)

                logger.info(f"💰 ComprasScript: Verificación de sumas - Débitos: {suma_debitos}, Créditos: {suma_creditos}")
                logger.info(f"💰 ComprasScript: Diferencia: {diferencia}")

                # Mostrar detalles de las filas para debugging
                if diferencia > 0.01:
                    logger.warning(f"⚠️ ComprasScript: ADVERTENCIA - Las sumas no son iguales. Diferencia: {diferencia}")
                    logger.info(f"📊 ComprasScript: Detalles de filas con valores:")
                    for idx, row in df.iterrows():
                        if row['Débito'] != 0 or row['Crédito'] != 0:
                            logger.info(f"   Fila {idx}: Débito={row['Débito']}, Crédito={row['Crédito']}, Cuenta={row.get('Código cuenta contable', 'N/A')}")
                    return False
                else:
                    logger.info(f"✅ ComprasScript: Las sumas son iguales. Balance correcto.")
                    return True
            except Exception as e:
                logger.warning(f"⚠️ ComprasScript: Error verificando sumas: {str(e)}")
                return False

        # Procesar archivo (con optimización para archivos grandes)
        for numeroDeFilaDian, filaCompletaDian in excelDian.iterrows():
            contadores['total_registros'] += 1

            tipo_documento = str(filaCompletaDian['Tipo de documento'])

            # Debug: mostrar comparación de NITs para los primeros registros
            if numeroDeFilaDian < 5:  # Solo mostrar los primeros 5 registros
                nit_emisor = str(filaCompletaDian['NIT Emisor']).strip().replace('-', '').replace(' ', '').replace('.', '')
                es_diferente = esEmisorDiferente(filaCompletaDian['NIT Emisor'], nit_buscar, nit_buscar_sin_dv)
                logger.debug(f"🔍 Fila {numeroDeFilaDian}: NIT Emisor='{nit_emisor}' vs NIT Empresa='{nit_buscar}' -> Es Diferente: {es_diferente}, Tipo: '{tipo_documento}'")

            # Mostrar progreso para archivos grandes
            if procesar_en_chunks and numeroDeFilaDian % 1000 == 0:
                logger.info(f"📊 ComprasScript: Procesando registro {numeroDeFilaDian + 1} de {len(excelDian)}")

            # EXCEPCIÓN 2: Documento soporte con no obligados a facturar (aunque lo emita la empresa, es COMPRA)
            es_documento_soporte = tipo_documento == 'Documento soporte con no obligados a facturar'

            # Determinar si es COMPRA: emisor diferente O documento soporte
            # REGLA: Documento soporte SIEMPRE es compra, aunque lo emita la empresa
            es_compra = esEmisorDiferente(filaCompletaDian['NIT Emisor'], nit_buscar, nit_buscar_sin_dv) or es_documento_soporte

            # Debug específico para documento soporte
            if es_documento_soporte:
                logger.info(f"📋 ComprasScript: DOCUMENTO SOPORTE detectado - NIT Emisor: {filaCompletaDian['NIT Emisor']}, NIT Empresa: {nit_buscar} -> SIEMPRE es COMPRA")

            # REGLA PRINCIPAL: Todo documento NO emitido por la empresa (O documento soporte) = COMPRA
            # Tipos de documentos que se procesan como COMPRA:
            tipos_compra = [
                'Factura electrónica',
                'Factura electrónica de contingencia',
                'Documento equivalente - Servicios públicos domiciliarios',
                'Documento soporte con no obligados a facturar'
            ]

            # Procesar documentos de COMPRA
            if tipo_documento in tipos_compra:
                # COMPRA si: emisor diferente O es documento soporte
                if es_compra:
                    # Cálculos contables
                    valores = calcular_valores_contables(filaCompletaDian, numeroDeFilaDian)

                    valorTotalCompra = valores['total']
                    valorIvaCompra = valores['iva']
                    valorBaseGravadaCompra = valores['base_gravada']
                    valorBaseExentaCompra = valores['base_exenta']

                    logger.info(f"💰 ComprasScript: Valores calculados - Total: {valorTotalCompra}, IVA: {valorIvaCompra}, Base Gravable: {valorBaseGravadaCompra}, Base Exenta: {valorBaseExentaCompra}")

                    # Si existe Excel de cuentas, buscar cuentas específicas para este proveedor
                    cuenta_gravada_excel, cuenta_exenta_excel, cuenta_iva_excel, cuenta_contrapartida_excel, nit_encontrado_excel = buscar_cuenta_en_archivo(filaCompletaDian['NIT Emisor'], excelCuentas)

                    # PRIORIDAD: Si el NIT está en Excel, SIEMPRE usar Excel (incluso si las cuentas están vacías)
                    if nit_encontrado_excel:
                        logger.info(f"📁 EXCEL - NIT {filaCompletaDian['NIT Emisor']} encontrado en Excel - USANDO EXCEL COMO PRIORIDAD")

                        # Cuenta 1 (Base Gravada): Excel o Config
                        cuenta_1_gastos = cuenta_gravada_excel if cuenta_gravada_excel else (cuentaGravadaFactura if cuentaGravadaFactura else "NO_CONFIGURADA")

                        # Cuenta 2 (Base Exenta): Excel o Configuración
                        cuenta_2_gastos = cuenta_exenta_excel if cuenta_exenta_excel else (cuentaExentaFactura if cuentaExentaFactura else cuenta_1_gastos)

                        # Cuenta 3 (IVA): Excel o Config
                        cuenta_3_iva = cuenta_iva_excel if cuenta_iva_excel else (cuentaImpuestoFactura if cuentaImpuestoFactura else cuenta_1_gastos)

                        # Cuenta 4 (Total): Excel o Config
                        cuenta_4_total = cuenta_contrapartida_excel if cuenta_contrapartida_excel else (cuentaTotalFactura if cuentaTotalFactura else cuenta_1_gastos)

                        logger.info(f"   → Cuenta 1 (Gravada): {cuenta_1_gastos} {'(Excel)' if cuenta_gravada_excel else '(Config)'}")
                        logger.info(f"   → Cuenta 2 (Exenta): {cuenta_2_gastos} {'(Excel)' if cuenta_exenta_excel else '(Config)'}")
                        logger.info(f"   → Cuenta 3 (IVA): {cuenta_3_iva} {'(Excel)' if cuenta_iva_excel else '(Config)'}")
                        logger.info(f"   → Cuenta 4 (Total): {cuenta_4_total} {'(Excel)' if cuenta_contrapartida_excel else '(Config)'}")
                    else:
                        logger.info(f"🏢 CONFIG - NIT {filaCompletaDian['NIT Emisor']} NO en Excel - usando configuración de empresa")
                        cuenta_1_gastos = cuentaGravadaFactura if cuentaGravadaFactura else "NO_CONFIGURADA"
                        cuenta_2_gastos = cuentaExentaFactura if cuentaExentaFactura else (cuentaGravadaFactura if cuentaGravadaFactura else "NO_CONFIGURADA")
                        cuenta_3_iva = cuentaImpuestoFactura if cuentaImpuestoFactura else cuenta_1_gastos
                        cuenta_4_total = cuentaTotalFactura if cuentaTotalFactura else cuenta_1_gastos
                        logger.info(f"   → Cuentas: 1={cuenta_1_gastos}, 2={cuenta_2_gastos}, 3={cuenta_3_iva}, 4={cuenta_4_total}")

                    # ESTRUCTURA DE COMPRAS (DÉBITO/CRÉDITO):
                    # Cuenta 1 (51): Base Gravada → DÉBITO
                    almacenarFila(filaCompletaDian, tipoComprobanteFactura, cuenta_1_gastos, 'Débito', valorBaseGravadaCompra)

                    # Cuenta 2 (51): Base Exenta → DÉBITO
                    almacenarFila(filaCompletaDian, tipoComprobanteFactura, cuenta_2_gastos, 'Débito', valorBaseExentaCompra)

                    # Cuenta 3 (IVA): IVA → DÉBITO
                    almacenarFila(filaCompletaDian, tipoComprobanteFactura, cuenta_3_iva, 'Débito', valorIvaCompra)

                    # Cuenta 4 (Total): Total → CRÉDITO (contrapartida)
                    almacenarFila(filaCompletaDian, tipoComprobanteFactura, cuenta_4_total, 'Crédito', valorTotalCompra)

                    contadores['facturas_procesadas'] += 1

            # EXCEPCIÓN 1: Nota de crédito electrónica emitida por OTRO (no la empresa)
            # Misma configuración pero con naturaleza CRUZADA usando configuración de empresa
            if tipo_documento == 'Nota de crédito electrónica':
                # Solo procesar si la empresa tiene configuradas notas de crédito
                if tipoComprobanteNotaCredito is None:
                    logger.warning(f"⚠️ ComprasScript: Nota de crédito encontrada pero no configurada para la empresa. Saltando registro.")
                    continue

                # Solo procesar si el emisor es DIFERENTE a la empresa
                if esEmisorDiferente(filaCompletaDian['NIT Emisor'], nit_buscar, nit_buscar_sin_dv):
                    logger.info(f"📋 ComprasScript: NOTA CRÉDITO de proveedor detectada - Usando configuración de empresa con naturaleza invertida")
                    # Cálculos contables
                    valores = calcular_valores_contables(filaCompletaDian, numeroDeFilaDian)

                    valorTotalCompra = valores['total']
                    valorIvaCompra = valores['iva']
                    valorBaseGravadaCompra = valores['base_gravada']
                    valorBaseExentaCompra = valores['base_exenta']

                    logger.info(f"💰 ComprasScript: NC - Valores calculados - Total: {valorTotalCompra}, IVA: {valorIvaCompra}, Base Gravable: {valorBaseGravadaCompra}, Base Exenta: {valorBaseExentaCompra}")

                    # Si existe Excel de cuentas, buscar cuentas específicas para este proveedor
                    cuenta_gravada_excel, cuenta_exenta_excel, cuenta_iva_excel, cuenta_contrapartida_excel, nit_encontrado_excel = buscar_cuenta_en_archivo(filaCompletaDian['NIT Emisor'], excelCuentas)

                    # NOTA CRÉDITO: Prioridad Excel > Config Nota Crédito > Config Factura
                    if nit_encontrado_excel:
                        logger.info(f"📁 NC EXCEL - NIT {filaCompletaDian['NIT Emisor']} encontrado en Excel - USANDO EXCEL COMO PRIORIDAD")

                        # Cuenta 1 (Base Gravada): Excel o Config Nota Crédito o Config Factura
                        cuenta_1_gastos = cuenta_gravada_excel if cuenta_gravada_excel else (cuentaGravadaNotaCredito if cuentaGravadaNotaCredito else (cuentaGravadaFactura if cuentaGravadaFactura else "NO_CONFIGURADA"))

                        # Cuenta 2 (Base Exenta): Excel o Configuración
                        cuenta_2_gastos = cuenta_exenta_excel if cuenta_exenta_excel else (cuentaExentaNotaCredito if cuentaExentaNotaCredito else (cuentaExentaFactura if cuentaExentaFactura else cuenta_1_gastos))

                        # Cuenta 3 (IVA): Excel o Config Nota Crédito o Config Factura
                        cuenta_3_iva = cuenta_iva_excel if cuenta_iva_excel else (cuentaImpuestoNotaCredito if cuentaImpuestoNotaCredito else (cuentaImpuestoFactura if cuentaImpuestoFactura else cuenta_1_gastos))

                        # Cuenta 4 (Total): Excel o Config Nota Crédito o Config Factura
                        cuenta_4_total = cuenta_contrapartida_excel if cuenta_contrapartida_excel else (cuentaTotalNotaCredito if cuentaTotalNotaCredito else (cuentaTotalFactura if cuentaTotalFactura else cuenta_1_gastos))

                        logger.info(f"   → Cuenta 1 (Gravada): {cuenta_1_gastos} {'(Excel)' if cuenta_gravada_excel else '(Config NC)' if cuentaGravadaNotaCredito else '(Config Fact)'}")
                        logger.info(f"   → Cuenta 2 (Exenta): {cuenta_2_gastos} {'(Excel)' if cuenta_exenta_excel else '(Config)'}")
                        logger.info(f"   → Cuenta 3 (IVA): {cuenta_3_iva} {'(Excel)' if cuenta_iva_excel else '(Config NC)' if cuentaImpuestoNotaCredito else '(Config Fact)'}")
                        logger.info(f"   → Cuenta 4 (Total): {cuenta_4_total} {'(Excel)' if cuenta_contrapartida_excel else '(Config NC)' if cuentaTotalNotaCredito else '(Config Fact)'}")
                    else:
                        logger.info(f"🏢 NC CONFIG - NIT {filaCompletaDian['NIT Emisor']} NO en Excel - usando configuración de empresa")
                        cuenta_1_gastos = cuentaGravadaNotaCredito if cuentaGravadaNotaCredito else (cuentaGravadaFactura if cuentaGravadaFactura else "NO_CONFIGURADA")
                        cuenta_2_gastos = cuentaExentaNotaCredito if cuentaExentaNotaCredito else (cuentaExentaFactura if cuentaExentaFactura else cuenta_1_gastos)
                        cuenta_3_iva = cuentaImpuestoNotaCredito if cuentaImpuestoNotaCredito else (cuentaImpuestoFactura if cuentaImpuestoFactura else cuenta_1_gastos)
                        cuenta_4_total = cuentaTotalNotaCredito if cuentaTotalNotaCredito else (cuentaTotalFactura if cuentaTotalFactura else cuenta_1_gastos)
                        logger.info(f"   → Cuentas NC: 1={cuenta_1_gastos}, 2={cuenta_2_gastos}, 3={cuenta_3_iva}, 4={cuenta_4_total}")

                    # NOTA DE CRÉDITO: Naturaleza CRUZADA (invertir débito/crédito)
                    # Cuenta 1: Base Gravada → CRÉDITO (inverso)
                    almacenarFila(filaCompletaDian, tipoComprobanteNotaCredito, cuenta_1_gastos, 'Crédito', valorBaseGravadaCompra)

                    # Cuenta 2: Base Exenta → CRÉDITO (inverso)
                    almacenarFila(filaCompletaDian, tipoComprobanteNotaCredito, cuenta_2_gastos, 'Crédito', valorBaseExentaCompra)

                    # Cuenta 3: IVA → CRÉDITO (inverso)
                    almacenarFila(filaCompletaDian, tipoComprobanteNotaCredito, cuenta_3_iva, 'Crédito', valorIvaCompra)

                    # Cuenta 4: Total → DÉBITO (inverso)
                    almacenarFila(filaCompletaDian, tipoComprobanteNotaCredito, cuenta_4_total, 'Débito', valorTotalCompra)

                    contadores['notas_credito_procesadas'] += 1

            # Optimización: dividir archivo cuando se alcance el límite de filas
            if(numeroFilaModelo >= 494):  # Límite de Siigo: máximo 495 líneas totales (494 datos + 1 encabezado)
                # Verificar que las sumas sean iguales antes de guardar
                verificar_sumas_iguales(excelModeloCompra)

                # Guardar archivo en memoria
                buffer = io.BytesIO()
                excelModeloCompra.to_excel(buffer, index=False)
                buffer.seek(0)

                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                nombre_archivo = f"ModeloCompra-{numeroExcel}_{timestamp}.xlsx"

                archivos_generados.append({
                    'nombre': nombre_archivo,
                    'contenido': buffer.getvalue(),
                    'filas': len(excelModeloCompra)
                })

                logger.info(f"📁 ComprasScript: Archivo {numeroExcel} generado con {len(excelModeloCompra)} filas")

                numeroExcel = numeroExcel + 1
                numeroFilaModelo = 0
                excelModeloCompra = pd.DataFrame(columns=encabezados)

        # Guardar último archivo si hay datos
        if(numeroFilaModelo > 0):
            excelModeloCompra = excelModeloCompra.fillna("")

            # Verificar que las sumas sean iguales antes de guardar
            verificar_sumas_iguales(excelModeloCompra)

            buffer = io.BytesIO()
            excelModeloCompra.to_excel(buffer, index=False)
            buffer.seek(0)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            nombre_archivo = f"ModeloCompra-{numeroExcel}_{timestamp}.xlsx"

            archivos_generados.append({
                'nombre': nombre_archivo,
                'contenido': buffer.getvalue(),
                'filas': len(excelModeloCompra)
            })

        # Mostrar resumen de estadísticas
        logger.info(f"\n📊 RESUMEN DE PROCESAMIENTO:")
        logger.info(f"   Total de registros analizados: {contadores['total_registros']}")
        logger.info(f"   Facturas procesadas: {contadores['facturas_procesadas']}")
        logger.info(f"   Notas de crédito procesadas: {contadores['notas_credito_procesadas']}")
        logger.info(f"   Notas de débito procesadas: {contadores['notas_debito_procesadas']}")
        logger.info(f"   Facturas de contingencia procesadas: {contadores['contingencia_procesadas']}")
        logger.info(f"   Servicios públicos procesados: {contadores['servicios_publicos_procesados']}")
        logger.info(f"   Archivos generados: {len(archivos_generados)}")

        return archivos_generados

    except Exception as e:
        raise Exception(f"Error procesando compras: {str(e)}")

def es_archivo_dian(excel_content):
    """
    Detecta si el archivo Excel es un reporte de la DIAN
    """
    try:
        df = pd.read_excel(io.BytesIO(excel_content))
        columnas_dian = ['NIT Emisor', 'NIT Receptor', 'Total', 'IVA', 'Tipo de documento', 'Folio', 'Fecha Emisión']
        return all(col in df.columns for col in columnas_dian)
    except Exception:
        return False