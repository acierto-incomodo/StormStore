# 📖 Guía Completa: Cómo Funciona files.apps.json

## 🎯 Concepto General

`files.apps.json` es un archivo de configuración que **define cómo descargar e instalar aplicaciones/juegos directamente** sin usar instaladores intermediarios (.exe). En lugar de descargar un instalador y ejecutarlo, ahora descargamos los archivos finales comprimidos (.zip) y los descomprimimos directamente en la carpeta de instalación.

---

## 📊 Comparación: Sistema Antiguo vs Nuevo

### ❌ Sistema Antiguo (apps.json)

```
1. apps.json contiene: { id: "juego1", download: "https://url/instalador.exe" }
   ↓
2. Descargar instalador.exe
   ↓
3. Ejecutar instalador.exe (abre ventana, pide ubicación, etc)
   ↓
4. Esperar a que termine la instalación
   ↓
5. Eliminar instalador.exe
   ↓
6. Juego instalado (esperar a que se complete)
```

### ✅ Sistema Nuevo (files.apps.json)

```
1. files.apps.json contiene: { id: "juego1", files: ["juego1.zip"], ... }
   ↓
2. Descargar juego1.zip
   ↓
3. Descomprimir juego1.zip → C:\Juegos\juego1
   ↓
4. Verificar integridad (checksum SHA-256)
   ↓
5. Eliminar temporal
   ↓
6. ¡Listo para jugar! (sin esperar instalación)
```

---

## 🏗️ Estructura de files.apps.json

```json
[
  {
    "id": "mi-juego-001",
    "name": "Mi Juego Increíble",
    "files": [
      "mi-juego-001.zip.001",
      "mi-juego-001.zip.002",
      "mi-juego-001.zip.003"
    ],
    "merge": true,
    "mergedName": "mi-juego-001.zip",
    "extractPath": "C:\\Juegos\\MiJuego",
    "checksumFile": "mi-juego-001.txt",
    "checksumUrl": "https://servidor.com/checksums/mi-juego-001.txt",
    "downloadUrl": "https://servidor.com/descargas/"
  }
]
```

### 📝 Explicación de Cada Campo

| Campo            | Tipo    | Descripción                            | Ejemplo                                                     |
| ---------------- | ------- | -------------------------------------- | ----------------------------------------------------------- |
| **id**           | string  | Identificador único del app            | `"juego-doom-eternal"`                                      |
| **name**         | string  | Nombre mostrado al usuario             | `"Doom Eternal"`                                            |
| **files**        | array   | Lista de archivos a descargar          | `["juego.zip"]` o `["juego.zip.001", "juego.zip.002"]`      |
| **merge**        | boolean | ¿Combinar archivos?                    | `true` si tiene .zip.001, .zip.002; `false` si es solo .zip |
| **mergedName**   | string  | Nombre del archivo después de combinar | `"juego.zip"`                                               |
| **extractPath**  | string  | Ruta donde descomprimir                | `"C:\\Program Files\\Games\\DoomEternal"`                   |
| **checksumFile** | string  | Nombre del archivo de verificación     | `"juego.txt"`                                               |
| **checksumUrl**  | string  | URL donde descargar el checksum        | `"https://ejemplo.com/checksums/juego.txt"`                 |
| **downloadUrl**  | string  | URL base para descargar archivos       | `"https://ejemplo.com/descargas/"`                          |

---

## 🔄 Flujos de Descarga

### Flujo 1: Archivo Simple (.zip)

**Configuración:**

```json
{
  "id": "app-simple",
  "name": "Aplicación Simple",
  "files": ["app.zip"],
  "merge": false,
  "extractPath": "C:\\Apps\\Simple",
  "checksumFile": "app.txt",
  "checksumUrl": "https://ejemplo.com/checksums/app.txt",
  "downloadUrl": "https://ejemplo.com/descargas/"
}
```

**Proceso:**

```
1. Descargar: https://ejemplo.com/descargas/app.zip
   (Archivo único de, ej, 500MB)

2. Descomprimir en C:\Apps\Simple

3. Descargar checksum: https://ejemplo.com/checksums/app.txt
   (Contiene: abc123def456...)

4. Calcular hash SHA-256 del contenido descomprimido

5. Comparar:
   - Hash remoto: abc123def456
   - Hash local: abc123def456
   → ✅ COINCIDEN

6. ¡Completado!
```

---

### Flujo 2: Archivos Múltiples (.zip.001, .zip.002, etc)

**Configuración:**

