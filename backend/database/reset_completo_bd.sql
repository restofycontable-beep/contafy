-- =====================================================
-- RESET COMPLETO DE BASE DE DATOS
-- ContRestofySas - Eliminación total y recreación
-- =====================================================

-- PASO 1: ELIMINAR ABSOLUTAMENTE TODO
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Eliminar todas las tablas
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Eliminar todas las funciones
    FOR r IN (SELECT proname FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || ' CASCADE';
    END LOOP;
    
    -- Eliminar todas las secuencias
    FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequencename) || ' CASCADE';
    END LOOP;
    
    -- Eliminar todos los tipos personalizados
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'c')
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

-- Mensaje de confirmación de limpieza
SELECT 'Base de datos completamente limpia' as mensaje;

-- PASO 2: RECREAR ESTRUCTURA OPTIMIZADA DESDE CERO
-- Configurar zona horaria
SET timezone = 'America/Bogota';

-- =====================================================
-- TABLA: users
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),

-- Estados del usuario
is_active BOOLEAN DEFAULT TRUE,
is_verified BOOLEAN DEFAULT FALSE,
is_superuser BOOLEAN DEFAULT FALSE,

-- Auditoría
created_at TIMESTAMP
WITH
    TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
WITH
    TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
WITH
    TIME ZONE,

-- Recuperación de contraseña
reset_token VARCHAR(255),
reset_token_expires TIMESTAMP WITH TIME ZONE
);

-- Crear índices para users
CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_users_username ON users (username);

CREATE INDEX idx_users_active ON users (is_active);

CREATE INDEX idx_users_reset_token ON users (reset_token);

-- -----------------------------------------------------
-- INSERTAR USUARIO ADMINISTRADOR POR DEFECTO (ID=1)
-- -----------------------------------------------------
-- Contraseña: admin123 (hash bcrypt)
INSERT INTO
    users (
        id,
        email,
        username,
        hashed_password,
        full_name,
        is_active,
        is_verified,
        is_superuser
    )
VALUES (
        1,
        'admin@contrestofysas.com',
        'admin',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewbYNtZp7mOCpHGq', -- admin123
        'Administrador ContRestofySas',
        TRUE,
        TRUE,
        TRUE
    ) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TABLA: empresas
-- =====================================================
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

-- Información básica
nit VARCHAR(20) UNIQUE NOT NULL,
razon_social VARCHAR(255) NOT NULL,
nombre_comercial VARCHAR(255),

-- Representante legal
representante_nombre VARCHAR(255), representante_nit VARCHAR(20),

-- Información de ubicación
direccion VARCHAR(500),
codigo_pais VARCHAR(10) DEFAULT 'Co',
codigo_departamento VARCHAR(10),
codigo_ciudad VARCHAR(10),

-- Token RestofySAS
restofysas_token VARCHAR(500),

-- URL de Restofy (opcional) - Cada empresa tiene su propia URL completa
restofy_url VARCHAR(500),

-- Indicador si la empresa está vinculada con Restofy
vinculada_restofy BOOLEAN DEFAULT FALSE NOT NULL,

-- Configuración de comprobantes (JSON)
configuracion_comprobantes VARCHAR(1000),

-- Configuración de comprobantes de compras (JSON)
configuracion_comprobantes_compras VARCHAR(1000),

-- Registro de cuentas (JSON) - Compatibilidad hacia atrás
registro_cuentas VARCHAR(5000),

-- Registro de cuentas separadas (JSON)
registro_cuentas_ventas VARCHAR(2500),
registro_cuentas_compras VARCHAR(2500),

-- Registro de cuentas específicas - 10 cuentas cada una
registro_cuentas_factura_venta VARCHAR(5000),
registro_cuentas_nota_credito VARCHAR(5000),

-- Registro de cuentas específicas de compras - 10 cuentas cada una
registro_cuentas_factura_compra VARCHAR(5000),
registro_cuentas_nota_credito_compra VARCHAR(5000),

