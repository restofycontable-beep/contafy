#!/usr/bin/env python3
"""
Script para actualizar la base de datos
"""
import psycopg2
import logging
from config.settings import settings

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def actualizar_base_datos():
    """
    Actualiza la base de datos agregando columnas faltantes
    """
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(settings.database_url)
        cursor = conn.cursor()
        
        logger.info("🔄 Iniciando actualización de la base de datos...")
        
        # Verificar si existe la columna usuario_id en archivos_procesados
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'archivos_procesados' 
            AND column_name = 'usuario_id'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna usuario_id a archivos_procesados...")
            cursor.execute("""
                ALTER TABLE archivos_procesados 
                ADD COLUMN usuario_id INTEGER REFERENCES users(id)
            """)
            logger.info("✅ Columna usuario_id agregada")
        else:
            logger.info("✅ Columna usuario_id ya existe")
        
        # Verificar si existe la columna representante_nombre en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'representante_nombre'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna representante_nombre...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN representante_nombre VARCHAR(255)
            """)
            logger.info("✅ Columna representante_nombre agregada")
        else:
            logger.info("✅ Columna representante_nombre ya existe")
        
        # Verificar si existe la columna representante_nit en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'representante_nit'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna representante_nit...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN representante_nit VARCHAR(20)
            """)
            logger.info("✅ Columna representante_nit agregada")
        else:
            logger.info("✅ Columna representante_nit ya existe")
        
        # Verificar si existe la columna usuario_id en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'usuario_id'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna usuario_id a empresas...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN usuario_id INTEGER REFERENCES users(id)
            """)
            logger.info("✅ Columna usuario_id agregada a empresas")
        else:
            logger.info("✅ Columna usuario_id ya existe en empresas")
        
        # Verificar si existe la columna restofysas_token en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'restofysas_token'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna restofysas_token...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN restofysas_token VARCHAR(500)
            """)
            logger.info("✅ Columna restofysas_token agregada")
        else:
            logger.info("✅ Columna restofysas_token ya existe")
        
        # Verificar si existe la columna configuracion_comprobantes en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'configuracion_comprobantes'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna configuracion_comprobantes...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN configuracion_comprobantes VARCHAR(1000)
            """)
            logger.info("✅ Columna configuracion_comprobantes agregada")
        else:
            logger.info("✅ Columna configuracion_comprobantes ya existe")
        
        # Verificar si existe la columna configuracion_comprobantes_compras en empresas
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'empresas'
            AND column_name = 'configuracion_comprobantes_compras'
        """)

        if not cursor.fetchone():
            logger.info("➕ Agregando columna configuracion_comprobantes_compras...")
            cursor.execute("""
                ALTER TABLE empresas
                ADD COLUMN configuracion_comprobantes_compras VARCHAR(1000)
            """)
            logger.info("✅ Columna configuracion_comprobantes_compras agregada")
        else:
            logger.info("✅ Columna configuracion_comprobantes_compras ya existe")
        
        # Verificar si existe la columna empresa_id en cuentas_importadas
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'cuentas_importadas'
            AND column_name = 'empresa_id'
        """)

        if not cursor.fetchone():
            logger.info("➕ Agregando columna empresa_id a cuentas_importadas...")
            cursor.execute("""
                ALTER TABLE cuentas_importadas
                ADD COLUMN empresa_id INTEGER REFERENCES empresas(id)
            """)
            logger.info("✅ Columna empresa_id agregada a cuentas_importadas")
        else:
            logger.info("✅ Columna empresa_id ya existe en cuentas_importadas")
        
        # Verificar si existe la columna cuenta_iva en cuentas_importadas
        cursor.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'cuentas_importadas'
            AND column_name = 'cuenta_iva'
        """)

        if not cursor.fetchone():
            logger.info("➕ Agregando columna cuenta_iva a cuentas_importadas...")
            cursor.execute("""
                ALTER TABLE cuentas_importadas
                ADD COLUMN cuenta_iva VARCHAR(20)
            """)
            logger.info("✅ Columna cuenta_iva agregada a cuentas_importadas")
        else:
            logger.info("✅ Columna cuenta_iva ya existe en cuentas_importadas")
        
        # Verificar si existe la columna registro_cuentas_ventas en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'registro_cuentas_ventas'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna registro_cuentas_ventas...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN registro_cuentas_ventas VARCHAR(2500)
            """)
            logger.info("✅ Columna registro_cuentas_ventas agregada")
        else:
            logger.info("✅ Columna registro_cuentas_ventas ya existe")
        
        # Verificar si existe la columna registro_cuentas_compras en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'registro_cuentas_compras'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna registro_cuentas_compras...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN registro_cuentas_compras VARCHAR(2500)
            """)
            logger.info("✅ Columna registro_cuentas_compras agregada")
        else:
            logger.info("✅ Columna registro_cuentas_compras ya existe")
        
        # Verificar si existe la columna registro_cuentas_factura_venta en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'registro_cuentas_factura_venta'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna registro_cuentas_factura_venta...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN registro_cuentas_factura_venta VARCHAR(5000)
            """)
            logger.info("✅ Columna registro_cuentas_factura_venta agregada")
        else:
            logger.info("✅ Columna registro_cuentas_factura_venta ya existe")
        
        # Verificar si existe la columna registro_cuentas_nota_credito en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'registro_cuentas_nota_credito'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna registro_cuentas_nota_credito...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN registro_cuentas_nota_credito VARCHAR(5000)
            """)
            logger.info("✅ Columna registro_cuentas_nota_credito agregada")
        else:
            logger.info("✅ Columna registro_cuentas_nota_credito ya existe")
        
        # Verificar si existe la columna registro_cuentas_factura_compra en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'registro_cuentas_factura_compra'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna registro_cuentas_factura_compra...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN registro_cuentas_factura_compra VARCHAR(5000)
            """)
            logger.info("✅ Columna registro_cuentas_factura_compra agregada")
        else:
            logger.info("✅ Columna registro_cuentas_factura_compra ya existe")
        
        # Verificar si existe la columna registro_cuentas_nota_credito_compra en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'registro_cuentas_nota_credito_compra'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna registro_cuentas_nota_credito_compra...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN registro_cuentas_nota_credito_compra VARCHAR(5000)
            """)
            logger.info("✅ Columna registro_cuentas_nota_credito_compra agregada")
        else:
            logger.info("✅ Columna registro_cuentas_nota_credito_compra ya existe")
        
        # Verificar si existe la columna direccion en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'direccion'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna direccion...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN direccion VARCHAR(500)
            """)
            logger.info("✅ Columna direccion agregada")
        else:
            logger.info("✅ Columna direccion ya existe")
        
        # Verificar si existe la columna codigo_pais en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'codigo_pais'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna codigo_pais...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN codigo_pais VARCHAR(10) DEFAULT 'Co'
            """)
            logger.info("✅ Columna codigo_pais agregada")
        else:
            logger.info("✅ Columna codigo_pais ya existe")
        
        # Verificar si existe la columna codigo_departamento en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'codigo_departamento'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna codigo_departamento...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN codigo_departamento VARCHAR(10)
            """)
            logger.info("✅ Columna codigo_departamento agregada")
        else:
            logger.info("✅ Columna codigo_departamento ya existe")
        
        # Verificar si existe la columna codigo_ciudad en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'codigo_ciudad'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna codigo_ciudad...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN codigo_ciudad VARCHAR(10)
            """)
            logger.info("✅ Columna codigo_ciudad agregada")
        else:
            logger.info("✅ Columna codigo_ciudad ya existe")
        
        # Actualizar la empresa por defecto si existe
        cursor.execute("SELECT id FROM empresas WHERE nit = '901906032'")
        empresa_existente = cursor.fetchone()
        
        if empresa_existente:
            logger.info("🔄 Actualizando empresa por defecto...")
            
            # Datos para 5 cuentas
            datos_5_cuentas = '{"cuenta_1": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_2": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_3": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_4": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_5": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}}'
            
            # Datos para 10 cuentas
            datos_10_cuentas = '{"cuenta_1": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_2": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_3": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_4": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_5": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_6": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_7": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_8": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_9": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_10": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}}'
            
            cursor.execute("""
                UPDATE empresas 
                SET representante_nombre = 'Representante Legal',
                    representante_nit = '12345678-9',
                    usuario_id = 1,
                    restofysas_token = NULL,
                    direccion = COALESCE(direccion, 'Calle 123 #45-67'),
                    codigo_pais = COALESCE(codigo_pais, 'Co'),
                    codigo_departamento = COALESCE(codigo_departamento, '63'),
                    codigo_ciudad = COALESCE(codigo_ciudad, '63001'),
                    registro_cuentas_ventas = COALESCE(registro_cuentas_ventas, %s),
                    registro_cuentas_compras = COALESCE(registro_cuentas_compras, %s),
                    registro_cuentas_factura_venta = COALESCE(registro_cuentas_factura_venta, %s),
                    registro_cuentas_nota_credito = COALESCE(registro_cuentas_nota_credito, %s),
                    registro_cuentas_factura_compra = COALESCE(registro_cuentas_factura_compra, %s),
                    registro_cuentas_nota_credito_compra = COALESCE(registro_cuentas_nota_credito_compra, %s)
                WHERE nit = '901906032'
            """, (datos_5_cuentas, datos_5_cuentas, datos_10_cuentas, datos_10_cuentas, datos_10_cuentas, datos_10_cuentas))
            logger.info("✅ Empresa por defecto actualizada")
        else:
            logger.info("➕ Creando empresa por defecto...")
            
            # Datos para 5 cuentas (ventas y compras)
            datos_5_cuentas = '{"cuenta_1": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_2": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_3": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_4": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_5": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}}'
            
            # Datos para 10 cuentas (factura venta y nota crédito)
            datos_10_cuentas = '{"cuenta_1": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_2": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_3": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_4": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_5": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_6": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_7": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_8": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_9": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_10": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}}'
            
            cursor.execute("""
                INSERT INTO empresas (nit, razon_social, nombre_comercial, representante_nombre, representante_nit, usuario_id, restofysas_token, direccion, codigo_pais, codigo_departamento, codigo_ciudad, registro_cuentas_ventas, registro_cuentas_compras, registro_cuentas_factura_venta, registro_cuentas_nota_credito, registro_cuentas_factura_compra, registro_cuentas_nota_credito_compra)
                VALUES ('901906032', 'Empresa Por Defecto S.A.S.', 'Empresa Defecto', 'Representante Legal', '12345678-9', 1, NULL, 'Calle 123 #45-67', 'Co', '63', '63001', %s, %s, %s, %s, %s, %s)
            """, (datos_5_cuentas, datos_5_cuentas, datos_10_cuentas, datos_10_cuentas, datos_10_cuentas, datos_10_cuentas))
            logger.info("✅ Empresa por defecto creada")
        
        # Crear datos por defecto para 10 cuentas
        datos_10_cuentas = '{"cuenta_1": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_2": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_3": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_4": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_5": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_6": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_7": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_8": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_9": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_10": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}}'
        
        datos_5_cuentas = '{"cuenta_1": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_2": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_3": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_4": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}, "cuenta_5": {"codigo": "", "nombre": "", "activo": false, "naturaleza": "debito"}}'

        # Actualizar todas las empresas existentes que no tengan las nuevas columnas inicializadas
        logger.info("🔄 Inicializando columnas nuevas en empresas existentes...")
        cursor.execute("""
            UPDATE empresas 
            SET direccion = COALESCE(direccion, 'Dirección por configurar'),
                codigo_pais = COALESCE(codigo_pais, 'Co'),
                codigo_departamento = COALESCE(codigo_departamento, '63'),
                codigo_ciudad = COALESCE(codigo_ciudad, '63001'),
                registro_cuentas_ventas = COALESCE(registro_cuentas_ventas, %s),
                registro_cuentas_compras = COALESCE(registro_cuentas_compras, %s),
                registro_cuentas_factura_venta = COALESCE(registro_cuentas_factura_venta, %s),
                registro_cuentas_nota_credito = COALESCE(registro_cuentas_nota_credito, %s),
                registro_cuentas_factura_compra = COALESCE(registro_cuentas_factura_compra, %s),
                registro_cuentas_nota_credito_compra = COALESCE(registro_cuentas_nota_credito_compra, %s)
            WHERE registro_cuentas_ventas IS NULL 
               OR registro_cuentas_compras IS NULL
               OR registro_cuentas_factura_venta IS NULL 
               OR registro_cuentas_nota_credito IS NULL
               OR registro_cuentas_factura_compra IS NULL
               OR registro_cuentas_nota_credito_compra IS NULL
               OR direccion IS NULL
               OR codigo_departamento IS NULL
               OR codigo_ciudad IS NULL
        """, (datos_5_cuentas, datos_5_cuentas, datos_10_cuentas, datos_10_cuentas, datos_10_cuentas, datos_10_cuentas))
        empresas_actualizadas = cursor.rowcount
        logger.info(f"✅ {empresas_actualizadas} empresas inicializadas con las nuevas columnas")
        
        # Actualizar restricción para incluir terceros
        logger.info("🔄 Actualizando restricción de tipo_procesamiento...")
        try:
            cursor.execute("""
                ALTER TABLE archivos_zip_generados DROP CONSTRAINT IF EXISTS chk_tipo_procesamiento
            """)
            logger.info("🗑️ Restricción anterior eliminada")
            
            cursor.execute("""
                ALTER TABLE archivos_zip_generados 
                ADD CONSTRAINT chk_tipo_procesamiento 
                CHECK (tipo_procesamiento IN ('ventas', 'compras', 'ambos', 'terceros', 'completo'))
            """)
            logger.info("✅ Nueva restricción creada con 'terceros' y 'completo'")
            
        except Exception as e:
            logger.warning(f"⚠️ Error actualizando restricción: {e}")
        
        # Verificar si existe la columna cuenta_contrapartida en cuentas_importadas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'cuentas_importadas' 
            AND column_name = 'cuenta_contrapartida'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna cuenta_contrapartida a cuentas_importadas...")
            cursor.execute("""
                ALTER TABLE cuentas_importadas 
                ADD COLUMN cuenta_contrapartida VARCHAR(20)
            """)
            logger.info("✅ Columna cuenta_contrapartida agregada")
            logger.info("ℹ️  Valores NULL usarán configuración de empresa")
        else:
            logger.info("✅ Columna cuenta_contrapartida ya existe")
        
        # Verificar si existe la columna cuenta_exenta en cuentas_importadas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'cuentas_importadas' 
            AND column_name = 'cuenta_exenta'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna cuenta_exenta a cuentas_importadas...")
            cursor.execute("""
                ALTER TABLE cuentas_importadas 
                ADD COLUMN cuenta_exenta VARCHAR(20)
            """)
            logger.info("✅ Columna cuenta_exenta agregada")
            logger.info("ℹ️  Permite configurar cuenta separada para base exenta")
        else:
            logger.info("✅ Columna cuenta_exenta ya existe")
        
        # Verificar si existe la columna restofy_url en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'restofy_url'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna restofy_url (URL de Restofy)...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN restofy_url VARCHAR(500)
            """)
            logger.info("✅ Columna restofy_url agregada")
            logger.info("ℹ️  URL de Restofy (opcional - solo para empresas con integración Restofy)")
        else:
            logger.info("✅ Columna restofy_url ya existe")
        
        # Verificar si existe la columna vinculada_restofy en empresas
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' 
            AND column_name = 'vinculada_restofy'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna vinculada_restofy...")
            cursor.execute("""
                ALTER TABLE empresas 
                ADD COLUMN vinculada_restofy BOOLEAN DEFAULT FALSE NOT NULL
            """)
            logger.info("✅ Columna vinculada_restofy agregada")
            logger.info("ℹ️  Indicador si la empresa está vinculada con Restofy")
            
            # Actualizar empresas existentes que ya tienen Restofy configurado
            logger.info("🔄 Actualizando empresas existentes con Restofy configurado...")
            cursor.execute("""
                UPDATE empresas 
                SET vinculada_restofy = TRUE 
                WHERE (restofy_url IS NOT NULL AND restofy_url != '') 
                AND (restofysas_token IS NOT NULL AND restofysas_token != '')
            """)
            empresas_actualizadas = cursor.rowcount
            logger.info(f"✅ {empresas_actualizadas} empresas marcadas como vinculadas con Restofy")
        else:
            logger.info("✅ Columna vinculada_restofy ya existe")
        
        # Verificar si existe la columna reset_token en users
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'reset_token'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna reset_token a users...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN reset_token VARCHAR(255)
            """)
            logger.info("✅ Columna reset_token agregada")
        else:
            logger.info("✅ Columna reset_token ya existe")
        
        # Verificar si existe la columna reset_token_expires en users
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'reset_token_expires'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Agregando columna reset_token_expires a users...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN reset_token_expires TIMESTAMP WITH TIME ZONE
            """)
            logger.info("✅ Columna reset_token_expires agregada")
        else:
            logger.info("✅ Columna reset_token_expires ya existe")
        
        # Verificar si existe el índice idx_users_reset_token
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'users' 
            AND indexname = 'idx_users_reset_token'
        """)
        
        if not cursor.fetchone():
            logger.info("➕ Creando índice idx_users_reset_token...")
            cursor.execute("""
                CREATE INDEX idx_users_reset_token ON users (reset_token)
            """)
            logger.info("✅ Índice idx_users_reset_token creado")
        else:
            logger.info("✅ Índice idx_users_reset_token ya existe")
        
        # Commit de los cambios
        conn.commit()
        logger.info("✅ Todos los cambios aplicados exitosamente")
        
    except Exception as e:
        logger.error(f"❌ Error actualizando base de datos: {e}")
        if 'conn' in locals():
            conn.rollback()
        raise
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    actualizar_base_datos() 