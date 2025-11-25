# -*- coding: utf-8 -*-
import pandas as pd
import re, unicodedata, sys, io, base64
from pathlib import Path
from math import ceil
import logging

logger = logging.getLogger(__name__)

# Parámetros por defecto
CHUNK_SIZE = 495
SHEET_NAME_OUT = "Terceros"
OMITIR_DOC    = "52333195"

ENCABEZADOS = [
    "Identificación (Obligatorio)","Dígito de verificación","Código Sucursal","Tipo identificación (Obligatorio)",
    "Tipo (Obligatorio)","Razón social (Obligatorio)","Nombres del tercero (Obligatorio)","Apellidos del tercero (Obligatorio)",
    "Nombre Comercial","Dirección","Código país","Código departamento/estado","Código ciudad","Indicativo teléfono principal",
    "Teléfono principal","Extensión teléfono principal","Tipo de régimen IVA","Código Responsabilidad fiscal","Código Postal",
    "Nombres contacto principal","Apellidos contacto principal","Indicativo teléfono contacto principal","Teléfono contacto principal",
    "Extensión teléfono contacto principal","Correo electrónico contacto principal","Clientes","Estado"
]

# ---------- Utilidades ----------
def solo_digitos(s:str)->str:
    return re.sub(r"\D+","",str(s or ""))

def normalizar_texto(s:str)->str:
    if s is None: return ""
    s = str(s).replace("\xa0"," ")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if unicodedata.category(c)!="Mn")
    s = re.sub(r"\s+"," ", s.strip())
    return s

def norm_header(h:str)->str:
    h = normalizar_texto(h).lower()
    h = re.sub(r"[^a-z0-9\s]"," ", h)
    h = re.sub(r"\s+"," ", h).strip()
    return h

def es_consumidor_final_exact(nombre:str)->bool:
    return normalizar_texto(nombre).lower() == "consumidor final"

def clasificar_tipo_id(doc:str)->str:
    d = solo_digitos(doc)
    
    # Si tiene exactamente 9 dígitos y empieza con 800-999: NIT de empresa (31)
    if len(d) == 9 and d[:3].isdigit() and 800 <= int(d[:3]) <= 999:
        return "31"
    
    # Si tiene exactamente 8 dígitos: Cédula de persona natural (13)
    elif len(d) == 8:
        return "13"
    
    # Si tiene 10 dígitos: Cédula extendida de persona natural (13)
    elif len(d) == 10:
        return "13"
    
    # Si tiene 7 dígitos: Cédula corta de persona natural (13)
    elif len(d) == 7:
        return "13"
    
    # Para otros casos, usar lógica anterior como fallback
    elif len(d) >= 3 and d[:3].isdigit() and 800 <= int(d[:3]) <= 999:
        return "31"
    
    # Por defecto: persona natural
    else:
        return "13"

def partir_nombres_apellidos(nombre_completo:str):
    n = normalizar_texto(nombre_completo)
    if not n: return "",""
    p = n.split()
    if len(p)==1: return p[0],""
    if len(p)==2: return p[0],p[1]
    return " ".join(p[:-2]), " ".join(p[-2:])