-- Relación con usuario
usuario_id INTEGER REFERENCES users(id) );

-- -----------------------------------------------------
-- INSERTAR EMPRESA POR DEFECTO (ID=1)
-- -----------------------------------------------------
-- Nota: Este INSERT se debe ejecutar después de crear el primer usuario administrador
INSERT INTO
    empresas (
        id,
        nit,
        razon_social,
        nombre_comercial,
        representante_nombre,
        representante_nit,
        direccion,
        codigo_pais,
        codigo_departamento,
        codigo_ciudad,
        restofysas_token,
        restofy_url,
        vinculada_restofy,
        configuracion_comprobantes,
        configuracion_comprobantes_compras,
        registro_cuentas,
        registro_cuentas_ventas,
        registro_cuentas_compras,
        registro_cuentas_factura_venta,
        registro_cuentas_nota_credito,
        registro_cuentas_factura_compra,
        registro_cuentas_nota_credito_compra,
        usuario_id
    )
VALUES (
        1,
        '9016452317',
        'ContRestofySas',
        'ContRestofySas',
        'Administrador',
        '9016452317',
        NULL, -- direccion
        'Co', -- codigo_pais
        NULL, -- codigo_departamento
        NULL, -- codigo_ciudad
        NULL, -- El token se debe configurar después
        NULL, -- restofy_url - Se debe configurar si la empresa usa Restofy
        FALSE, -- vinculada_restofy - Por defecto no está vinculada
        NULL, -- configuracion_comprobantes - Cada empresa debe configurar los suyos
        NULL, -- configuracion_comprobantes_compras - Cada empresa debe configurar los suyos
        NULL, -- registro_cuentas_ventas
        NULL, -- registro_cuentas_compras
        NULL, -- registro_cuentas_factura_venta
        NULL, -- registro_cuentas_nota_credito
        NULL, -- registro_cuentas_factura_compra
        NULL, -- registro_cuentas_nota_credito_compra
        1 -- Este ID debe corresponder al primer usuario administrador
    ) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- TABLA: archivos_procesados
-- =====================================================
CREATE TABLE archivos_procesados (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

-- Información del archivo
nombre_archivo VARCHAR(255) NOT NULL,
nombre_original VARCHAR(255) NOT NULL,
contenido BYTEA NOT NULL,
tipo_archivo VARCHAR(100) DEFAULT 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
tamano_bytes INTEGER NOT NULL,

-- Fechas
fecha_procesamiento TIMESTAMP
WITH
    TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP
WITH
    TIME ZONE NULL,

-- Metadatos
descripcion TEXT, estado VARCHAR(20) DEFAULT 'subido',

-- Campos adicionales según el script scripts.py
empresa_id INTEGER REFERENCES empresas (id),
usuario_id INTEGER REFERENCES users (id) NOT NULL,
numero_modelo INTEGER,
total_documentos INTEGER,
filas_procesadas INTEGER,

-- Validaciones
CONSTRAINT chk_estado_archivo CHECK (estado IN ('subido', 'procesando', 'procesado', 'error', 'eliminado')),
    CONSTRAINT chk_tipo_archivo_dian CHECK (tipo_archivo IN (
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/pdf',
        'application/xml',
        'text/plain'
    ))
);

-- =====================================================
-- TABLA: archivos_zip_generados
-- =====================================================
CREATE TABLE archivos_zip_generados (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

-- Información del archivo ZIP
nombre_archivo VARCHAR(255) NOT NULL,
contenido_zip BYTEA NOT NULL,
tamano_bytes INTEGER NOT NULL,

-- Información del procesamiento
tipo_procesamiento VARCHAR(20) NOT NULL, -- 'ventas' o 'compras'
numero_cedula VARCHAR(20) NOT NULL,
fecha_generacion TIMESTAMP
WITH
    TIME ZONE DEFAULT CURRENT_TIMESTAMP,

-- Metadatos
descripcion TEXT,
estado VARCHAR(20) DEFAULT 'generado', -- generado, descargado, eliminado

-- Relaciones
empresa_id INTEGER REFERENCES empresas (id) NOT NULL,
usuario_id INTEGER REFERENCES users (id) NOT NULL,

-- Validaciones
CONSTRAINT chk_tipo_procesamiento CHECK (tipo_procesamiento IN ('ventas', 'compras')),
    CONSTRAINT chk_estado_zip CHECK (estado IN ('generado', 'descargado', 'eliminado'))
);

