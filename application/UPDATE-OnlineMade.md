# Changelog - StormStore v1.2.10

## StormVortex (anteriormente Big Picture)
- **Cambio de nombre:** Se ha renombrado el modo "Big Picture" a **"StormVortex"** en toda la aplicación.
- **Nuevo Icono:** Se ha implementado el icono `stormvortex.svg` en toda la interfaz.
- **Mejoras de Navegación:**
  - Soporte completo para teclado y mando en el menú de Actualizaciones y Tutorial.
  - El botón "Volver" ahora regresa correctamente al menú principal o a la cuadrícula de juegos.
  - Argumento de inicio actualizado a `--StormVortex`.

## Sistema de Construcción (Build)
- **Automatización:**
  - Nuevo script `updatesCreator.ps1` que genera automáticamente un archivo de cambios (`Changes.txt`) basado en el historial de git al compilar.
  - `make.ps1` y `v2-make.ps1` ahora ejecutan el creador de actualizaciones al finalizar.
- **Instalador:**
  - El instalador ahora crea un acceso directo específico para el modo StormVortex.

## Correcciones y Mejoras
- **Versión:** Actualizada a v1.2.10.
- **Seguridad:**
  - Configuración de firma de código con `electron-builder` usando variables de entorno para la contraseña del certificado.
  - Verificación previa del certificado en el script de construcción.
- **Interfaz:**
  - Eliminados elementos duplicados en la barra lateral.
  - Textos y traducciones actualizados para reflejar la nueva marca StormVortex.