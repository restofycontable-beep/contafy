#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para importar ubicaciones desde Excel a la base de datos
"""
import pandas as pd
import psycopg2
import logging
from config.settings import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def importar_ubicaciones():
    """
    Importa ubicaciones desde el archivo Excel a la base de datos
    """
    try:
        logger.info("📂 Leyendo archivo de ubicaciones...")
        
        # Leer el archivo Excel sin procesar encabezados
        df_raw = pd.read_excel('database/ubicaciones.xlsx', header=None)
        logger.info(f"📊 Archivo leído: {len(df_raw)} filas")
        
        # Los encabezados están en la fila 6
        df = pd.read_excel('database/ubicaciones.xlsx', header=6)
        logger.info(f"✅ DataFrame con encabezados: {len(df)} filas")
        logger.info(f"📋 Columnas: {list(df.columns)}")
        
        # Renombrar columnas para facilitar el acceso
        df.columns = ['pais', 'departamento', 'ciudad', 'codigo_pais', 'codigo_departamento', 'codigo_ciudad']
        
        # Eliminar filas vacías
        df = df.dropna(subset=['ciudad'], how='all')
        
        # Eliminar filas que tengan 'nan' o valores inválidos
        df = df[df['ciudad'].notna()]
        df = df[df['codigo_ciudad'].notna()]
        
        # Convertir códigos numéricos a string con formato correcto
        df['codigo_departamento'] = df['codigo_departamento'].apply(lambda x: str(int(float(x))).zfill(2) if pd.notna(x) and str(x) != 'nan' else '')
        df['codigo_ciudad'] = df['codigo_ciudad'].apply(lambda x: str(int(float(x))).zfill(5) if pd.notna(x) and str(x) != 'nan' else '')
        
        # Limpiar espacios en columnas de texto
        for col in ['pais', 'departamento', 'ciudad', 'codigo_pais']:
            df[col] = df[col].astype(str).str.strip()
        
        # Eliminar filas con datos inválidos (footers, etc.)
        df = df[df['ciudad'] != 'nan']
        df = df[df['codigo_ciudad'] != 'nan']
        df = df[df['codigo_ciudad'] != '']
        
        logger.info(f"✅ Datos limpios: {len(df)} registros válidos")
        
        # Mostrar primeras filas
        print("\n📋 Primeras 10 filas limpias:")
        print(df.head(10))
        
        # Conectar a la base de datos
        logger.info("🔗 Conectando a la base de datos...")
        conn = psycopg2.connect(settings.database_url)
        cursor = conn.cursor()
        
        # Crear tabla de ubicaciones si no existe
        logger.info("🏗️ Creando tabla ubicaciones...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ubicaciones (
                id SERIAL PRIMARY KEY,
                pais VARCHAR(100),
                departamento VARCHAR(100),
                ciudad VARCHAR(100),
                codigo_pais VARCHAR(10),
                codigo_departamento VARCHAR(10),
                codigo_ciudad VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(codigo_departamento, codigo_ciudad)
            )
        """)
        
        # Limpiar tabla si existe
        cursor.execute("DELETE FROM ubicaciones")
        logger.info("🗑️ Tabla limpiada")
        
        # Insertar datos
        logger.info("💾 Insertando datos...")
        registros_insertados = 0
        
        for i, row in df.iterrows():
            try:
                pais = str(row['pais']).strip()
                departamento = str(row['departamento']).strip()
                ciudad = str(row['ciudad']).strip()
                codigo_pais = str(row['codigo_pais']).strip()
                codigo_depto = str(row['codigo_departamento']).strip()
                codigo_ciudad = str(row['codigo_ciudad']).strip()
                
                # Validar que tenga datos mínimos
                if not ciudad or ciudad == 'nan' or not codigo_ciudad or codigo_ciudad == 'nan':
                    continue
                
                if not codigo_depto or codigo_depto == 'nan':
                    continue
                
                cursor.execute("""
                    INSERT INTO ubicaciones (pais, departamento, ciudad, codigo_pais, codigo_departamento, codigo_ciudad)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (codigo_departamento, codigo_ciudad) DO NOTHING
                """, (pais, departamento, ciudad, codigo_pais, codigo_depto, codigo_ciudad))
                
                registros_insertados += 1
                
                if registros_insertados % 500 == 0:
                    logger.info(f"   💾 {registros_insertados} registros insertados...")
                
            except Exception as e:
                logger.warning(f"⚠️ Error en fila {i}: {e}")
                continue
        
        conn.commit()
        logger.info(f"✅ {registros_insertados} ubicaciones importadas exitosamente")
        
        # Verificar datos insertados
        cursor.execute("SELECT COUNT(*) FROM ubicaciones")
        total = cursor.fetchone()[0]
        logger.info(f"📊 Total de ubicaciones en BD: {total}")
        
        # Mostrar algunos ejemplos
        cursor.execute("""
            SELECT departamento, ciudad, codigo_departamento, codigo_ciudad 
            FROM ubicaciones 
            LIMIT 10
        """)
        logger.info("📋 Ejemplos de ubicaciones insertadas:")
        for row in cursor.fetchall():
            logger.info(f"   {row[0]} - {row[1]} (Código: {row[2]}-{row[3]})")
        
        cursor.close()
        conn.close()
        logger.info("🎉 ¡Importación completada exitosamente!")
        
    except Exception as e:
        logger.error(f"❌ Error importando ubicaciones: {e}")
        import traceback
        traceback.print_exc()
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    importar_ubicaciones()

