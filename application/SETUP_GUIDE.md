# Guía de Instalación y Configuración del Sistema de Descargas

## 📋 Requisitos Previos

- StormStore versión 1.5.2 o superior
- Node.js 14+ (para desarrollo)
- 7zr.exe (incluido en `assets/extraFiles/`)

## 🚀 Instalación Rápida

### 1. Actualizar `files.apps.json`

Edita el archivo `files.apps.json` en la raíz del proyecto y agrega tu configuración:

```json
[
  {
    "id": "mi-primer-pack",
    "name": "Mi Primer Pack de Juegos",
    "files": [
      "mi-primer-pack.zip.001",
      "mi-primer-pack.zip.002",
      "mi-primer-pack.zip.003"
    ],
    "merge": true,
    "mergedName": "mi-primer-pack.zip",
    "extractPath": "C:\\MisJuegos\\Pack1",
    "checksumFile": "mi-primer-pack.txt",
    "checksumUrl": "https://tu-servidor.com/checksums/mi-primer-pack.txt",
    "downloadUrl": "https://tu-servidor.com/descargas/"
  }
]
```

### 2. Generar el archivo de checksum

```bash
# Crear el hash SHA-256 del contenido
# En Linux/Mac:
sha256sum contenido.zip > contenido.txt

# En Windows (PowerShell):
certUtil -hashfile contenido.zip SHA256 > contenido.txt
```

El archivo debe contener solo el hash (sin la ruta del archivo):

```
abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def
```

### 3. Compilar y ejecutar

```bash
# Desarrollo
npm start

# Build
npm run build
```

## 🎯 Casos de Uso

### Caso 1: Descarga Simple (archivo .zip)

**Configuración:**

```json
{
  "id": "app-simple",
  "name": "Aplicación Simple",
  "files": ["app-simple.zip"],
  "merge": false,
  "extractPath": "C:\\Apps\\Simple",
  "checksumFile": "app-simple.txt",
  "checksumUrl": "https://ejemplo.com/checksums/app-simple.txt",
  "downloadUrl": "https://ejemplo.com/descargas/"
}
```

**Flujo:**

1. Descarga `app-simple.zip`
2. Descomprime en `C:\\Apps\\Simple`
3. Verifica checksum
4. Completado

### Caso 2: Descarga Múltiple (archivos .zip.001, .zip.002, etc)

**Configuración:**

```json
{
  "id": "juego-grande",
  "name": "Juego Grande",
  "files": [
    "juego-grande.zip.001",
    "juego-grande.zip.002",
    "juego-grande.zip.003",
    "juego-grande.zip.004"
  ],
  "merge": true,
  "mergedName": "juego-grande.zip",
  "extractPath": "C:\\Juegos\\Grande",
  "checksumFile": "juego-grande.txt",
  "checksumUrl": "https://ejemplo.com/checksums/juego-grande.txt",
  "downloadUrl": "https://ejemplo.com/descargas/"
}
```

**Flujo:**

1. Descarga `juego-grande.zip.001`
2. Descarga `juego-grande.zip.002`
3. Descarga `juego-grande.zip.003`
4. Descarga `juego-grande.zip.004`
5. Combina en `juego-grande.zip`
6. Descomprime en `C:\\Juegos\\Grande`
7. Verifica checksum
8. Elimina temporales
9. Completado

## 🖥️ Interfaz de Usuario

### Acceder al Centro de Descargas

1. Abre StormStore
2. Ve a la página principal
3. Busca un botón o enlace "Centro de Descargas"
4. Se abrirá `downloads.html`

### Monitorear Descargas

1. Haz clic en "Descargar e Instalar"
2. Se abrirá `program-updates.html`
3. Verás:
   - Barra de progreso
   - Velocidad de descarga
   - Tiempo estimado restante
   - Estado actual (Descargando → Combinando → Descomprimiendo → Verificando)

## 🔧 Personalización

### Cambiar colores de la interfaz

En `program-updates.html`, busca:

```html
<style>
  :root {
    --primary-color: #2196f3;
    --success-color: #4caf50;
    --warning-color: #ff9800;
    --error-color: #ef5350;
  }
</style>
```

### Agregar más campos a la configuración

Si necesitas agregar campos personalizados:

1. Modifica `files.apps.json`
2. Actualiza `download-manager.js` si es necesario
3. Modifica la UI en `program-updates.html` o `downloads.html`

## 🐛 Solución de Problemas

### "Checksum mismatch"

- Verifica que el archivo de checksum en el servidor es correcto
- Regenera el hash SHA-256
- Asegúrate de que el archivo descargado no está corrupto

### "Permisos insuficientes"

- Ejecuta StormStore como administrador
- Verifica que el directorio de destino es accesible
- Comprueba los permisos del directorio

### "Espacio insuficiente"

- Verifica que hay suficiente espacio en disco para descargar y descomprimir
- Elimina archivos innecesarios
- Considera cambiar la ruta de descarga

### La descarga se detiene

- Revisa la conexión a Internet
- Verifica que el servidor remoto sigue disponible
- Intenta cancelar y reiniciar la descarga

## 📝 Ejemplos de URLs Reales

### GitHub (releases)

```json
"downloadUrl": "https://github.com/usuario/repo/releases/download/v1.0/"
```

### Google Drive

```json
"downloadUrl": "https://drive.google.com/uc?export=download&id=ID_DEL_ARCHIVO&"
```

### Servidor propio

```json
"downloadUrl": "https://tu-dominio.com/descargas/"
```

## 🔐 Seguridad

### Verificación de integridad

El sistema verifica que los archivos descargados no estén corruptos usando SHA-256:

```
Descarga remota → Hash local → Comparar con Hash remoto → OK/ERROR
```

### Permisos

- Los archivos temporales se guardan en `%APPDATA%\StormGamesStudios\StormStore\temp_downloads\`
- Solo el usuario actual puede acceder
- Se limpian automáticamente después de completar

## 📊 Monitoreo

Para ver el progreso detallado, abre las DevTools (Ctrl+Shift+I) y observa:

```javascript
// Ver todas las descargas activas
window.api.getAllDownloads().then((d) => console.log(d));

// Ver estado de una descarga específica
window.api.getDownloadStatus("mi-primer-pack").then((s) => console.log(s));
```

## 🎓 Prueba Local

Para probar el sistema localmente:

1. Crea un archivo ZIP pequeño
2. Divídelo en partes de 10MB:

   ```bash
   # Linux/Mac
   zip archivo.zip contenido/
   split -b 10m archivo.zip archivo.zip.
   ```

3. Crea un servidor local:

   ```bash
   python -m http.server 8000
   ```

4. Actualiza `files.apps.json`:

   ```json
   "downloadUrl": "http://localhost:8000/"
   ```

5. Prueba la descarga

## 📚 Referencias

- [Documentación del Sistema de Descargas](DOWNLOAD_SYSTEM.md)
- [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [7-Zip Command Line](https://www.7-zip.org/download.html)

## ✅ Checklist de Implementación

- [ ] Actualizar `files.apps.json` con configuraciones
- [ ] Generar archivos de checksum
- [ ] Subir archivos al servidor
- [ ] Probar descargas en modo desarrollo
- [ ] Verificar que `7zr.exe` está en `assets/extraFiles/`
- [ ] Compilar versión de distribución
- [ ] Probar versión compilada
- [ ] Documentar instrucciones para usuarios finales

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs en `DOWNLOAD_SYSTEM.md`
2. Verifica la consola del desarrollador (Ctrl+Shift+I)
3. Abre un issue en GitHub con detalles del error
