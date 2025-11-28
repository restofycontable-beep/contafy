# 📁 Estructura del Frontend - Contafy

## 🏗️ Organización de Carpetas

### `/src/components/`

Componentes React organizados por funcionalidad:

#### `/auth/` - Componentes de Autenticación

- `Login.js` - Formulario de inicio de sesión
- `Register.js` - Formulario de registro
- `AuthContainer.js` - Contenedor de autenticación
- `ProtectedRoute.js` - Ruta protegida
- `Auth.css` - Estilos de autenticación

#### `/dashboard/` - Componentes del Dashboard

- `Dashboard.jsx` - Dashboard principal
- `Dashboard.css` - Estilos del dashboard
- `Header.jsx` - Encabezado de la aplicación
- `Sidebar.jsx` - Barra lateral de navegación
- `MainPanel.jsx` - Panel principal

#### `/empresas/` - Gestión de Empresas

- `CrearEmpresa.jsx` - Crear/editar empresa
- `CrearEmpresa.css` - Estilos del formulario de empresa
- `ListaEmpresas.jsx` - Lista de empresas
- `ListaEmpresas.css` - Estilos de la lista
- `ConfiguracionEmpresa.jsx` - Configuración de empresa
- `ConfiguracionEmpresa.css` - Estilos de configuración

#### `/archivos/` - Procesamiento de Archivos

- `ArchivosProcesados.jsx` - Lista de archivos procesados
- `ArchivosProcesadosTabla.jsx` - Tabla de archivos
- `ArchivosZipGenerados.jsx` - Archivos ZIP generados
- `ArchivosZipGenerados.css` - Estilos de archivos ZIP
- `ProcesamientoPanel.jsx` - Panel de procesamiento
- `ResultadosTabla.jsx` - Tabla de resultados

#### `/modals/` - Componentes Modales

- `NuevoDocumentoModal.jsx` - Modal de nuevo documento

#### `/ui/` - Componentes de Interfaz Reutilizables

- (Componentes UI genéricos para reutilizar)

### `/src/styles/`

Estilos CSS organizados por categoría:

#### `/components/` - Estilos de Componentes

- `sidebar.css` - Estilos de la barra lateral
- `header.css` - Estilos del encabezado
- `buttons.css` - Estilos de botones
- `empty-state.css` - Estados vacíos
- `archivos-procesados.css` - Archivos procesados
- `archivos-procesados-tabla.css` - Tabla de archivos
- `ArchivosZipGenerados.css` - Archivos ZIP
- `ListaEmpresas.css` - Lista de empresas
- `modal-nuevo-documento.css` - Modal nuevo documento
- `procesamiento.css` - Procesamiento

#### `/layouts/` - Estilos de Layouts

- `main-panel.css` - Panel principal
- `procesamiento-panel.css` - Panel de procesamiento

#### `/base/` - Estilos Base

- `base.css` - Estilos base globales
- `index.css` - Estilos principales

### `/src/contexts/`

Contextos de React:

- `AuthContext.js` - Contexto de autenticación

### `/src/services/`

Servicios y APIs:

- `procesamientoService.js` - Servicio de procesamiento

### `/src/utils/`

Utilidades y helpers:

- (Funciones utilitarias)

### `/src/hooks/`

Custom hooks de React:

- (Hooks personalizados)

## 🔄 Beneficios de la Nueva Estructura

1. **Organización Clara**: Cada carpeta tiene una responsabilidad específica
2. **Fácil Navegación**: Encontrar archivos es más intuitivo
3. **Escalabilidad**: Fácil agregar nuevos componentes sin desorden
4. **Mantenibilidad**: Código más fácil de mantener y actualizar
5. **Reutilización**: Componentes UI separados para reutilizar
6. **Separación de Responsabilidades**: Estilos, lógica y componentes separados

## 📝 Convenciones de Nomenclatura

- **Componentes**: PascalCase (ej: `CrearEmpresa.jsx`)
- **Estilos**: kebab-case (ej: `archivos-procesados.css`)
- **Servicios**: camelCase (ej: `procesamientoService.js`)
- **Carpetas**: camelCase (ej: `components/`, `styles/`)

## 🚀 Cómo Usar

1. **Agregar Componentes**: Colocar en la carpeta correspondiente según su funcionalidad
2. **Agregar Estilos**: Colocar en `/styles/components/` para estilos específicos
3. **Importaciones**: Usar rutas relativas desde la ubicación del archivo
4. **Servicios**: Crear en `/services/` para lógica de negocio
5. **Utilidades**: Funciones helper en `/utils/`

## ✅ Estado Actual

- ✅ Estructura reorganizada
- ✅ Importaciones actualizadas
- ✅ Funcionalidad preservada
- ✅ Botón "Cancelar" funcionando
- ✅ Navegación corregida
