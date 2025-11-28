SET statement_timeout = 0;

SET lock_timeout = 0;

SET idle_in_transaction_session_timeout = 0;

SET transaction_timeout = 0;

SET client_encoding = 'UTF8';

SET standard_conforming_strings = on;

SELECT pg_catalog.set_config ('search_path', '', false);

SET check_function_bodies = false;

SET xmloption = content;

SET client_min_messages = warning;

SET row_security = off;

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    full_name character varying(255),
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    is_superuser boolean DEFAULT false,
    created_at timestamp
    with
        time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp
    with
        time zone DEFAULT CURRENT_TIMESTAMP,
        last_login timestamp
    with
        time zone,
        reset_token character varying(255),
        reset_token_expires timestamp
    with
        time zone
);

ALTER TABLE public.users OWNER TO postgres;

CREATE SEQUENCE public.users_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

CREATE TABLE public.empresas (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    nit character varying(20) NOT NULL,
    razon_social character varying(255) NOT NULL,
    nombre_comercial character varying(255),
    representante_nombre character varying(255),
    representante_nit character varying(20),
    direccion character varying(500),
    codigo_pais character varying(10) DEFAULT 'Co'::character varying,
    codigo_departamento character varying(10),
    codigo_ciudad character varying(10),
    usuario_id integer NOT NULL
);

ALTER TABLE public.empresas OWNER TO postgres;

CREATE SEQUENCE public.empresas_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.empresas_id_seq OWNER TO postgres;

ALTER SEQUENCE public.empresas_id_seq OWNED BY public.empresas.id;