def procesar_terceros(excel_dian_content, nit_empresa, configuracion_terceros=None, datos_empresa=None):
    """
    Procesa archivo DIAN para extraer información de terceros (emisores y receptores)
    
    Args:
        excel_dian_content: Contenido del archivo Excel de la DIAN
        nit_empresa: NIT de la empresa
        configuracion_terceros: Configuración específica para terceros (opcional)
        datos_empresa: Datos de la empresa (dirección, código ciudad, etc.)
    
    Returns:
        dict: Diccionario con información de los archivos generados
    """
    try:
        # Verificar que se proporcionaron datos de la empresa
        if not datos_empresa:
            raise Exception("No se proporcionaron datos de la empresa. Es necesario configurar la dirección, código de departamento y código de ciudad de la empresa.")
        
        # Configurar parámetros de la empresa
        codigo_pais = datos_empresa.get('codigo_pais')
        codigo_depto = datos_empresa.get('codigo_departamento')
        codigo_ciudad = datos_empresa.get('codigo_ciudad')
        direccion_def = datos_empresa.get('direccion')
        
        # Verificar que todos los campos necesarios estén presentes
        if not codigo_depto or not codigo_ciudad or not direccion_def:
            raise Exception("Faltan datos de la empresa. Se requiere: código de departamento, código de ciudad y dirección.")
        
        # Validar que el contenido del archivo no esté vacío
        if not excel_dian_content or len(excel_dian_content) == 0:
            raise Exception("El archivo DIAN está vacío o no se pudo leer correctamente")
        
        # Leer el archivo Excel desde el contenido
        # Usar engine='openpyxl' explícitamente para asegurar lectura correcta
        try:
            df = pd.read_excel(io.BytesIO(excel_dian_content), engine='openpyxl')
        except Exception as e:
            # Intentar con xlrd como fallback
            try:
                df = pd.read_excel(io.BytesIO(excel_dian_content), engine='xlrd')
            except Exception as e2:
                raise Exception(f"No se pudo leer el archivo Excel. Error: {str(e)}")
        
        # Validar que el DataFrame no esté vacío
        if df.empty:
            raise Exception("El archivo Excel está vacío o no contiene datos válidos")
        
        # Normalizar columnas
        df.columns = [normalizar_texto(c) for c in df.columns]
        df = df.fillna("")
        
        # Sinónimos para detectar columnas (más amplios y agresivos)
        NIT_EMISOR_SYNS   = ["nit emisor","identificacion emisor","doc emisor","documento emisor","nit proveedor","identificacion proveedor","doc proveedor","nit","identificacion","documento","doc","cedula","cedula emisor","cedula proveedor","numero","numero documento","id","identificador"]
        NOM_EMISOR_SYNS   = ["nombre emisor","razon social emisor","nombre proveedor","razon social proveedor","emisor nombre","proveedor nombre","nombre","razon social","razon","proveedor","emisor","denominacion","empresa","compania","firma","marca"]
        NIT_RECEPTOR_SYNS = ["nit receptor","identificacion receptor","doc receptor","documento receptor","nit cliente","identificacion cliente","doc cliente","nit comprador","nit","identificacion","documento","doc","cedula","cedula receptor","cedula cliente","numero","numero documento","id","identificador"]
        NOM_RECEPTOR_SYNS = ["nombre receptor","razon social receptor","nombre cliente","razon social cliente","receptor nombre","cliente nombre","comprador nombre","nombre","razon social","razon","cliente","receptor","comprador","denominacion","empresa","compania","firma","marca"]

        def encontrar_columna(cols_map, syns):
            # cols_map: {original->normalizado}
            for syn in syns:
                for orig, norm in cols_map.items():
                    if norm == syn: return orig
            for syn in syns:
                for orig, norm in cols_map.items():
                    if syn in norm or norm in syn: return orig
            return None

        def heuristica_por_contenido(df):
            nit_cands, nom_cands = [], []
            for c in df.columns:
                s = df[c].astype(str).str.strip()
                if len(s)==0: continue
                # Calcular ratios de dígitos y letras
                digit_ratio  = s.map(lambda x: len(re.sub(r"\D","",x))/len(x) if len(x)>0 else 0).mean()
                letter_ratio = s.map(lambda x: len(re.sub(r"[^A-Za-z\s]","",x))/len(x) if len(x)>0 else 0).mean()
                
                # Criterios más flexibles
                if digit_ratio >= 0.3: nit_cands.append(c)  # Más flexible para NITs
                if letter_ratio >= 0.4: nom_cands.append(c)  # Más flexible para nombres
            
            return nit_cands, nom_cands

        # Detectar columnas
        cols_norm = {orig: norm_header(orig) for orig in df.columns}
        
        ne = encontrar_columna(cols_norm, NIT_EMISOR_SYNS)
        me = encontrar_columna(cols_norm, NOM_EMISOR_SYNS)
        nr = encontrar_columna(cols_norm, NIT_RECEPTOR_SYNS)
        mr = encontrar_columna(cols_norm, NOM_RECEPTOR_SYNS)

        if not (ne and me and nr and mr):
            nit_cands, nom_cands = heuristica_por_contenido(df)
            if not ne and nit_cands: ne = nit_cands[0]
            if not nr and len(nit_cands)>1: nr = nit_cands[1] if nit_cands[1]!=ne else nit_cands[0]
            if not me and nom_cands: me = nom_cands[0]
            if not mr and len(nom_cands)>1: mr = nom_cands[1] if nom_cands[1]!=me else nom_cands[0]
        
        # Fallback: si aún no encontramos columnas, usar las primeras disponibles
        if not ne and len(df.columns) > 0:
            ne = df.columns[0]
        if not me and len(df.columns) > 1:
            me = df.columns[1]
        if not nr and len(df.columns) > 2:
            nr = df.columns[2]
        if not mr and len(df.columns) > 3:
            mr = df.columns[3]

        map_cols = {"nit_emisor": ne, "nom_emisor": me, "nit_receptor": nr, "nom_receptor": mr}
        
        ne, me, nr, mr = map_cols["nit_emisor"], map_cols["nom_emisor"], map_cols["nit_receptor"], map_cols["nom_receptor"]

        # Construcción de terceros
        registros = []
        
        def agregar_tercero(doc, nombre):
            # Convertir a string y limpiar
            doc_str = str(doc).strip() if doc is not None else ""
            nombre_str = str(nombre).strip() if nombre is not None else ""
            
            # Si no hay documento o nombre, no agregar
            if not doc_str or not nombre_str:
                return False
            
            # Extraer solo dígitos del documento
            d = solo_digitos(doc_str)
            n = normalizar_texto(nombre_str)
            
            # Validaciones más permisivas
            if not d or len(d) < 3:  # Mínimo 3 dígitos
                return False
            if d == solo_digitos(OMITIR_DOC): 
                return False
            if es_consumidor_final_exact(n): 
                return False
            
            # Evitar duplicados
            for registro_existente in registros:
                if registro_existente["Identificación (Obligatorio)"] == d:
                    return False
            
            tipo_id = clasificar_tipo_id(d)
            fila = {k:"" for k in ENCABEZADOS}
            fila["Identificación (Obligatorio)"] = d
            fila["Tipo identificación (Obligatorio)"] = tipo_id
            fila["Tipo (Obligatorio)"] = "Empresa" if tipo_id=="31" else "Es persona"
            if tipo_id=="31":
                fila["Razón social (Obligatorio)"] = n
            else:
                nom, ape = partir_nombres_apellidos(n)
                fila["Nombres del tercero (Obligatorio)"] = nom
                fila["Apellidos del tercero (Obligatorio)"] = ape
            # Usar parámetros de la empresa
            fila["Dirección"] = direccion_def
            fila["Código país"] = codigo_pais
            fila["Código departamento/estado"] = codigo_depto
            fila["Código ciudad"] = codigo_ciudad
            registros.append(fila)
            return True

        ag_emi = ag_rec = 0
        
        # Procesar emisores
        if ne and me and ne in df.columns and me in df.columns:
            for _, r in df.iterrows():
                if agregar_tercero(r[ne], r[me]): ag_emi += 1
        
        # Procesar receptores
        if nr and mr and nr in df.columns and mr in df.columns:
            for _, r in df.iterrows():
                if agregar_tercero(r[nr], r[mr]): ag_rec += 1
        
        # Si no se encontraron terceros, intentar con las primeras columnas
        if ag_emi == 0 and ag_rec == 0 and len(df.columns) >= 2:
            col1, col2 = df.columns[0], df.columns[1]
            
            # Intentar como emisor/receptor
            for _, r in df.iterrows():
                if agregar_tercero(r[col1], r[col2]): ag_emi += 1
        
        # Si aún no hay terceros, intentar con TODAS las columnas del archivo
        if ag_emi == 0 and ag_rec == 0:
            # Procesar todas las columnas que parezcan ser NIT/nombre
            for i in range(0, len(df.columns), 2):  # Procesar de a pares
                if i + 1 < len(df.columns):
                    col_nit = df.columns[i]
                    col_nombre = df.columns[i + 1]
                    
                    for _, r in df.iterrows():
                        if agregar_tercero(r[col_nit], r[col_nombre]): 
                            ag_emi += 1
                    
                    if ag_emi > 0:
                        break
            
            # Si aún no hay nada, procesar todas las filas con las primeras columnas
            if ag_emi == 0 and len(df.columns) >= 2:
                col1, col2 = df.columns[0], df.columns[1]
                for _, r in df.iterrows():
                    if agregar_tercero(r[col1], r[col2]): 
                        ag_emi += 1

        terceros = pd.DataFrame(registros, columns=ENCABEZADOS).fillna("")
        if not terceros.empty:
            terceros = terceros.drop_duplicates(subset=["Identificación (Obligatorio)"], keep="first")
        
        # Generar archivos Excel en memoria
        archivos_generados = []
        
        if terceros.empty:
            # Crear un archivo vacío con estructura
            output_buffer = io.BytesIO()
            terceros.to_excel(output_buffer, index=False, sheet_name=SHEET_NAME_OUT)
            output_buffer.seek(0)
            
            archivos_generados.append({
                "nombre": f"Terceros-{nit_empresa}-1.xlsx",
                "contenido": base64.b64encode(output_buffer.getvalue()).decode('utf-8'),
                "tipo": "terceros"
            })
        else:
            total = len(terceros)
            num_files = ceil(total / CHUNK_SIZE)
            
            for i in range(num_files):
                chunk = terceros.iloc[i*CHUNK_SIZE : min((i+1)*CHUNK_SIZE, total)].copy()
                
                output_buffer = io.BytesIO()
                chunk.to_excel(output_buffer, index=False, sheet_name=SHEET_NAME_OUT)
                output_buffer.seek(0)
                
                archivos_generados.append({
                    "nombre": f"Terceros-{nit_empresa}-{i+1}.xlsx",
                    "contenido": base64.b64encode(output_buffer.getvalue()).decode('utf-8'),
                    "tipo": "terceros"
                })
        
        return {
            "archivos_generados": archivos_generados,
            "estadisticas": {
                "terceros_emisores": ag_emi,
                "terceros_receptores": ag_rec,
                "terceros_unicos": len(terceros),
                "archivos_generados": len(archivos_generados)
            },
            "tipo_procesamiento": "terceros"
        }
        
    except Exception as e:
        raise Exception(f"Error procesando terceros: {str(e)}")