-- =====================================================
-- ÍNDICES OPTIMIZADOS
-- =====================================================

-- Empresas
CREATE INDEX idx_empresas_nit ON empresas (nit);

CREATE INDEX idx_empresas_activa ON empresas (is_active);

CREATE INDEX idx_empresas_usuario_id ON empresas (usuario_id);

CREATE INDEX idx_empresas_representante_nit ON empresas (representante_nit);

-- Archivos procesados
CREATE INDEX idx_archivos_procesados_estado ON archivos_procesados (estado);

CREATE INDEX idx_archivos_procesados_fecha ON archivos_procesados (fecha_procesamiento);

CREATE INDEX idx_archivos_procesados_nombre ON archivos_procesados (nombre_archivo);

CREATE INDEX idx_archivos_procesados_empresa ON archivos_procesados (empresa_id);

CREATE INDEX idx_archivos_procesados_numero_modelo ON archivos_procesados (numero_modelo);

CREATE INDEX idx_archivos_procesados_filas_procesadas ON archivos_procesados (filas_procesadas);

CREATE INDEX idx_archivos_procesados_usuario_id ON archivos_procesados (usuario_id);

-- Archivos ZIP generados
CREATE INDEX idx_archivos_zip_tipo ON archivos_zip_generados (tipo_procesamiento);

CREATE INDEX idx_archivos_zip_cedula ON archivos_zip_generados (numero_cedula);

CREATE INDEX idx_archivos_zip_fecha ON archivos_zip_generados (fecha_generacion);

CREATE INDEX idx_archivos_zip_empresa ON archivos_zip_generados (empresa_id);

CREATE INDEX idx_archivos_zip_usuario ON archivos_zip_generados (usuario_id);

CREATE INDEX idx_archivos_zip_estado ON archivos_zip_generados (estado);

-- =====================================================
-- TRIGGERS Y FUNCIONES
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
CREATE TRIGGER update_empresas_updated_at
    BEFORE UPDATE ON empresas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_archivos_procesados_updated_at
    BEFORE UPDATE ON archivos_procesados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_archivos_zip_generados_updated_at
    BEFORE UPDATE ON archivos_zip_generados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MENSAJES DE CONFIRMACIÓN
-- =====================================================

SELECT 'RESET COMPLETO EXITOSO' as resultado;

SELECT 'Base de datos completamente limpia y recreada' as mensaje;

SELECT 'Tablas creadas: empresas, users, archivos_procesados' as tablas;

SELECT 'Empresa ContRestofySas insertada' as datos;

SELECT 'Sistema listo para usar' as final;

-- Tabla para cuentas importadas desde Excel
CREATE TABLE IF NOT EXISTS cuentas_importadas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    empresa_id INTEGER REFERENCES empresas (id) ON DELETE CASCADE,
    nit VARCHAR(20) NOT NULL,
    nombre TEXT NOT NULL,
    cuenta VARCHAR(20) NOT NULL,
    cuenta_exenta VARCHAR(20),
    cuenta_iva VARCHAR(20),
    cuenta_contrapartida VARCHAR(20),
    fecha_importacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_cuentas_importadas_user_id ON cuentas_importadas (user_id);

CREATE INDEX IF NOT EXISTS idx_cuentas_importadas_empresa_id ON cuentas_importadas (empresa_id);

CREATE INDEX IF NOT EXISTS idx_cuentas_importadas_nit ON cuentas_importadas (nit);

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar fecha_actualizacion
CREATE TRIGGER trigger_update_fecha_actualizacion
    BEFORE UPDATE ON cuentas_importadas
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();