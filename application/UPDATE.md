# 🚀 StormStore v2.1.0 - The Vortex Update

## 📝 Registro de Cambios

¡Hola! Esta actualización trae grandes mejoras en la organización de tu biblioteca y un lavado de cara al modo de pantalla completa.

### 👋 Nueva Bienvenida

- **Asistente de Inicio**: Se ha implementado una nueva pantalla de bienvenida (`primer-inicio.html`) para guiar a los nuevos usuarios en la configuración inicial de StormStore.
- **Configuración Rápida**: Ahora es más fácil ajustar las preferencias básicas nada más instalar la aplicación.

### 🌀 StormVortex

- **Nuevo Icono**: Implementación del icono `stormvortex.svg` en toda la interfaz.
- **Navegación Fluida**: Soporte mejorado para mando y teclado en las secciones de Ayuda y Actualizaciones.

### 🔍 Filtros Inteligentes

- **"Solo Instaladas"**: Encuentra tus juegos instalados al instante con el nuevo filtro lateral.
- **Filtro de Actualizaciones**: Opción dinámica que solo aparece cuando hay versiones nuevas disponibles.
- **Diseño MD3**: Filtros con estilo Material Design 3, iconos intuitivos y puntos de estado brillantes.

### 🛠️ Sistema, Estabilidad y Ajustes

- **Ajustes 100% Funcionales**: El panel de configuración ahora guarda y aplica correctamente todas las opciones (inicio con Windows, modo minimizado y comportamiento de la bandeja del sistema).
- **Corrección de Instaladores**: Se arregló el error de validación ZIP al instalar aplicaciones `.exe` antiguas.
- **Actualizador Optimizado**: Refactorización completa del sistema de actualizaciones internas para una descarga más rápida y segura.
- **Optimización de UI**: Botones rediseñados y lógica de visibilidad mejorada en la vista de detalles de aplicaciones.
- **Mantenimiento Técnico**: Se han actualizado todos los paquetes de **NodeJS (NPM)** a sus versiones más recientes para mejorar el rendimiento y la seguridad.

### 🤓 Detalles Técnicos

- **Core**: Migración a **Electron v42** para aprovechar las últimas mejoras en seguridad y rendimiento del motor Chromium.
- **Integridad**: Implementación de validación de archivos mediante **checksums SHA-256** para garantizar que las descargas de `files.apps.json` sean idénticas al original.
- **Arquitectura**: Desacoplamiento de metadatos (`apps.json`) y lógica de despliegue (`files.apps.json`), permitiendo instalaciones portables sin tocar el registro de Windows.
- **Networking**: Gestión de descargas en paralelo para volúmenes divididos (.001, .002...) optimizando el ancho de banda del usuario.
- **Interoperabilidad**: Registro nativo del protocolo `stormstore://` permitiendo la comunicación fluida entre el navegador y el cliente local.

---

💙 El equipo de **StormGamesStudios**.

**Registro completo de cambios**: https://github.com/acierto-incomodo/StormStore/compare/v2.0.3...v2.1.0
