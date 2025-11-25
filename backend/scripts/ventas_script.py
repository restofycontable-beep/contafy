import pandas as pd
import re
import io
from datetime import datetime

def procesar_ventas(excel_dian_content, nit_empresa, configuracion_comprobantes=None, registro_cuentas_factura_venta=None, registro_cuentas_nota_credito=None):
    """
    Procesa archivo DIAN y genera modelo de ventas
    Lógica simplificada con 4 cuentas principales:
    - Cuenta 1: BASE NO GRAVADA (Obligatoria) - Si IVA configurado: Total - IVA, si NO: valor total DIAN
    - Cuenta 2: BASE GRAVADA (Opcional) - Solo si IVA está configurado: IVA/19*100
    - Cuenta 3: IVA (Opcional) - Solo si está configurado, valor del IVA sin decimales
    - Cuenta 4: CONTRAPARTIDA (Obligatoria) - Clientes, bancos, efectivo, etc. - Valor total sin decimales
    
    LÓGICA DE CÁLCULO:
    - Si IVA configurado: Base no gravada = Total - IVA, Base gravada = IVA/19*100
    - Si IVA NO configurado: Base no gravada = Total DIAN, Base gravada = 0, IVA = 0
    
    FORMATO DE VALORES:
    - Base no gravada: sin decimales
    - Base gravada: sin decimales  
    - IVA: sin decimales
    - Contrapartida: sin decimales
    
    Los tipos de comprobantes pueden tener códigos duplicados (ej: 20, 20, 20)
    """
    try:
        # Validar parámetros obligatorios
        if not nit_empresa:
            raise Exception("❌ ERROR: NIT de empresa es obligatorio")
        
        if not configuracion_comprobantes:
            raise Exception("❌ ERROR: Configuración de comprobantes es obligatoria")
        
        if not registro_cuentas_factura_venta:
            raise Exception("❌ ERROR: Configuración de cuentas para facturas de venta es obligatoria")
        
        if not registro_cuentas_nota_credito:
            raise Exception("❌ ERROR: Configuración de cuentas para notas de crédito es obligatoria")
        
        print(f"📊 VentasScript: Iniciando procesamiento para NIT {nit_empresa}")
        print(f"📊 VentasScript: Tamaño archivo recibido: {len(excel_dian_content)} bytes")
        
        # Leer Excel desde contenido binario
        excelDian = pd.read_excel(io.BytesIO(excel_dian_content)).astype(str)
        print(f"📊 VentasScript: Excel leído exitosamente, {len(excelDian)} filas")
        
        # Verificar columnas necesarias
        columnas_requeridas = ['NIT Emisor', 'NIT Receptor', 'Total', 'IVA', 'Tipo de documento', 'Folio', 'Fecha Emisión']
        columnas_faltantes = [col for col in columnas_requeridas if col not in excelDian.columns]
        
        if columnas_faltantes:
            raise Exception(f"Columnas faltantes en el archivo DIAN: {columnas_faltantes}")
        
        # Configurar tipos de comprobantes - CADA EMPRESA DEBE CONFIGURAR LOS SUYOS
        if not configuracion_comprobantes:
            raise Exception("❌ ERROR: No se ha configurado los tipos de comprobantes para esta empresa")
        
        factura_config = configuracion_comprobantes.get('factura', {})
        nota_credito_config = configuracion_comprobantes.get('nota_credito', {})
        nota_debito_config = configuracion_comprobantes.get('nota_debito', {})
        
        # Obtener códigos de tipos de comprobantes (SIN valores por defecto)
        tipoComprobanteFactura = factura_config.get('codigo') if factura_config.get('codigo') else None
        tipoComprobanteNotaCredito = nota_credito_config.get('codigo') if nota_credito_config.get('codigo') else None
        tipoComprobanteNotaDebito = nota_debito_config.get('codigo') if nota_debito_config.get('codigo') else None
        
        # Validar que al menos las facturas estén configuradas (obligatorio)
        if not tipoComprobanteFactura:
            raise Exception("❌ ERROR: No se ha configurado el tipo de comprobante para facturas. Cada empresa debe configurar sus propios tipos de comprobantes.")
        
        # Validar que las notas de crédito estén configuradas si se van a usar
        if not tipoComprobanteNotaCredito:
            print("⚠️ VentasScript: No se ha configurado el tipo de comprobante para notas de crédito")
        
        # Validar que las notas de débito estén configuradas si se van a usar
        if not tipoComprobanteNotaDebito:
            print("⚠️ VentasScript: No se ha configurado el tipo de comprobante para notas de débito")
        
        print(f"🔧 VentasScript: Tipos de comprobantes - Factura: {tipoComprobanteFactura}, Nota Crédito: {tipoComprobanteNotaCredito}, Nota Débito: {tipoComprobanteNotaDebito}")
        
        # Obtener cuentas configuradas - ORDEN FIJO: 1, 2, 3, 4 (SIN ORDENAR POR PRIORIDAD)
        def obtener_cuentas_configuradas(configuracion_cuentas):
            """
            Obtiene las cuentas configuradas en ORDEN FIJO: 1, 2, 3, 4
            IMPORTANTE: 
            - Cuenta 1 (BASE GRAVADA): OBLIGATORIA
            - Cuenta 2 (BASE NO GRAVADA): OPCIONAL
            - Cuenta 3 (IVA): OPCIONAL
            - Cuenta 4 (CONTRAPARTIDA): OBLIGATORIA
            - NO se ordena por prioridad, se respeta el orden 1, 2, 3, 4
            """
            if not configuracion_cuentas:
                print("⚠️ VentasScript: No hay configuración de cuentas para esta empresa")
                return []
            
            print(f"🔧 VentasScript: Procesando configuración de cuentas de la empresa...")
            print(f"🔧 VentasScript: Configuración recibida: {configuracion_cuentas}")
            
            # Obtener cuentas en ORDEN FIJO: 1, 2, 3, 4
            cuentas_ordenadas = []
            
            # Cuenta 1: BASE NO GRAVADA (OBLIGATORIA)
            cuenta_1_info = configuracion_cuentas.get('cuenta_1', {})
            if cuenta_1_info.get('activo', False) and cuenta_1_info.get('codigo', '').strip():
                cuentas_ordenadas.append({
                    'codigo': cuenta_1_info.get('codigo', '').strip(),
                    'nombre': cuenta_1_info.get('nombre', ''),
                    'tipo': "BASE NO GRAVADA (Obligatoria)",
                    'naturaleza': cuenta_1_info.get('naturaleza', 'credito'),
                    'posicion': 1
                })
                print(f"✅ VentasScript: Cuenta 1 configurada: {cuenta_1_info.get('codigo', '')} - {cuenta_1_info.get('nombre', '')}")
            else:
                print("❌ VentasScript: Cuenta 1 (BASE NO GRAVADA) NO configurada - OBLIGATORIA")
                return []
            
            # Cuenta 2: BASE GRAVADA (OPCIONAL)
            cuenta_2_info = configuracion_cuentas.get('cuenta_2', {})
            if cuenta_2_info.get('activo', False) and cuenta_2_info.get('codigo', '').strip():
                cuentas_ordenadas.append({
                    'codigo': cuenta_2_info.get('codigo', '').strip(),
                    'nombre': cuenta_2_info.get('nombre', ''),
                    'tipo': "BASE GRAVADA (Opcional)",
                    'naturaleza': cuenta_2_info.get('naturaleza', 'credito'),
                    'posicion': 2
                })
                print(f"✅ VentasScript: Cuenta 2 configurada: {cuenta_2_info.get('codigo', '')} - {cuenta_2_info.get('nombre', '')}")
            else:
                print("⚠️ VentasScript: Cuenta 2 (BASE GRAVADA) NO configurada - OPCIONAL")
            
            # Cuenta 3: IVA (OPCIONAL)
            cuenta_3_info = configuracion_cuentas.get('cuenta_3', {})
            if cuenta_3_info.get('activo', False) and cuenta_3_info.get('codigo', '').strip():
                cuentas_ordenadas.append({
                    'codigo': cuenta_3_info.get('codigo', '').strip(),
                    'nombre': cuenta_3_info.get('nombre', ''),
                    'tipo': "IVA (Opcional)",
                    'naturaleza': cuenta_3_info.get('naturaleza', 'credito'),
                    'posicion': 3
                })
                print(f"✅ VentasScript: Cuenta 3 configurada: {cuenta_3_info.get('codigo', '')} - {cuenta_3_info.get('nombre', '')}")
            else:
                print("⚠️ VentasScript: Cuenta 3 (IVA) NO configurada - OPCIONAL")
            
            # Cuenta 4: CONTRAPARTIDA (OBLIGATORIA)
            cuenta_4_info = configuracion_cuentas.get('cuenta_4', {})
            if cuenta_4_info.get('activo', False) and cuenta_4_info.get('codigo', '').strip():
                cuentas_ordenadas.append({
                    'codigo': cuenta_4_info.get('codigo', '').strip(),
                    'nombre': cuenta_4_info.get('nombre', ''),
                    'tipo': "CONTRAPARTIDA (Obligatoria)",
                    'naturaleza': cuenta_4_info.get('naturaleza', 'debito'),
                    'posicion': 4
                })
                print(f"✅ VentasScript: Cuenta 4 configurada: {cuenta_4_info.get('codigo', '')} - {cuenta_4_info.get('nombre', '')}")
            else:
                print("❌ VentasScript: Cuenta 4 (CONTRAPARTIDA) NO configurada - OBLIGATORIA")
                return []
            
            print(f"✅ VentasScript: {len(cuentas_ordenadas)} cuentas configuradas en orden fijo")
            return cuentas_ordenadas
        
        # Obtener cuentas para facturas de venta
        print(f"🔧 VentasScript: Obteniendo configuración de cuentas para facturas de venta...")
        cuentas_factura = obtener_cuentas_configuradas(registro_cuentas_factura_venta)
        if len(cuentas_factura) < 2:  # Mínimo: Cuenta 1 y Cuenta 4
            raise Exception("❌ ERROR: Se requieren al menos las cuentas 1 (BASE NO GRAVADA) y 4 (CONTRAPARTIDA) configuradas para facturas de venta")
        
        # Asignar cuentas según ORDEN FIJO: 1, 2, 3, 4
        cuenta_base_no_gravada = None   # Cuenta 1: Base no gravada (OBLIGATORIA)
        cuenta_base_gravada = None      # Cuenta 2: Base gravada (OPCIONAL)
        cuenta_iva = None               # Cuenta 3: IVA (OPCIONAL)
        cuenta_contrapartida = None     # Cuenta 4: Contrapartida (OBLIGATORIA)
        
        # Buscar cuentas por posición
        for cuenta in cuentas_factura:
            if cuenta['posicion'] == 1:
                cuenta_base_no_gravada = cuenta['codigo']
            elif cuenta['posicion'] == 2:
                cuenta_base_gravada = cuenta['codigo']
            elif cuenta['posicion'] == 3:
                cuenta_iva = cuenta['codigo']
            elif cuenta['posicion'] == 4:
                cuenta_contrapartida = cuenta['codigo']
        
        print(f"💰 VentasScript: Cuentas configuradas para facturas ({len(cuentas_factura)} cuentas):")
        for cuenta in cuentas_factura:
            print(f"  {cuenta['posicion']}. {cuenta['tipo']}: {cuenta['codigo']} - {cuenta['nombre']}")
        
        print(f"🎯 VentasScript: Cuentas asignadas para procesamiento:")
        print(f"  - Base No Gravada (Cuenta 1): {cuenta_base_no_gravada}")
        print(f"  - Base Gravada (Cuenta 2): {cuenta_base_gravada}")
        print(f"  - IVA (Cuenta 3): {cuenta_iva}")
        print(f"  - Contrapartida (Cuenta 4): {cuenta_contrapartida}")
        
        # Informar sobre la lógica de cálculo
        if cuenta_iva is not None:
            print(f"🔧 VentasScript: IVA configurado - Base no gravada = Total - IVA, Base gravada = IVA/19*100")
        else:
            print(f"🔧 VentasScript: IVA NO configurado - Base no gravada será el valor total del archivo DIAN")
        
        # Obtener cuentas para notas de crédito
        print(f"🔧 VentasScript: Obteniendo configuración de cuentas para notas de crédito...")
        cuentas_nota_credito = obtener_cuentas_configuradas(registro_cuentas_nota_credito)
        if len(cuentas_nota_credito) < 2:  # Mínimo: Cuenta 1 y Cuenta 4
            raise Exception("❌ ERROR: Se requieren al menos las cuentas 1 (BASE NO GRAVADA) y 4 (CONTRAPARTIDA) configuradas para notas de crédito")
        
        # Asignar cuentas para notas de crédito según ORDEN FIJO: 1, 2, 3, 4
        cuenta_base_no_gravada_nc = None  # Cuenta 1: Base no gravada (OBLIGATORIA)
        cuenta_base_gravada_nc = None     # Cuenta 2: Base gravada (OPCIONAL)
        cuenta_iva_nc = None              # Cuenta 3: IVA (OPCIONAL)
        cuenta_contrapartida_nc = None    # Cuenta 4: Contrapartida (OBLIGATORIA)
        
        # Buscar cuentas por posición
        for cuenta in cuentas_nota_credito:
            if cuenta['posicion'] == 1:
                cuenta_base_no_gravada_nc = cuenta['codigo']
            elif cuenta['posicion'] == 2:
                cuenta_base_gravada_nc = cuenta['codigo']
            elif cuenta['posicion'] == 3:
                cuenta_iva_nc = cuenta['codigo']
            elif cuenta['posicion'] == 4:
                cuenta_contrapartida_nc = cuenta['codigo']
        
        print(f"💰 VentasScript: Cuentas configuradas para notas de crédito ({len(cuentas_nota_credito)} cuentas):")
        for cuenta in cuentas_nota_credito:
            print(f"  {cuenta['posicion']}. {cuenta['tipo']}: {cuenta['codigo']} - {cuenta['nombre']}")
        
        # Preparar estructura del modelo
        encabezados = [
            "Tipo de comprobante", "Consecutivo comprobante", "Fecha de elaboración", "Sigla moneda",
            "Tasa de cambio", "Código cuenta contable", "Identificación tercero", "Sucursal",
            "Código producto", "Código de bodega", "Acción", "Cantidad producto", "Prefijo",
            "Consecutivo", "No. cuota", "Fecha vencimiento", "Código impuesto", 
            "Código grupo activo fijo", "Código activo fijo", "Descripción",
            "Código centro/subcentro de costos", "Débito", "Crédito", "Observaciones",
            "Base gravable libro compras/ventas", "Base exenta libro compras/ventas", "Mes de cierre"
        ]
        
        excelModelo = pd.DataFrame(columns=encabezados)
        numeroFilaModelo = 0
        archivos_generados = []
        registros_encontrados = 0
        
        # Normalizar NIT a buscar
        nit_buscar = str(nit_empresa).strip().replace('-', '').replace(' ', '').replace('.', '')
        nit_buscar_sin_dv = nit_buscar[:9] if len(nit_buscar) > 9 else nit_buscar
        
        print(f"🔍 VentasScript: NIT a buscar: '{nit_buscar}'")
        
        # Función para agregar fila al modelo
        def agregar_fila(tipo_comprobante, folio, fecha, cuenta, tercero, debito=None, credito=None, observaciones="", descripcion="", base_gravable=None, base_exenta=None):
            nonlocal numeroFilaModelo
            excelModelo.loc[numeroFilaModelo, 'Tipo de comprobante'] = tipo_comprobante
            excelModelo.loc[numeroFilaModelo, 'Consecutivo comprobante'] = folio
            excelModelo.loc[numeroFilaModelo, 'Fecha de elaboración'] = fecha
            excelModelo.loc[numeroFilaModelo, 'Código cuenta contable'] = cuenta
            excelModelo.loc[numeroFilaModelo, 'Identificación tercero'] = tercero
            if debito:
                excelModelo.loc[numeroFilaModelo, 'Débito'] = debito
            if credito:
                excelModelo.loc[numeroFilaModelo, 'Crédito'] = credito
            excelModelo.loc[numeroFilaModelo, 'Observaciones'] = observaciones
            excelModelo.loc[numeroFilaModelo, 'Descripción'] = descripcion
            # Campos vacíos para SIIGO - no llenar base gravable, base exenta ni mes de cierre
            excelModelo.loc[numeroFilaModelo, 'Base gravable libro compras/ventas'] = ""
            excelModelo.loc[numeroFilaModelo, 'Base exenta libro compras/ventas'] = ""
            excelModelo.loc[numeroFilaModelo, 'Mes de cierre'] = ""
            numeroFilaModelo += 1
        
        # Procesar cada fila del archivo DIAN
        for numeroDeFilaDian, filaCompletaDian in excelDian.iterrows():
            # Normalizar NIT emisor
            nit_emisor = str(filaCompletaDian['NIT Emisor']).strip().replace('-', '').replace(' ', '').replace('.', '')
            nit_emisor_sin_dv = nit_emisor[:9] if len(nit_emisor) > 9 else nit_emisor
            
            # Para VENTAS: buscar registros donde NOSOTROS somos el emisor
            coincide = (nit_emisor == nit_buscar or
                    nit_emisor == nit_buscar_sin_dv or
                    nit_emisor_sin_dv == nit_buscar or
                    nit_emisor_sin_dv == nit_buscar_sin_dv)
            
            if coincide:
                registros_encontrados += 1
                
                # Obtener valores del documento
                valorTotal = float(filaCompletaDian['Total'])
                valorIVA = float(filaCompletaDian['IVA'])
                
                # Lógica de cálculo según configuración de cuentas
                if cuenta_iva is not None:
                    # IVA configurado: calcular base gravada = valor_iva/19*100
                    valorBaseGravada = (valorIVA / 19 * 100) if valorIVA > 0 else 0
                    valorBaseNoGravada = valorTotal - valorIVA - valorBaseGravada  # Base no gravada = Total - IVA
                    valorIVAFormateado = int(round(valorIVA))  # IVA sin decimales
                else:
                    # IVA NO configurado: base no gravada = valor total del archivo DIAN
                    valorBaseNoGravada = valorTotal  # Total como base no gravada
                    valorBaseGravada = 0  # No hay base gravada
                    valorIVAFormateado = 0  # No hay IVA
                
                # Formatear valores para mostrar (todos sin decimales)
                valorBaseGravadaFormateado = int(round(valorBaseGravada))  # Base gravada sin decimales
                valorBaseNoGravadaFormateado = int(round(valorBaseNoGravada))  # Base no gravada sin decimales
                
                # Calcular suma de créditos/débitos según cuentas configuradas
                # La contrapartida DEBE ser exactamente igual a esta suma para que débito = crédito
                suma_creditos = 0
                if valorBaseNoGravada > 0:
                    suma_creditos += valorBaseNoGravadaFormateado
                if valorBaseGravada > 0 and cuenta_base_gravada is not None:
                    suma_creditos += valorBaseGravadaFormateado
                if valorIVA > 0 and cuenta_iva is not None:
                    suma_creditos += valorIVAFormateado
                
                # La contrapartida es exactamente la suma de los créditos (para facturas y notas débito)
                # O la suma de los débitos (para notas crédito)
                valorContrapartida = suma_creditos
                valorTotalFormateado = valorContrapartida  # Contrapartida = suma exacta
                
                # Limpiar folio
                numeroFolio = str(filaCompletaDian['Folio'])
                folioLimpio = re.sub(r'\D', '', numeroFolio)

                tipo_documento = str(filaCompletaDian['Tipo de documento']).lower().strip()
                nit_receptor = filaCompletaDian['NIT Receptor']
                fecha_emision = filaCompletaDian['Fecha Emisión']
                
                print(f"💰 VentasScript: Procesando {tipo_documento} - Base No Gravada: {valorBaseNoGravadaFormateado}, Base Gravada: {valorBaseGravadaFormateado}, IVA: {valorIVAFormateado}, Contrapartida: {valorTotalFormateado}")
                print(f"🔍 VentasScript: Cuentas disponibles - Base No Gravada: {cuenta_base_no_gravada}, Base Gravada: {cuenta_base_gravada}, IVA: {cuenta_iva}, Contrapartida: {cuenta_contrapartida}")
                
                # Procesar según tipo de documento
                if 'factura' in tipo_documento and 'electrónica' in tipo_documento:
                    # FACTURA ELECTRÓNICA
                    # 1. Base no gravada (obligatoria)
                    if valorBaseNoGravada > 0:
                        agregar_fila(
                            tipoComprobanteFactura, folioLimpio, fecha_emision, 
                            cuenta_base_no_gravada, nit_receptor, 
                            credito=valorBaseNoGravadaFormateado, 
                            observaciones="",
                            descripcion="",
                            base_exenta=valorBaseNoGravadaFormateado
                        )
                    
                    # 2. Base gravada (solo si existe y está configurada)
                    if valorBaseGravada > 0 and cuenta_base_gravada is not None:
                        print(f"✅ VentasScript: Agregando Base Gravada: {valorBaseGravadaFormateado} en cuenta {cuenta_base_gravada}")
                        agregar_fila(
                            tipoComprobanteFactura, folioLimpio, fecha_emision, 
                            cuenta_base_gravada, nit_receptor, 
                            credito=valorBaseGravadaFormateado, 
                            observaciones="",
                            descripcion="",
                            base_gravable=valorBaseGravadaFormateado
                        )
                    else:
                        print(f"⚠️ VentasScript: Base Gravada NO agregada - Valor: {valorBaseGravada}, Cuenta configurada: {cuenta_base_gravada is not None}")
                    
                    # 3. IVA (solo si está configurado y existe)
                    if valorIVA > 0 and cuenta_iva is not None:
                        print(f"✅ VentasScript: Agregando IVA: {valorIVAFormateado} en cuenta {cuenta_iva}")
                        agregar_fila(
                            tipoComprobanteFactura, folioLimpio, fecha_emision, 
                            cuenta_iva, nit_receptor, 
                            credito=valorIVAFormateado, 
                            observaciones="",
                            descripcion=""
                        )
                    else:
                        print(f"⚠️ VentasScript: IVA NO agregado - Valor: {valorIVA}, Cuenta configurada: {cuenta_iva is not None}")
                    
                    # 4. Contrapartida (suma de las otras 3 cuentas - obligatoria)
                    agregar_fila(
                        tipoComprobanteFactura, folioLimpio, fecha_emision, 
                        cuenta_contrapartida, nit_receptor, 
                        debito=valorTotalFormateado, 
                        observaciones="",
                        descripcion=""
                    )
                
                elif 'nota de crédito' in tipo_documento and 'electrónica' in tipo_documento:
                    # NOTA DE CRÉDITO ELECTRÓNICA
                    if not tipoComprobanteNotaCredito:
                        print(f"⚠️ VentasScript: Nota de crédito encontrada pero no configurada. Saltando.")
                        continue
                    
                    # Calcular suma de débitos para nota de crédito
                    suma_debitos = 0
                    
                    # Nota de crédito: movimientos inversos (débitos donde había créditos)
                    if valorBaseNoGravada > 0:
                        suma_debitos += valorBaseNoGravadaFormateado
                        agregar_fila(
                            tipoComprobanteNotaCredito, folioLimpio, fecha_emision, 
                            cuenta_base_no_gravada_nc, nit_receptor, 
                            debito=valorBaseNoGravadaFormateado, 
                            observaciones="",
                            descripcion=""
                        )
                    
                    if valorBaseGravada > 0 and cuenta_base_gravada_nc is not None:
                        suma_debitos += valorBaseGravadaFormateado
                        agregar_fila(
                            tipoComprobanteNotaCredito, folioLimpio, fecha_emision, 
                            cuenta_base_gravada_nc, nit_receptor, 
                            debito=valorBaseGravadaFormateado, 
                            observaciones="",
                            descripcion=""
                        )
                    
                    if valorIVA > 0 and cuenta_iva_nc is not None:
                        suma_debitos += valorIVAFormateado
                        agregar_fila(
                            tipoComprobanteNotaCredito, folioLimpio, fecha_emision, 
                            cuenta_iva_nc, nit_receptor, 
                            debito=valorIVAFormateado, 
                            observaciones="",
                            descripcion=""
                        )
                    
                    # Contrapartida = suma exacta de débitos (para garantizar débito = crédito)
                    valorContrapartidaNC = suma_debitos
                    agregar_fila(
                        tipoComprobanteNotaCredito, folioLimpio, fecha_emision, 
                        cuenta_contrapartida_nc, nit_receptor, 
                        credito=valorContrapartidaNC, 
                        observaciones="",
                        descripcion=""
                    )
                
                elif 'nota de débito' in tipo_documento and 'electrónica' in tipo_documento:
                    # NOTA DE DÉBITO ELECTRÓNICA
                    if not tipoComprobanteNotaDebito:
                        print(f"⚠️ VentasScript: Nota de débito encontrada pero no configurada. Saltando.")
                        continue
                    
                    # Calcular suma de créditos para nota de débito (mismos movimientos que factura)
                    suma_creditos_nd = 0
                    
                    # Nota de débito: mismos movimientos que factura (aumenta la deuda)
                    if valorBaseNoGravada > 0:
                        suma_creditos_nd += valorBaseNoGravadaFormateado
                        agregar_fila(
                            tipoComprobanteNotaDebito, folioLimpio, fecha_emision,
                            cuenta_base_no_gravada, nit_receptor,
                            credito=valorBaseNoGravadaFormateado,
                            observaciones="",
                            descripcion=""
                        )
                    
                    if valorBaseGravada > 0 and cuenta_base_gravada is not None:
                        suma_creditos_nd += valorBaseGravadaFormateado
                        agregar_fila(
                            tipoComprobanteNotaDebito, folioLimpio, fecha_emision, 
                            cuenta_base_gravada, nit_receptor, 
                            credito=valorBaseGravadaFormateado, 
                            observaciones="",
                            descripcion=""
                        )
                    
                    if valorIVA > 0 and cuenta_iva is not None:
                        suma_creditos_nd += valorIVAFormateado
                        agregar_fila(
                            tipoComprobanteNotaDebito, folioLimpio, fecha_emision, 
                            cuenta_iva, nit_receptor, 
                            credito=valorIVAFormateado, 
                            observaciones="",
                            descripcion=""
                        )
                    
                    # Contrapartida = suma exacta de créditos (para garantizar débito = crédito)
                    valorContrapartidaND = suma_creditos_nd
                    agregar_fila(
                        tipoComprobanteNotaDebito, folioLimpio, fecha_emision, 
                        cuenta_contrapartida, nit_receptor, 
                        debito=valorContrapartidaND, 
                        observaciones="",
                        descripcion=""
                    )
                
                # Dividir archivo si supera 495 filas
                if numeroFilaModelo >= 494:  # Límite de Siigo: máximo 495 líneas totales (494 datos + 1 encabezado)
                    # Guardar archivo actual
                    buffer = io.BytesIO()
                    excelModelo.to_excel(buffer, index=False)
                    buffer.seek(0)
                    
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    nombre_archivo = f"ModeloVentas-{len(archivos_generados)+1}_{timestamp}.xlsx"
                    
                    archivos_generados.append({
                        'nombre': nombre_archivo,
                        'contenido': buffer.getvalue(),
                        'filas': len(excelModelo)
                    })
                    
                    # Reiniciar modelo
                    numeroFilaModelo = 0
                    excelModelo = pd.DataFrame(columns=encabezados)
        
        # Guardar último archivo si hay datos
        if numeroFilaModelo > 0:
            excelModelo = excelModelo.fillna("")
            
            buffer = io.BytesIO()
            excelModelo.to_excel(buffer, index=False)
            buffer.seek(0)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            nombre_archivo = f"ModeloVentas-{len(archivos_generados)+1}_{timestamp}.xlsx"
            
            archivos_generados.append({
                'nombre': nombre_archivo,
                'contenido': buffer.getvalue(),
                'filas': len(excelModelo)
            })
        
        print(f"✅ VentasScript: Registros encontrados para NIT {nit_empresa}: {registros_encontrados}")
        print(f"📦 VentasScript: Archivos generados: {len(archivos_generados)}")
        
        if len(archivos_generados) == 0:
            raise Exception(f"No se encontraron registros para el NIT {nit_empresa} en el archivo DIAN")
        
        return archivos_generados
        
    except Exception as e:
        print(f"❌ VentasScript: Error en procesar_ventas: {str(e)}")
        raise Exception(f"Error procesando ventas: {str(e)}")

def es_archivo_dian(excel_content):
    """
    Detecta si el archivo Excel es un reporte de la DIAN
    """
    try:
        df = pd.read_excel(io.BytesIO(excel_content))
        columnas_dian = ['NIT Emisor', 'NIT Receptor', 'Total', 'IVA', 'Tipo de documento', 'Folio', 'Fecha Emisión']
        return all(col in df.columns for col in columnas_dian)
    except:
        return False