CREATE TABLE public.archivos_procesados (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    nombre_archivo character varying(255) NOT NULL,
    nombre_original character varying(255) NOT NULL,
    contenido bytea NOT NULL,
    tipo_archivo character varying(100) DEFAULT 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'::character varying,
    tamano_bytes integer NOT NULL,
    fecha_procesamiento timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion timestamp with time zone,
    descripcion text,
    estado character varying(20) DEFAULT 'subido'::character varying,
    empresa_id integer,
    usuario_id integer NOT NULL,
    numero_modelo integer,
    total_documentos integer,
    filas_procesadas integer,
    CONSTRAINT chk_estado_archivo CHECK (((estado)::text = ANY ((ARRAY['subido'::character varying, 'procesando'::character varying, 'procesado'::character varying, 'error'::character varying, 'eliminado'::character varying])::text[]))),
    CONSTRAINT chk_tipo_archivo_dian CHECK (((tipo_archivo)::text = ANY ((ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'::character varying, 'text/csv'::character varying, 'application/pdf'::character varying, 'application/xml'::character varying, 'text/plain'::character varying])::text[])))
);

ALTER TABLE public.archivos_procesados OWNER TO postgres;

CREATE SEQUENCE public.archivos_procesados_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.archivos_procesados_id_seq OWNER TO postgres;

ALTER SEQUENCE public.archivos_procesados_id_seq OWNED BY public.archivos_procesados.id;

CREATE TABLE public.archivos_zip_generados (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    nombre_archivo character varying(255) NOT NULL,
    contenido_zip bytea NOT NULL,
    tamano_bytes integer NOT NULL,
    tipo_procesamiento character varying(20) NOT NULL,
    numero_cedula character varying(20) NOT NULL,
    fecha_generacion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    descripcion text,
    estado character varying(20) DEFAULT 'generado'::character varying,
    empresa_id integer NOT NULL,
    usuario_id integer NOT NULL,
    CONSTRAINT chk_tipo_procesamiento CHECK (((tipo_procesamiento)::text = ANY ((ARRAY['ventas'::character varying, 'compras'::character varying])::text[]))),
    CONSTRAINT chk_estado_zip CHECK (((estado)::text = ANY ((ARRAY['generado'::character varying, 'descargado'::character varying, 'eliminado'::character varying])::text[])))
);

ALTER TABLE public.archivos_zip_generados OWNER TO postgres;

CREATE SEQUENCE public.archivos_zip_generados_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.archivos_zip_generados_id_seq OWNER TO postgres;

ALTER SEQUENCE public.archivos_zip_generados_id_seq OWNED BY public.archivos_zip_generados.id;

CREATE TABLE public.datos_del_documento (
    id integer NOT NULL,
    fecha_recepcion timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    empresa_id integer NOT NULL,
    usuario_id integer NOT NULL,
    codigo_unico_factura_cufe character varying(200) NOT NULL,
    numero_factura character varying(50) NOT NULL,
    fecha_emision date NOT NULL,
    fecha_vencimiento date,
    tipo_operacion character varying(10),
    tipo_operacion_descripcion character varying(100),
    forma_pago character varying(50),
    medio_pago character varying(50),
    orden_pedido character varying(100),
    fecha_orden_pedido date,
    CONSTRAINT chk_tipo_operacion CHECK (((tipo_operacion)::text = ANY ((ARRAY['10'::character varying, '20'::character varying, '30'::character varying, '40'::character varying])::text[])))
);

ALTER TABLE public.datos_del_documento OWNER TO postgres;

CREATE SEQUENCE public.datos_del_documento_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.datos_del_documento_id_seq OWNER TO postgres;

ALTER SEQUENCE public.datos_del_documento_id_seq OWNED BY public.datos_del_documento.id;

CREATE TABLE public.datos_del_adquiriente_comprador (
    id integer NOT NULL,
    datos_del_documento_id integer NOT NULL,
    nombre_razon_social character varying(255) NOT NULL,
    tipo_documento character varying(50),
    numero_documento character varying(20) NOT NULL,
    tipo_contribuyente character varying(50),
    regimen_fiscal character varying(50),
    responsabilidad_tributaria character varying(50),
    pais character varying(100) DEFAULT 'Colombia'::character varying,
    departamento character varying(100),
    municipio_ciudad character varying(100),
    direccion text,
    telefono_movil character varying(20),
    correo character varying(255)
);

ALTER TABLE public.datos_del_adquiriente_comprador OWNER TO postgres;

CREATE SEQUENCE public.datos_del_adquiriente_comprador_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.datos_del_adquiriente_comprador_id_seq OWNER TO postgres;

ALTER SEQUENCE public.datos_del_adquiriente_comprador_id_seq OWNED BY public.datos_del_adquiriente_comprador.id;

CREATE TABLE public.datos_del_emisor_vendedor (
    id integer NOT NULL,
    datos_del_documento_id integer NOT NULL,
    razon_social character varying(255) NOT NULL,
    nombre_comercial character varying(255),
    nit_emisor character varying(20) NOT NULL,
    tipo_contribuyente character varying(50),
    regimen_fiscal character varying(50),
    responsabilidad_tributaria character varying(50),
    actividad_economica character varying(255),
    pais character varying(100) DEFAULT 'Colombia'::character varying,
    departamento character varying(100),
    municipio_ciudad character varying(100),
    direccion text,
    telefono_movil character varying(20),
    correo character varying(255)
);

ALTER TABLE public.datos_del_emisor_vendedor OWNER TO postgres;

CREATE SEQUENCE public.datos_del_emisor_vendedor_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.datos_del_emisor_vendedor_id_seq OWNER TO postgres;

ALTER SEQUENCE public.datos_del_emisor_vendedor_id_seq OWNED BY public.datos_del_emisor_vendedor.id;

CREATE TABLE public.datos_totales (
    id integer NOT NULL,
    datos_del_documento_id integer NOT NULL,
    documento_generado_el timestamp
    with
        time zone,
        documento_validado_por_dian timestamp
    with
        time zone,
        xml_generado_por character varying(255),
        xml_generado_por_nit character varying(20),
        pdf_generado_por character varying(255),
        pdf_generado_por_nit character varying(20),
        qr_code text
);

ALTER TABLE public.datos_totales OWNER TO postgres;

CREATE SEQUENCE public.datos_totales_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.datos_totales_id_seq OWNER TO postgres;

ALTER SEQUENCE public.datos_totales_id_seq OWNED BY public.datos_totales.id;

CREATE TABLE public.detalles_de_productos (
    id integer NOT NULL,
    datos_del_documento_id integer NOT NULL,
    nro integer NOT NULL,
    codigo character varying(50),
    descripcion text NOT NULL,
    um character varying(10),
    cantidad numeric(18, 2) NOT NULL,
    precio_unitario numeric(18, 2) NOT NULL,
    descuento_detalle numeric(18, 2) DEFAULT 0.00,
    recargo_detalle numeric(18, 2) DEFAULT 0.00,
    iva numeric(18, 2) DEFAULT 0.00,
    iva_porcentaje numeric(5, 2) DEFAULT 0.00,
    inc numeric(18, 2) DEFAULT 0.00,
    inc_porcentaje numeric(5, 2) DEFAULT 0.00,
    precio_unitario_venta numeric(18, 2) NOT NULL
);

ALTER TABLE public.detalles_de_productos OWNER TO postgres;

CREATE SEQUENCE public.detalles_de_productos_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.detalles_de_productos_id_seq OWNER TO postgres;

ALTER SEQUENCE public.detalles_de_productos_id_seq OWNED BY public.detalles_de_productos.id;

CREATE TABLE public.descuentos_y_recargos_globales (
    id integer NOT NULL,
    datos_del_documento_id integer NOT NULL,
    nro integer NOT NULL,
    tipo character varying(20) NOT NULL,
    codigo character varying(50),
    descripcion text NOT NULL,
    porcentaje numeric(10,4),
    valor numeric(18,2) NOT NULL,
    CONSTRAINT chk_tipo CHECK (((tipo)::text = ANY ((ARRAY['Cargo'::character varying, 'Descuento'::character varying])::text[])))
);

ALTER TABLE public.descuentos_y_recargos_globales OWNER TO postgres;

CREATE SEQUENCE public.descuentos_y_recargos_globales_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.descuentos_y_recargos_globales_id_seq OWNER TO postgres;

ALTER SEQUENCE public.descuentos_y_recargos_globales_id_seq OWNED BY public.descuentos_y_recargos_globales.id;

CREATE TABLE public.resumen_financiero (
    id integer NOT NULL,
    datos_totales_id integer NOT NULL,
    moneda character varying(10),
    tasa_cambio numeric(18, 6),
    subtotal numeric(18, 2) DEFAULT 0.00,
    descuento_detalle numeric(18, 2) DEFAULT 0.00,
    recargo_detalle numeric(18, 2) DEFAULT 0.00,
    total_bruto_factura numeric(18, 2) DEFAULT 0.00,
    iva numeric(18, 2) DEFAULT 0.00,
    inc numeric(18, 2) DEFAULT 0.00,
    bolsas numeric(18, 2) DEFAULT 0.00,
    otros_impuestos numeric(18, 2) DEFAULT 0.00,
    total_impuesto numeric(18, 2) DEFAULT 0.00,
    total_neto_factura numeric(18, 2) DEFAULT 0.00,
    descuento_global numeric(18, 2) DEFAULT 0.00,
    recargo_global numeric(18, 2) DEFAULT 0.00,
    total_factura numeric(18, 2) DEFAULT 0.00
);

ALTER TABLE public.resumen_financiero OWNER TO postgres;

CREATE SEQUENCE public.resumen_financiero_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.resumen_financiero_id_seq OWNER TO postgres;

ALTER SEQUENCE public.resumen_financiero_id_seq OWNED BY public.resumen_financiero.id;

CREATE TABLE public.valores_informativos (
    id integer NOT NULL,
    datos_totales_id integer NOT NULL,
    moneda character varying(10),
    anticipos numeric(18, 2) DEFAULT 0.00,
    rete_fuente numeric(18, 2) DEFAULT 0.00,
    rete_iva numeric(18, 2) DEFAULT 0.00,
    rete_ica numeric(18, 2) DEFAULT 0.00
);

ALTER TABLE public.valores_informativos OWNER TO postgres;

CREATE SEQUENCE public.valores_informativos_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.valores_informativos_id_seq OWNER TO postgres;

ALTER SEQUENCE public.valores_informativos_id_seq OWNED BY public.valores_informativos.id;

CREATE TABLE public.informacion_autorizacion (
    id integer NOT NULL,
    datos_totales_id integer NOT NULL,
    numero_autorizacion character varying(50) NOT NULL,
    rango_desde integer NOT NULL,
    rango_hasta integer NOT NULL,
    vigencia date NOT NULL
);

ALTER TABLE public.informacion_autorizacion OWNER TO postgres;

CREATE SEQUENCE public.informacion_autorizacion_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.informacion_autorizacion_id_seq OWNER TO postgres;

ALTER SEQUENCE public.informacion_autorizacion_id_seq OWNED BY public.informacion_autorizacion.id;

CREATE TABLE public.notas_finales (
    id integer NOT NULL,
    datos_del_documento_id integer NOT NULL,
    codigo character varying(50)
);

ALTER TABLE public.notas_finales OWNER TO postgres;

CREATE SEQUENCE public.notas_finales_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.notas_finales_id_seq OWNER TO postgres;

ALTER SEQUENCE public.notas_finales_id_seq OWNED BY public.notas_finales.id;

CREATE TABLE public.tipos_cuentas_globales (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL
);

ALTER TABLE public.tipos_cuentas_globales OWNER TO postgres;

CREATE SEQUENCE public.tipos_cuentas_globales_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.tipos_cuentas_globales_id_seq OWNER TO postgres;

ALTER SEQUENCE public.tipos_cuentas_globales_id_seq OWNED BY public.tipos_cuentas_globales.id;

CREATE TABLE public.cuentas_globales (
    id integer NOT NULL,
    is_active boolean DEFAULT true,
    empresa_id integer NOT NULL,
    tipo_cuenta_id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(255),
    descripcion text,
    orden integer DEFAULT 0
);

ALTER TABLE public.cuentas_globales OWNER TO postgres;

CREATE SEQUENCE public.cuentas_globales_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.cuentas_globales_id_seq OWNER TO postgres;

ALTER SEQUENCE public.cuentas_globales_id_seq OWNED BY public.cuentas_globales.id;

CREATE TABLE public.tipos_comprobantes (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    tipo_comprobante character varying(50) NOT NULL,
    categoria character varying(20) NOT NULL,
    codigo character varying(20) NOT NULL,
    activo boolean DEFAULT true,
    descripcion text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    CONSTRAINT chk_tipo_comprobante CHECK (((tipo_comprobante)::text = ANY ((ARRAY['factura'::character varying, 'nota_credito'::character varying, 'nota_debito'::character varying])::text[]))),
    CONSTRAINT chk_categoria CHECK (((categoria)::text = ANY ((ARRAY['venta'::character varying, 'compra'::character varying])::text[]))),
    CONSTRAINT tipos_comprobantes_empresa_tipo_categoria_key UNIQUE (empresa_id, tipo_comprobante, categoria)
);

ALTER TABLE public.tipos_comprobantes OWNER TO postgres;

CREATE SEQUENCE public.tipos_comprobantes_id_seq AS integer START
WITH
    1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.tipos_comprobantes_id_seq OWNER TO postgres;

ALTER SEQUENCE public.tipos_comprobantes_id_seq OWNED BY public.tipos_comprobantes.id;

ALTER TABLE ONLY public.archivos_procesados ALTER COLUMN id SET DEFAULT nextval('public.archivos_procesados_id_seq'::regclass);

ALTER TABLE ONLY public.archivos_zip_generados ALTER COLUMN id SET DEFAULT nextval('public.archivos_zip_generados_id_seq'::regclass);

ALTER TABLE ONLY public.cuentas_globales ALTER COLUMN id SET DEFAULT nextval('public.cuentas_globales_id_seq'::regclass);

ALTER TABLE ONLY public.datos_del_adquiriente_comprador ALTER COLUMN id SET DEFAULT nextval('public.datos_del_adquiriente_comprador_id_seq'::regclass);

ALTER TABLE ONLY public.datos_del_documento ALTER COLUMN id SET DEFAULT nextval('public.datos_del_documento_id_seq'::regclass);

ALTER TABLE ONLY public.datos_del_emisor_vendedor ALTER COLUMN id SET DEFAULT nextval('public.datos_del_emisor_vendedor_id_seq'::regclass);

ALTER TABLE ONLY public.datos_totales ALTER COLUMN id SET DEFAULT nextval('public.datos_totales_id_seq'::regclass);

ALTER TABLE ONLY public.descuentos_y_recargos_globales ALTER COLUMN id SET DEFAULT nextval('public.descuentos_y_recargos_globales_id_seq'::regclass);

ALTER TABLE ONLY public.detalles_de_productos ALTER COLUMN id SET DEFAULT nextval('public.detalles_de_productos_id_seq'::regclass);

ALTER TABLE ONLY public.empresas ALTER COLUMN id SET DEFAULT nextval('public.empresas_id_seq'::regclass);

ALTER TABLE ONLY public.informacion_autorizacion ALTER COLUMN id SET DEFAULT nextval('public.informacion_autorizacion_id_seq'::regclass);

ALTER TABLE ONLY public.notas_finales ALTER COLUMN id SET DEFAULT nextval('public.notas_finales_id_seq'::regclass);

ALTER TABLE ONLY public.resumen_financiero ALTER COLUMN id SET DEFAULT nextval('public.resumen_financiero_id_seq'::regclass);

ALTER TABLE ONLY public.tipos_cuentas_globales ALTER COLUMN id SET DEFAULT nextval('public.tipos_cuentas_globales_id_seq'::regclass);

ALTER TABLE ONLY public.tipos_comprobantes ALTER COLUMN id SET DEFAULT nextval('public.tipos_comprobantes_id_seq'::regclass);

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

ALTER TABLE ONLY public.valores_informativos ALTER COLUMN id SET DEFAULT nextval('public.valores_informativos_id_seq'::regclass);

ALTER TABLE ONLY public.archivos_procesados
ADD CONSTRAINT archivos_procesados_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.archivos_zip_generados
ADD CONSTRAINT archivos_zip_generados_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cuentas_globales
ADD CONSTRAINT cuentas_globales_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.datos_del_adquiriente_comprador
ADD CONSTRAINT datos_del_adquiriente_comprador_datos_del_documento_id_key UNIQUE (datos_del_documento_id);

ALTER TABLE ONLY public.datos_del_adquiriente_comprador
ADD CONSTRAINT datos_del_adquiriente_comprador_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.datos_del_documento
ADD CONSTRAINT datos_del_documento_codigo_unico_factura_cufe_key UNIQUE (codigo_unico_factura_cufe);

ALTER TABLE ONLY public.datos_del_documento
ADD CONSTRAINT datos_del_documento_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.datos_del_emisor_vendedor
ADD CONSTRAINT datos_del_emisor_vendedor_datos_del_documento_id_key UNIQUE (datos_del_documento_id);

ALTER TABLE ONLY public.datos_del_emisor_vendedor
ADD CONSTRAINT datos_del_emisor_vendedor_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.datos_totales
ADD CONSTRAINT datos_totales_datos_del_documento_id_key UNIQUE (datos_del_documento_id);

ALTER TABLE ONLY public.datos_totales
ADD CONSTRAINT datos_totales_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.descuentos_y_recargos_globales
ADD CONSTRAINT descuentos_y_recargos_globales_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.detalles_de_productos
ADD CONSTRAINT detalles_de_productos_datos_del_documento_id_nro_key UNIQUE (datos_del_documento_id, nro);

ALTER TABLE ONLY public.detalles_de_productos
ADD CONSTRAINT detalles_de_productos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.empresas
ADD CONSTRAINT empresas_nit_key UNIQUE (nit);

ALTER TABLE ONLY public.empresas
ADD CONSTRAINT empresas_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.informacion_autorizacion
ADD CONSTRAINT informacion_autorizacion_datos_totales_id_key UNIQUE (datos_totales_id);

ALTER TABLE ONLY public.informacion_autorizacion
ADD CONSTRAINT informacion_autorizacion_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notas_finales
ADD CONSTRAINT notas_finales_datos_del_documento_id_key UNIQUE (datos_del_documento_id);

ALTER TABLE ONLY public.notas_finales
ADD CONSTRAINT notas_finales_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.resumen_financiero
ADD CONSTRAINT resumen_financiero_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tipos_cuentas_globales
ADD CONSTRAINT tipos_cuentas_globales_nombre_key UNIQUE (nombre);

ALTER TABLE ONLY public.tipos_cuentas_globales
ADD CONSTRAINT tipos_cuentas_globales_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tipos_comprobantes
ADD CONSTRAINT tipos_comprobantes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
ADD CONSTRAINT users_username_key UNIQUE (username);

ALTER TABLE ONLY public.valores_informativos
ADD CONSTRAINT valores_informativos_pkey PRIMARY KEY (id);

CREATE INDEX idx_archivos_procesados_empresa ON public.archivos_procesados USING btree (empresa_id);

CREATE INDEX idx_archivos_procesados_estado ON public.archivos_procesados USING btree (estado);

CREATE INDEX idx_archivos_procesados_fecha ON public.archivos_procesados USING btree (fecha_procesamiento);

CREATE INDEX idx_archivos_procesados_filas_procesadas ON public.archivos_procesados USING btree (filas_procesadas);

CREATE INDEX idx_archivos_procesados_nombre ON public.archivos_procesados USING btree (nombre_archivo);

CREATE INDEX idx_archivos_procesados_numero_modelo ON public.archivos_procesados USING btree (numero_modelo);

CREATE INDEX idx_archivos_procesados_usuario_id ON public.archivos_procesados USING btree (usuario_id);

CREATE INDEX idx_archivos_zip_cedula ON public.archivos_zip_generados USING btree (numero_cedula);

CREATE INDEX idx_archivos_zip_empresa ON public.archivos_zip_generados USING btree (empresa_id);

CREATE INDEX idx_archivos_zip_estado ON public.archivos_zip_generados USING btree (estado);

CREATE INDEX idx_archivos_zip_fecha ON public.archivos_zip_generados USING btree (fecha_generacion);

CREATE INDEX idx_archivos_zip_tipo ON public.archivos_zip_generados USING btree (tipo_procesamiento);

CREATE INDEX idx_archivos_zip_usuario ON public.archivos_zip_generados USING btree (usuario_id);

CREATE INDEX idx_cuentas_globales_activo ON public.cuentas_globales USING btree (is_active);

CREATE INDEX idx_cuentas_globales_codigo ON public.cuentas_globales USING btree (codigo);

CREATE INDEX idx_cuentas_globales_empresa ON public.cuentas_globales USING btree (empresa_id);

CREATE INDEX idx_cuentas_globales_tipo_cuenta ON public.cuentas_globales USING btree (tipo_cuenta_id);

CREATE INDEX idx_datos_del_adquiriente_comprador_datos_del_documento ON public.datos_del_adquiriente_comprador USING btree (datos_del_documento_id);

CREATE INDEX idx_datos_del_adquiriente_comprador_nombre_razon_social ON public.datos_del_adquiriente_comprador USING btree (nombre_razon_social);

CREATE INDEX idx_datos_del_adquiriente_comprador_numero_documento ON public.datos_del_adquiriente_comprador USING btree (numero_documento);

CREATE INDEX idx_datos_del_documento_cufe ON public.datos_del_documento USING btree (codigo_unico_factura_cufe);

CREATE INDEX idx_datos_del_documento_empresa ON public.datos_del_documento USING btree (empresa_id);

CREATE INDEX idx_datos_del_documento_fecha_emision ON public.datos_del_documento USING btree (fecha_emision);

CREATE INDEX idx_datos_del_documento_numero_factura ON public.datos_del_documento USING btree (numero_factura);

CREATE INDEX idx_datos_del_documento_usuario ON public.datos_del_documento USING btree (usuario_id);

CREATE INDEX idx_datos_del_emisor_vendedor_datos_del_documento ON public.datos_del_emisor_vendedor USING btree (datos_del_documento_id);

CREATE INDEX idx_datos_del_emisor_vendedor_nit_emisor ON public.datos_del_emisor_vendedor USING btree (nit_emisor);

CREATE INDEX idx_datos_del_emisor_vendedor_razon_social ON public.datos_del_emisor_vendedor USING btree (razon_social);

CREATE INDEX idx_datos_totales_datos_del_documento ON public.datos_totales USING btree (datos_del_documento_id);

CREATE INDEX idx_descuentos_y_recargos_globales_datos_del_documento ON public.descuentos_y_recargos_globales USING btree (datos_del_documento_id);

CREATE INDEX idx_descuentos_y_recargos_globales_nro ON public.descuentos_y_recargos_globales USING btree (nro);

CREATE INDEX idx_descuentos_y_recargos_globales_tipo ON public.descuentos_y_recargos_globales USING btree (tipo);

CREATE INDEX idx_detalles_de_productos_codigo ON public.detalles_de_productos USING btree (codigo);

CREATE INDEX idx_detalles_de_productos_datos_del_documento ON public.detalles_de_productos USING btree (datos_del_documento_id);

CREATE INDEX idx_detalles_de_productos_nro ON public.detalles_de_productos USING btree (nro);

CREATE INDEX idx_empresas_activa ON public.empresas USING btree (is_active);

CREATE INDEX idx_empresas_nit ON public.empresas USING btree (nit);

CREATE INDEX idx_empresas_usuario_id ON public.empresas USING btree (usuario_id);

CREATE INDEX idx_informacion_autorizacion_datos_totales ON public.informacion_autorizacion USING btree (datos_totales_id);

CREATE INDEX idx_informacion_autorizacion_numero_autorizacion ON public.informacion_autorizacion USING btree (numero_autorizacion);

CREATE INDEX idx_informacion_autorizacion_vigencia ON public.informacion_autorizacion USING btree (vigencia);

CREATE INDEX idx_notas_finales_codigo ON public.notas_finales USING btree (codigo);

CREATE INDEX idx_notas_finales_datos_del_documento ON public.notas_finales USING btree (datos_del_documento_id);

CREATE INDEX idx_resumen_financiero_datos_totales ON public.resumen_financiero USING btree (datos_totales_id);

CREATE INDEX idx_resumen_financiero_moneda ON public.resumen_financiero USING btree (moneda);

CREATE INDEX idx_tipos_cuentas_globales_nombre ON public.tipos_cuentas_globales USING btree (nombre);

CREATE INDEX idx_tipos_comprobantes_empresa ON public.tipos_comprobantes USING btree (empresa_id);

CREATE INDEX idx_tipos_comprobantes_categoria ON public.tipos_comprobantes USING btree (categoria);

CREATE INDEX idx_tipos_comprobantes_tipo ON public.tipos_comprobantes USING btree (tipo_comprobante);

CREATE INDEX idx_tipos_comprobantes_activo ON public.tipos_comprobantes USING btree (activo);

CREATE INDEX idx_tipos_comprobantes_empresa_categoria ON public.tipos_comprobantes USING btree (empresa_id, categoria);

CREATE INDEX idx_users_active ON public.users USING btree (is_active);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE INDEX idx_users_reset_token ON public.users USING btree (reset_token);

CREATE INDEX idx_users_username ON public.users USING btree (username);

CREATE INDEX idx_valores_informativos_datos_totales ON public.valores_informativos USING btree (datos_totales_id);

CREATE INDEX idx_valores_informativos_moneda ON public.valores_informativos USING btree (moneda);

CREATE TRIGGER update_archivos_procesados_updated_at BEFORE UPDATE ON public.archivos_procesados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_archivos_zip_generados_updated_at BEFORE UPDATE ON public.archivos_zip_generados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cuentas_globales_updated_at BEFORE UPDATE ON public.cuentas_globales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tipos_comprobantes_updated_at BEFORE UPDATE ON public.tipos_comprobantes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE ONLY public.archivos_procesados
ADD CONSTRAINT fk_archivos_procesados_empresa FOREIGN KEY (empresa_id) REFERENCES public.empresas (id) ON DELETE SET NULL;

ALTER TABLE ONLY public.archivos_procesados
ADD CONSTRAINT fk_archivos_procesados_usuario FOREIGN KEY (usuario_id) REFERENCES public.users (id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.archivos_zip_generados
ADD CONSTRAINT fk_archivos_zip_generados_empresa FOREIGN KEY (empresa_id) REFERENCES public.empresas (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.archivos_zip_generados
ADD CONSTRAINT fk_archivos_zip_generados_usuario FOREIGN KEY (usuario_id) REFERENCES public.users (id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.cuentas_globales
ADD CONSTRAINT fk_cuentas_globales_empresa FOREIGN KEY (empresa_id) REFERENCES public.empresas (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.cuentas_globales
ADD CONSTRAINT fk_cuentas_globales_tipo_cuenta FOREIGN KEY (tipo_cuenta_id) REFERENCES public.tipos_cuentas_globales (id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.datos_del_adquiriente_comprador
ADD CONSTRAINT fk_datos_del_adquiriente_comprador_datos_del_documento FOREIGN KEY (datos_del_documento_id) REFERENCES public.datos_del_documento (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.datos_del_documento
ADD CONSTRAINT fk_datos_del_documento_empresa FOREIGN KEY (empresa_id) REFERENCES public.empresas (id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.datos_del_documento
ADD CONSTRAINT fk_datos_del_documento_usuario FOREIGN KEY (usuario_id) REFERENCES public.users (id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.datos_del_emisor_vendedor
ADD CONSTRAINT fk_datos_del_emisor_vendedor_datos_del_documento FOREIGN KEY (datos_del_documento_id) REFERENCES public.datos_del_documento (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.datos_totales
ADD CONSTRAINT fk_datos_totales_datos_del_documento FOREIGN KEY (datos_del_documento_id) REFERENCES public.datos_del_documento (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.descuentos_y_recargos_globales
ADD CONSTRAINT fk_descuentos_y_recargos_globales_datos_del_documento FOREIGN KEY (datos_del_documento_id) REFERENCES public.datos_del_documento (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.detalles_de_productos
ADD CONSTRAINT fk_detalles_de_productos_datos_del_documento FOREIGN KEY (datos_del_documento_id) REFERENCES public.datos_del_documento (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.informacion_autorizacion
ADD CONSTRAINT fk_informacion_autorizacion_datos_totales FOREIGN KEY (datos_totales_id) REFERENCES public.datos_totales (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notas_finales
ADD CONSTRAINT fk_notas_finales_datos_del_documento FOREIGN KEY (datos_del_documento_id) REFERENCES public.datos_del_documento (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.resumen_financiero
ADD CONSTRAINT fk_resumen_financiero_datos_totales FOREIGN KEY (datos_totales_id) REFERENCES public.datos_totales (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.valores_informativos
ADD CONSTRAINT fk_valores_informativos_datos_totales FOREIGN KEY (datos_totales_id) REFERENCES public.datos_totales (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tipos_comprobantes
ADD CONSTRAINT fk_tipos_comprobantes_empresa FOREIGN KEY (empresa_id) REFERENCES public.empresas (id) ON DELETE CASCADE;

ALTER TABLE ONLY public.empresas
ADD CONSTRAINT empresas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users (id) ON DELETE RESTRICT;