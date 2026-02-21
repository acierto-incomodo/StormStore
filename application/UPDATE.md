# Changelog - StormStore v1.2.10

## 🌀 StormVortex (anteriormente Big Picture)
- **Rebranding Completo:** Se ha renombrado el modo "Big Picture" a **"StormVortex"** en toda la aplicación.
- **Nuevo Icono:** Se ha implementado el icono `stormvortex.svg` en toda la interfaz.
- **Mejoras de Navegación:**
  - Soporte completo para **Teclado** y **Mando** en el menú de Actualizaciones y Tutorial.
  - El botón "Volver" ahora regresa correctamente al menú principal o a la cuadrícula de juegos.
  - Argumento de inicio actualizado a `--StormVortex`.

## 🛠️ Sistema de Construcción e Instalación
- **Automatización:**
  - Nuevo script `updatesCreator.ps1` que genera automáticamente un archivo de cambios (`Changes.txt`) basado en el historial de git al compilar.
  - `make.ps1` y `v2-make.ps1` ahora ejecutan el creador de actualizaciones al finalizar.
- **Instalador:**
  - El instalador ahora crea un acceso directo específico para el modo StormVortex en el Escritorio y Menú de Inicio.
- **Seguridad:**
  - Configuración de firma de código con `electron-builder` usando variables de entorno para la contraseña del certificado.
  - Verificación previa del certificado en el script de construcción.

## ✨ Mejoras Generales y Correcciones
- **Interfaz de Usuario:**
  - Eliminados elementos duplicados en la barra lateral.
  - Textos y traducciones actualizados para reflejar la nueva marca StormVortex.
  - Mejoras visuales generales.
- **Compatibilidad:**
  - Mejoras en la integración con Steam.
  - Soporte de teclado añadido para navegar sin ratón o gamepad.
- **Rendimiento:**
  - Optimización general de la aplicación y tiempos de carga.

## 📝 Archivos Modificados
- `application/main.js`: Lógica de arranque y configuración.
- `application/renderer/bigpicture.js`: Mejoras en el comportamiento y la funcionalidad del modo Big Picture.
- `application/renderer/controller-tutorial.html`: Actualización del tutorial para el mando.
- `application/renderer/updates-gamepad.js`: Correcciones y mejoras en el soporte de gamepad.
- `application/renderer/updates.html`: Mejoras en la interfaz de actualización.
- `application/build/v3-installer.nsh`: Nuevo script de instalación NSIS.
- `application/package.json`: Actualización de versión y dependencias.
- `application/assets/icons/stormvortex.svg`: Nuevo icono.
- `application/make.ps1`: Script de construcción actualizado.