```json
{
  "id": "juego-grande",
  "name": "Juego Muy Grande",
  "files": [
    "juego-grande.zip.001",
    "juego-grande.zip.002",
    "juego-grande.zip.003",
    "juego-grande.zip.004"
  ],
  "merge": true,
  "mergedName": "juego-grande.zip",
  "extractPath": "D:\\Juegos\\GrandeJuego",
  "checksumFile": "juego-grande.txt",
  "checksumUrl": "https://ejemplo.com/checksums/juego-grande.txt",
  "downloadUrl": "https://ejemplo.com/descargas/"
}
```

**Proceso:**

```
DESCARGAR EN PARALELO (simultáneamente):
  ├─ https://ejemplo.com/descargas/juego-grande.zip.001 (10GB)
  ├─ https://ejemplo.com/descargas/juego-grande.zip.002 (10GB)
  ├─ https://ejemplo.com/descargas/juego-grande.zip.003 (10GB)
  └─ https://ejemplo.com/descargas/juego-grande.zip.004 (5GB)
  Tiempo total: ~10 minutos (en paralelo, no secuencial)

    ↓

COMBINAR ARCHIVOS:
  juego-grande.zip.001
  + juego-grande.zip.002
  + juego-grande.zip.003
  + juego-grande.zip.004
  = juego-grande.zip (35GB)

    ↓

ELIMINAR ARCHIVOS PARCIALES:
  ❌ juego-grande.zip.001
  ❌ juego-grande.zip.002
  ❌ juego-grande.zip.003
  ❌ juego-grande.zip.004

    ↓

DESCOMPRIMIR:
  juego-grande.zip → D:\Juegos\GrandeJuego
  (Esperar 5-10 minutos)

    ↓

VERIFICAR INTEGRIDAD:
  Hash SHA-256 remoto vs local
  → ✅ COINCIDEN

    ↓

ELIMINAR TEMPORALES:
  ❌ Carpeta temporal de descargas

    ↓

¡COMPLETADO!
```

---

## 🔐 El Archivo de Checksum (.txt)

### ¿Qué es?

Un archivo que contiene el **hash SHA-256** del contenido. Sirve para verificar que:

- ✅ No se corrompió durante la descarga
- ✅ No fue modificado en el servidor
- ✅ Toda la información es íntegra

### Cómo generarlo

**En Windows (PowerShell):**

```powershell
certUtil -hashfile "juego.zip" SHA256 > juego.txt
```

**En Linux/Mac:**

```bash
sha256sum juego.zip > juego.txt
```

**Resultado (juego.txt):**

```
abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def
```

### ¿Dónde guardarlo?

En tu servidor web, en la carpeta de checksums:

```
https://ejemplo.com/checksums/juego.txt
```

---

## 💾 Ubicaciones de Archivos

### Durante la descarga

```
%APPDATA%\StormGamesStudios\StormStore\temp_downloads\
  └─ juego-001\
     └─ 1682093156789\
        ├─ juego-001.zip.001 (descargando...)
        ├─ juego-001.zip.002 (descargando...)
        └─ juego-001.zip.003 (descargando...)
```

### Después de descomprimir

```
C:\Juegos\MiJuego\
  ├─ carpeta-juego\
  ├─ archivo-principal.exe
  ├─ librerias\
  └─ datos\
```

### El checksum final

```
C:\Juegos\MiJuego\
  └─ juego-001.txt (para verificación futura)
```

---

## 🔗 Ejemplo Completo: Descarga Manual

### Paso 1: Editar files.apps.json

```json
[
  {
    "id": "tutorial-juego",
    "name": "Juego Tutorial",
    "files": ["tutorial.zip"],
    "merge": false,
    "extractPath": "C:\\Tutorial",
    "checksumFile": "tutorial.txt",
    "checksumUrl": "https://miservidor.com/checksums/tutorial.txt",
    "downloadUrl": "https://miservidor.com/juegos/"
  }
]
```

### Paso 2: Subir archivos al servidor

```
https://miservidor.com/juegos/
  └─ tutorial.zip (100MB)

https://miservidor.com/checksums/
  └─ tutorial.txt (contiene hash SHA-256)
```

### Paso 3: Descargar e instalar desde StormStore

```
Usuario abre StormStore
    ↓
Va a "Centro de Descargas"
    ↓
Haz clic en "Descargar e Instalar"
    ↓
Sistema detecta "tutorial-juego" en files.apps.json
    ↓
Descarga: https://miservidor.com/juegos/tutorial.zip
    ↓
Descomprime en: C:\Tutorial
    ↓
Descarga checksum: https://miservidor.com/checksums/tutorial.txt
    ↓
Verifica integridad
    ↓
✅ ¡Completado!
```

---

## 🛠️ Casos de Uso Prácticos

### Caso 1: Juego Simple

