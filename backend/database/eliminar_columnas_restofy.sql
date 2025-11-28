-- =====================================================
-- ELIMINAR: Columnas de Restofy de la tabla empresas
-- =====================================================
-- Este script elimina las columnas relacionadas con Restofy
-- Ejecutar solo si las columnas existen

-- Eliminar columnas de Restofy
ALTER TABLE public.empresas DROP COLUMN IF EXISTS restofysas_token;

ALTER TABLE public.empresas DROP COLUMN IF EXISTS restofy_url;

ALTER TABLE public.empresas DROP COLUMN IF EXISTS vinculada_restofy;

-- Mensaje de confirmación
SELECT 'Columnas de Restofy eliminadas exitosamente de la tabla empresas' as mensaje;