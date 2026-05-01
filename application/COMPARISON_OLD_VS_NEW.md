# 🔄 Comparación Visual: Sistema Antiguo vs Nuevo

## 📊 Flujo Lado a Lado

### SISTEMA ANTIGUO ❌

```
                          USUARIO EN STORMSTORE
                                  │
                                  ▼
                          HACE CLIC EN "INSTALAR"
                                  │
                                  ▼
                    STORMSTORE LEE apps.json
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
              "download" encontrado    Intenta ejecutar
                    │                           │
                    ▼                           ▼
         DESCARGA instalador.exe         ❌ ERROR
         (500 MB - 2 GB)
         ⏳ 5-10 minutos (a 50 Mbps)
                    │
                    ▼
        EJECUTA instalador.exe
        (Abre ventana)
        Usuario debe elegir:
         • Ubicación de instalación
         • Accesos directos
         • Componentes opcionales
                    │
                    ▼
        ⏳ ESPERA A QUE TERMINE LA INSTALACIÓN
        (10-30 minutos según el juego)

        Mientras instala:
        • Copia archivos
        • Crea registro de Windows
        • Crea accesos directos
        • Modifica variables de sistema
                    │
                    ▼
        ELIMINA instalador.exe
                    │
                    ▼
        ✅ COMPLETADO (después de 20-40 minutos)

PROBLEMAS:
❌ Lento (instalador ocupa mucho tiempo)
❌ Modificar registro del sistema
❌ Usuario debe interactuar
❌ Si se interrumpe, hay que reinstalar
❌ Modificaciones en variables de entorno
```

### SISTEMA NUEVO ✅

```
                          USUARIO EN STORMSTORE
                                  │
                                  ▼
                          HACE CLIC EN "INSTALAR"
                                  │
                                  ▼
                    STORMSTORE LEE files.apps.json
                    usando el ID del app
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
              ID encontrado           ID no encontrado
                    │                           │
                    ▼                           ▼
         CREA DIRECTORIO TEMPORAL      Fallback a sistema antiguo
         %APPDATA%/.../temp_downloads/
                    │
                    ▼
         DESCARGA ARCHIVOS (en paralelo)
         • juego.zip.001 (10 GB)
         • juego.zip.002 (10 GB)
         • juego.zip.003 (5 GB)
         ⏳ 27 minutos (a 50 Mbps, en paralelo)

         📊 Progreso en tiempo real:
         ├─ % completado
         ├─ Velocidad (MB/s)
         ├─ Tiempo restante
         └─ Archivos descargados
                    │
                    ▼
         COMBINA ARCHIVOS
         juego.zip.001 + 002 + 003 = juego.zip (35GB)
         ⏳ 5 minutos

         Luego elimina:
         ❌ juego.zip.001
         ❌ juego.zip.002
         ❌ juego.zip.003
                    │
                    ▼
         DESCOMPRIME juego.zip
         Con 7zr.exe en:
         C:\Juegos\MiJuego\
         ⏳ 30 segundos (SSD) a 5 minutos (HDD)
                    │
                    ▼
         VERIFICA INTEGRIDAD
         Descarga checksum remoto
         Calcula SHA-256 local
         Compara:
         • Remoto: abc123def...
         • Local:  abc123def...
         ✅ COINCIDEN
         ⏳ 30 segundos
                    │
                    ▼
         LIMPIA TEMPORALES
         Elimina: temp_downloads/
         ❌ Archivos temporales
                    │
                    ▼
         ✅ COMPLETADO (después de 30-35 minutos)

VENTAJAS:
✅ Más rápido (no hay instalador lento)
✅ Sin modificaciones del sistema
✅ Proceso automático (sin interacción)
✅ Verificación de integridad garantizada
✅ Fácil de revertir (solo eliminar carpeta)
✅ Portable (funciona en cualquier ubicación)
✅ Menos espacio en disco
```

---

## 📈 Comparación de Tiempos

### Instalación de 35GB (Juego Grande)

```
                   ANTIGUO          NUEVO
                   ❌               ✅
DESCARGA        5-10 min         ~27 min
                (1 archivo)      (paralelo)

INSTALACIÓN     10-30 min        0.5-5 min
                (ejecutable)     (descomprimir)

VERIFICACIÓN    NO HAY           ~0.5 min
                                 (SHA-256)

LIMPIEZA        2-5 min          1-2 min

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL          20-45 MIN        30-35 MIN*

*El nuevo es más rápido en descompresión pero descarga
más datos. La descarga es el cuello de botella.
```

---

## 🗂️ Estructura de Carpetas

### SISTEMA ANTIGUO

```
C:\Users\Usuario\AppData\Roaming\
└─ StormGamesStudios\
   └─ StormStore\
      ├─ StormStoreCache\    (iconos descargados)
      ├─ apps.json            (índice de apps)
      └─ settings.json         (configuración)

C:\Users\Usuario\Downloads\
└─ MiJuego.exe              (instalador temporal)

C:\Program Files (x86)\
└─ MiJuego\                 (instalado por el instalador)
   ├─ game.exe
   ├─ librerias\
   └─ datos\

HKEY_LOCAL_MACHINE\SOFTWARE\...  ← Registro modificado
```

### SISTEMA NUEVO

