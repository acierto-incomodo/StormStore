# Sistema de Descargas de Archivos - StormStore

## Descripción General

Este sistema permite descargar, combinar (si es necesario) y descomprimir archivos ZIP desde una configuración centralizada en `files.apps.json`.

## Estructura de `files.apps.json`

```json
[
  {
    "id": "game-pack-001",
    "name": "Juego Completo Pack 1",
    "files": [
      "game-pack-001.zip.001",
      "game-pack-001.zip.002",
      "game-pack-001.zip.003"
    ],
    "merge": true,
    "mergedName": "game-pack-001.zip",
    "extractPath": "C:\\Games\\GamePack1",
    "checksumFile": "game-pack-001.txt",
    "checksumUrl": "https://example.com/checksums/game-pack-001.txt",
    "downloadUrl": "https://example.com/downloads/"
  }
]
```

### Campos:

- **id**: Identificador único del paquete de descarga
- **name**: Nombre legible para mostrar al usuario
- **files**: Array con los nombres de los archivos a descargar
- **merge**: Boolean - true si los archivos necesitan ser combinados (ej: .zip.001, .zip.002)
- **mergedName**: Nombre del archivo resultante después de la combinación
- **extractPath**: Ruta donde descomprimir los archivos
- **checksumFile**: Nombre del archivo de checksum para validación
- **checksumUrl**: URL del archivo de checksum remoto
- **downloadUrl**: URL base para descargar los archivos

## Flujo de Descarga

### 1. Descarga Simple (.zip)

```
Descargar archivo.zip
     ↓
Descomprimir en extractPath
     ↓
Verificar checksum
     ↓
Completado
```

### 2. Descarga Múltiple (.zip.001, .zip.002, etc)

```
Descargar archivo.zip.001
Descargar archivo.zip.002
Descargar archivo.zip.003
     ↓
Combinar en archivo.zip
     ↓
Eliminar archivos parciales
     ↓
Descomprimir en extractPath
     ↓
Verificar checksum
     ↓
Completado
```

## Uso desde el Renderer (JavaScript)

### Obtener lista de descargas disponibles

```javascript
const fileApps = await window.api.getFileApps();
console.log(fileApps); // Array de configuraciones de descarga
```

### Iniciar una descarga

```javascript
const result = await window.api.startFileDownload("game-pack-001");
if (result.success) {
  console.log("Descarga iniciada");
} else {
  console.error("Error:", result.error);
}
```

### Escuchar eventos de descarga

```javascript
// Descarga iniciada
window.api.onDownloadStart((_event, id, filename) => {
  console.log(`Iniciando descarga de: ${filename}`);
  // Mostrar UI de descarga
});

// Progreso de descarga
window.api.onDownloadProgress((_event, id, progress) => {
  console.log(`Progreso: ${progress.percent}%`);
  console.log(`Velocidad: ${(progress.speed / (1024 * 1024)).toFixed(2)} MB/s`);
  console.log(`Tiempo restante: ${Math.floor(progress.timeRemaining)}s`);
  // Actualizar barra de progreso
});

// Combinando archivos
window.api.onMergingStart((_event, id) => {
  console.log("Combinando archivos...");
  // Mostrar status
});

// Descomprimiendo
window.api.onExtractingStart((_event, id) => {
  console.log("Descomprimiendo archivos...");
  // Mostrar status
});

// Verificando
window.api.onVerifyingStart((_event, id) => {
  console.log("Verificando integridad...");
  // Mostrar status
});

// Descarga completada
window.api.onDownloadComplete((_event, id) => {
  console.log("¡Descarga completada!");
  // Mostrar mensaje de éxito
});

// Error en descarga
window.api.onDownloadError((_event, id, error) => {
  console.error("Error:", error);
  // Mostrar mensaje de error
});
```

### Controlar descarga

```javascript
// Pausar descarga
await window.api.pauseDownload("game-pack-001");

// Cancelar descarga
await window.api.cancelDownload("game-pack-001");

// Obtener estado de una descarga
const status = await window.api.getDownloadStatus("game-pack-001");
console.log(status);

// Obtener todas las descargas
const allDownloads = await window.api.getAllDownloads();
console.log(allDownloads);
```

## Archivo de Checksum (.txt)

El archivo de checksum debe contener el hash SHA-256 del contenido descargado/descomprimido.

**Ejemplo:**

```
abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def
```

El sistema:

1. Descarga el archivo .txt desde `checksumUrl`
2. Calcula el hash SHA-256 del contenido descargado
3. Compara ambos valores
4. Si no coinciden, genera un error

## Ubicaciones de Archivos Temporales

Los archivos se descargan temporalmente en:

```
%APPDATA%\StormGamesStudios\StormStore\temp_downloads\{fileAppId}\{timestamp}\
```

Después de completarse, se limpian automáticamente.

## Integración con program-updates.html

La página `program-updates.html` es la interfaz recomendada para mostrar el progreso de descargas. Proporciona:

- Barra de progreso visual
- Información de velocidad
- Tiempo estimado restante
- Lista de archivos siendo descargados
- Botones de pausa y cancelación
- Estado de cada fase (descargando, combinando, descomprimiendo, verificando)

## Manejo de Errores

Los errores comunes incluyen:

- **HTTP Error**: Problema al descargar un archivo
- **Checksum mismatch**: El contenido descargado no coincide con el esperado
- **Permisos insuficientes**: No hay permisos para escribir en la ruta de destino
- **Espacio insuficiente**: No hay espacio en disco para descargar o descomprimir

Todos los errores se comunican al renderer mediante el evento `onDownloadError`.

## Ejemplo Completo

```javascript
// 1. Obtener configuraciones disponibles
const fileApps = await window.api.getFileApps();
console.log("Descargas disponibles:", fileApps);

// 2. Configurar listeners
window.api.onDownloadStart((_event, id, filename) => {
  console.log(`Iniciando: ${filename}`);
  showDownloadUI(id);
});

window.api.onDownloadProgress((_event, id, progress) => {
  updateProgressBar(id, progress.percent);
  updateSpeed(id, progress.speed);
});

window.api.onDownloadComplete((_event, id) => {
  console.log("¡Completado!");
  showSuccessMessage(id);
});

window.api.onDownloadError((_event, id, error) => {
  console.error("Error:", error);
  showErrorMessage(id, error);
});

// 3. Iniciar descarga
const result = await window.api.startFileDownload("game-pack-001");
if (!result.success) {
  console.error("No se pudo iniciar:", result.error);
}
```

## Notas Importantes

- Los archivos se descargan en paralelo
- El sistema es robusto ante interrupciones (se puede pausar y reanudar)
- Los checksums se guardan localmente para futuras verificaciones
- 7zr.exe es necesario para la descompresión (incluido en assets/extraFiles/)
- El sistema soporta tanto descargas simples como descargas de múltiples partes
