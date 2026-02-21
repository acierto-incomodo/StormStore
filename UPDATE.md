# Changelog - StormStore v1.2.9

## StormVortex (anteriormente Big Picture)
- **Cambio de nombre:** Se ha renombrado el modo "Big Picture" a **"StormVortex"** en toda la aplicación.
- **Interfaz de Usuario:**
  - Actualizados los títulos de las ventanas y descripciones en el tutorial del mando.
  - Actualizados los tooltips y textos alternativos de los botones.
  - El menú dentro del modo StormVortex ahora refleja el nuevo nombre.
  - Eliminado el botón duplicado de la barra lateral en la vista de detalles de aplicación (`app.html`) para limpiar la interfaz.

## Sistema de Construcción y Despliegue (Build)
- **Configuración de Electron-Builder:**
  - Corregido el objetivo de construcción de `msix` a `appx` para compatibilidad correcta.
  - Configurada la firma de código automática para paquetes Windows (`appx` y ejecutables).
- **Seguridad y Certificados:**
  - Implementado el uso de variables de entorno (`.env`) para proteger la contraseña del certificado (`cscKeyPassword`).
  - Añadida verificación automática del certificado en el script de construcción (`make.ps1`) usando `certutil` para detectar errores de contraseña antes de compilar.

## Correcciones y Mejoras
- **Script de Construcción (`make.ps1`):**
  - Ahora carga automáticamente las variables del archivo `.env`.
  - Renombra los archivos de salida reemplazando espacios por guiones.
  - Genera una copia `StormStore-Setup.exe` para facilitar la distribución.