```
C:\Users\Usuario\AppData\Roaming\
└─ StormGamesStudios\
   └─ StormStore\
      ├─ StormStoreCache\    (iconos)
      ├─ temp_downloads\      (descargas temporales)
      │  └─ juego-001\
      │     └─ 1682093156789\
      │        ├─ juego.zip.001
      │        ├─ juego.zip.002
      │        └─ juego.zip.003
      ├─ files.apps.json      (índice de descargas)
      ├─ apps.json            (índice de apps)
      └─ settings.json         (configuración)

C:\Juegos\
└─ MiJuego\                 (descomprimido directamente)
   ├─ game.exe
   ├─ librerias\
   ├─ datos\
   └─ miJuego.txt            (checksum para verificación)

REGISTRO → SIN CAMBIOS ✅
```

---

## 🔍 Caso de Uso Real: Minecraft

### ANTIGUO ❌

```
Usuario: "Quiero jugar Minecraft"

1. Abre StormStore, hace clic en Minecraft
2. Descarga MinecraftInstaller.exe (200 MB)
   ⏳ 2-3 minutos

3. Ejecuta el instalador
   → Ventana emergente
   → "¿Dónde desea instalar?"
   → Usuario elige: C:\Program Files\Minecraft

4. Instalador copia archivos (500 MB)
   ⏳ 5-10 minutos
   → Modifica el registro
   → Crea shortcuts
   → Instala Java si falta

5. Termina el instalador
6. Elimina MinecraftInstaller.exe

⏳ TOTAL: 10-15 minutos
```

### NUEVO ✅

```
Usuario: "Quiero jugar Minecraft"

1. Abre StormStore, hace clic en Minecraft
2. Sistema detecta "minecraft" en files.apps.json
3. Descarga minecraft.zip (500 MB, en paralelo)
   ⏳ 3-5 minutos

4. Descomprime en C:\Games\Minecraft
   ⏳ 30 segundos

5. Verifica integridad (SHA-256)
   ⏳ 10 segundos

6. ✅ ¡LISTO PARA JUGAR!

⏳ TOTAL: 4-6 minutos
⚡ 3x más rápido
```

---

## 📋 files.apps.json vs apps.json

```
┌─────────────────────────────────────────────────────┐
│              apps.json (ÍNDICE DE APPS)             │
├─────────────────────────────────────────────────────┤
│ {                                                   │
│   "id": "minecraft",                                │
│   "name": "Minecraft",                              │
│   "download": "https://...",  ← URL instalador     │
│   "paths": ["C:\\Games\\Minecraft\\minecraft.exe"], │
│   "category": "Juegos",                             │
│   "icon": "minecraft.png"                           │
│ }                                                   │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
        ¿Qué es esto? ¿Dónde se instala?
        ¿Cuál es el ejecutable?

┌─────────────────────────────────────────────────────┐
│           files.apps.json (CÓMO DESCARGAR)          │
├─────────────────────────────────────────────────────┤
│ {                                                   │
│   "id": "minecraft",  ← MISMO ID que apps.json    │
│   "name": "Minecraft",                              │
│   "files": ["minecraft.zip"],  ← QUÉ descargar    │
│   "merge": false,                                   │
│   "extractPath": "C:\\Games\\Minecraft", ← DÓNDE   │
│   "checksumFile": "minecraft.txt",                  │
│   "checksumUrl": "https://...",                     │
│   "downloadUrl": "https://..."                      │
│ }                                                   │
└─────────────────────────────────────────────────────┘

RELACIÓN:
apps.json = "INFORMACIÓN" del app
files.apps.json = "CÓMO INSTALARLO"
```

---

## 🎯 Integración: El Proceso Completo

```
USUARIO INSTALA UN APP:

1. STORMSTORE ABRE
   └─ Lee: apps.json (lista de apps)
   └─ Lee: files.apps.json (cómo descargar)

2. USUARIO HACE CLIC EN "INSTALAR"
   └─ Obtiene el ID del app (ej: "minecraft")

3. STORMSTORE BUSCA EN files.apps.json
   ├─ SI ENCUENTRA:
   │  └─ Inicia descarga con DownloadManager
   │     ├─ Descarga archivos
   │     ├─ Combina si es necesario
   │     ├─ Descomprime
   │     ├─ Verifica
   │     └─ ✅ Completado
   │
   └─ SI NO ENCUENTRA:
      └─ Fallback: usa "download" de apps.json
         ├─ Descarga instalador .exe
         ├─ Ejecuta instalador
         └─ ✅ Completado (método antiguo)

4. USUARIO YA PUEDE JUGAR
   └─ El app está en extractPath
```

---

## 🚀 Ventajas Resumen

| Aspecto            | Antiguo            | Nuevo           |
| ------------------ | ------------------ | --------------- |
| **Velocidad**      | Lento (instalador) | Rápido (ZIP)    |
| **Instalación**    | 10-30 min          | 0.5-5 min       |
| **Descarga**       | 1 archivo          | Paralelo        |
| **Integridad**     | No verifica        | SHA-256 ✅      |
| **Portabilidad**   | Poco portable      | Muy portable    |
| **Registro**       | Modifica           | Sin cambios     |
| **Facilidad**      | Medio              | Automático      |
| **Desinstalación** | Complicada         | Solo eliminar   |
| **Espacio temp**   | Alto               | Bajo            |
| **Errores**        | Más posibles       | Menos probables |

---

## 💡 Conclusión

El sistema nuevo (`files.apps.json`) es:

✅ **Más rápido:** Menos procesamiento
✅ **Más seguro:** Verificación de integridad
✅ **Más limpio:** Sin modificaciones del sistema
✅ **Más fácil:** Proceso automático
✅ **Más flexible:** Archivos portátiles

Perfecto para juegos y aplicaciones modernas 🎮