```json
{
  "id": "minecraft",
  "name": "Minecraft",
  "files": ["minecraft.zip"],
  "merge": false,
  "extractPath": "C:\\Games\\Minecraft",
  "checksumFile": "minecraft.txt",
  "checksumUrl": "https://cdn.ejemplo.com/checksums/minecraft.txt",
  "downloadUrl": "https://cdn.ejemplo.com/games/"
}
```

### Caso 2: Juego AAA Grande (15GB)

```json
{
  "id": "cyberpunk-2077",
  "name": "Cyberpunk 2077",
  "files": ["cyberpunk.zip.001", "cyberpunk.zip.002"],
  "merge": true,
  "mergedName": "cyberpunk.zip",
  "extractPath": "D:\\Games\\Cyberpunk2077",
  "checksumFile": "cyberpunk.txt",
  "checksumUrl": "https://cdn.ejemplo.com/checksums/cyberpunk.txt",
  "downloadUrl": "https://cdn.ejemplo.com/games/"
}
```

### Caso 3: Aplicación Portátil

```json
{
  "id": "7zip-portable",
  "name": "7-Zip Portable",
  "files": ["7zip-portable.zip"],
  "merge": false,
  "extractPath": "C:\\Portable\\7Zip",
  "checksumFile": "7zip-portable.txt",
  "checksumUrl": "https://cdn.ejemplo.com/checksums/7zip-portable.txt",
  "downloadUrl": "https://cdn.ejemplo.com/tools/"
}
```

---

## 🔄 Integración con apps.json

### El app en apps.json debe tener el mismo `id`:

**apps.json:**

```json
{
  "id": "mi-juego-001",
  "name": "Mi Juego Increíble",
  "download": "https://...",
  "paths": ["C:\\Juegos\\MiJuego\\juego.exe"],
  ...
}
```

**files.apps.json:**

```json
{
  "id": "mi-juego-001",  ← DEBE SER EL MISMO ID
  "name": "Mi Juego Increíble",
  "files": ["mi-juego-001.zip"],
  ...
}
```

Cuando el usuario intenta instalar desde StormStore:

1. Lee el `id` del app en apps.json
2. Busca ese `id` en files.apps.json
3. Si lo encuentra → Usa el nuevo sistema
4. Si NO lo encuentra → Usa el método antiguo (instalador .exe)

---

## ⚙️ Cómo Funciona Internamente

### El DownloadManager

El archivo `download-manager.js` es la "máquina" que hace todo:

```javascript
// 1. Inicia la descarga
await downloadManager.startDownload(id, config, tempDir)

// 2. Internamente hace:
  → Descargar archivos (_downloadFiles)
  → Combinar si es necesario (_mergeFiles)
  → Descomprimir (_extractFiles)
  → Verificar checksum (_verifyChecksum)
  → Limpiar temporales (_cleanup)

// 3. Envía eventos en tiempo real
  onDownloadStart()
  onDownloadProgress() → Barra de progreso
  onMergingStart()
  onExtractingStart()
  onVerifyingStart()
  onDownloadComplete()
  onDownloadError()
```

### Velocidades Esperadas

**Descarga:**

- 5 Mbps (conecta..) → 16 segundos/GB
- 50 Mbps (buena) → 1.6 segundos/GB
- 500 Mbps (fibra) → 0.16 segundos/GB

**Descompresión:**

- HDD (lento) → 100-300 MB/s
- SSD (normal) → 500-1000 MB/s
- NVMe (rápido) → 2000-5000 MB/s

**Ejemplo: 10GB**

- Descargar a 50 Mbps: ~27 minutos
- Descomprimir en SSD: ~10 segundos
- Total: ~27 minutos 10 segundos

---

## ✅ Checklist: Configurar una Descarga

- [ ] Tener el archivo .zip listo
- [ ] Generar checksum SHA-256
- [ ] Subir .zip a servidor
- [ ] Subir .txt (checksum) a servidor
- [ ] Agregar entrada a files.apps.json
- [ ] Verificar que el `id` en apps.json y files.apps.json coinciden
- [ ] Probar descarga local (si es posible)
- [ ] Probar desde StormStore
- [ ] Verificar que los archivos se descomprimieron correctamente

---

## 🎓 Conclusión

El sistema `files.apps.json` **simplifica enormemente** la instalación:

✅ **Antes:** Necesitaba crear un instalador .exe para cada juego  
✅ **Ahora:** Solo necesito un .zip y un archivo de checksum

✅ **Antes:** Los usuarios esperaban 10-20 minutos instalando  
✅ **Ahora:** Los usuarios solo esperan la descarga (más rápido si tiene buen Internet)

✅ **Antes:** Riesgo de corrupción durante instalación  
✅ **Ahora:** Verificación de integridad garantizada

Es un sistema **más moderno, seguro y rápido** 🚀
