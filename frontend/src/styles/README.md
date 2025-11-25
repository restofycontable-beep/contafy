# Estructura de Estilos - Frontend

Esta carpeta contiene todos los estilos CSS organizados por componente para mantener una estructura escalable y mantenible.

## Estructura de Archivos

```
styles/
├── index.css          # Archivo principal que importa todos los estilos
├── base.css           # Estilos base, reset y variables CSS
├── sidebar.css        # Estilos específicos del sidebar
├── header.css         # Estilos específicos del header
├── buttons.css        # Estilos de botones y componentes interactivos
├── main-panel.css     # Estilos del panel principal y tarjetas de estadísticas
├── empty-state.css    # Estilos para estados vacíos
├── modal-dian.css     # Estilos específicos del modal DIAN
└── README.md          # Esta documentación
```

## Variables CSS

Todas las variables CSS están definidas en `base.css` y incluyen:

- `--color-principal`: #FF193E (rojo principal)
- `--color-principal-dark`: #d10e2e (rojo oscuro)
- `--color-exito`: #2ecc71 (verde de éxito)
- `--color-exito-dark`: #27ae60 (verde oscuro)
- `--color-texto`: #1e293b (color de texto principal)
- `--color-texto-secundario`: #64748b (color de texto secundario)
- `--color-fondo`: #f8fafc (color de fondo)
- `--color-blanco`: #fff (blanco)
- `--color-borde`: #e2e8f0 (color de bordes)
- `--border-radius`: 0.7rem (radio de borde estándar)
- `--transition`: all 0.2s (transición estándar)

## Uso

Para usar estos estilos, simplemente importa el archivo principal en tu `index.css`:

```css
@import "./styles/index.css";
```

## Ventajas de esta Estructura

1. **Escalabilidad**: Cada componente tiene sus propios estilos
2. **Mantenibilidad**: Fácil encontrar y modificar estilos específicos
3. **Reutilización**: Los estilos están organizados por funcionalidad
4. **Variables CSS**: Consistencia en colores y valores
5. **Responsive**: Cada archivo incluye sus propias media queries

## Agregar Nuevos Estilos

Para agregar estilos para un nuevo componente:

1. Crea un nuevo archivo CSS en la carpeta `styles/`
2. Nombra el archivo siguiendo la convención: `componente.css`
3. Agrega la importación en `styles/index.css`
4. Usa las variables CSS existentes para mantener consistencia

## Responsive Design

Cada archivo de estilos incluye sus propias media queries para mantener la responsividad organizada por componente.
