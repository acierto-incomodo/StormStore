# Este script actualiza los archivos para la documentación en la carpeta /docs/files

# Definir rutas
$scriptDir = $PSScriptRoot
$rootDir = Resolve-Path -Path (Join-Path $scriptDir "..")
$destDir = Join-Path $rootDir "docs/assets"
$destAssetsDir = Join-Path $rootDir "docs/assets/apps"
$destAppsSizeDir = Join-Path $rootDir "docs/assets/apps-size"
$destTrailersDir = Join-Path $rootDir "docs/assets/trailers"

$sourceJson = Join-Path $scriptDir "apps.json"
$sourceAssets = Join-Path $scriptDir "assets/apps"
$sourceAppsSize = Join-Path $scriptDir "assets/apps-size"
$sourceTrailers = Join-Path $scriptDir "assets/media/trailers"

Write-Host "--- Actualizando archivos de documentación ---"

# 0. Ejecutar run.py.bat desde la ubicación assets
Write-Host "Ejecutando run.py.bat para procesar imágenes..."
$runPyBatPath = Join-Path $scriptDir "assets\run.py.bat"
if (Test-Path $runPyBatPath) {
    Write-Host "Ejecutando: $runPyBatPath"
    Push-Location (Join-Path $scriptDir "assets")
    try {
        & $runPyBatPath
        Write-Host "✅ run.py.bat ejecutado correctamente" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Error al ejecutar run.py.bat: $_" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
} else {
    Write-Host "⚠️ No se encontró run.py.bat en: $runPyBatPath" -ForegroundColor Yellow
}

# 1. Limpiar el directorio de destino (eliminar y volver a crear)
Write-Host "`nLimpiando directorio de destino: $destDir"
if (Test-Path $destDir) {
    Remove-Item -Path $destDir -Recurse -Force
}
New-Item -Path $destDir -ItemType Directory -Force | Out-Null

# Limpiar directorio de assets
Write-Host "Limpiando directorio de assets: $destAssetsDir"
if (Test-Path $destAssetsDir) {
    Remove-Item -Path $destAssetsDir -Recurse -Force
}
New-Item -Path $destAssetsDir -ItemType Directory -Force | Out-Null

# Limpiar directorio de apps-size
Write-Host "Limpiando directorio de apps-size: $destAppsSizeDir"
if (Test-Path $destAppsSizeDir) {
    Remove-Item -Path $destAppsSizeDir -Recurse -Force
}
New-Item -Path $destAppsSizeDir -ItemType Directory -Force | Out-Null

# Limpiar directorio de trailers
Write-Host "Limpiando directorio de trailers: $destTrailersDir"
if (Test-Path $destTrailersDir) {
    Remove-Item -Path $destTrailersDir -Recurse -Force
}
New-Item -Path $destTrailersDir -ItemType Directory -Force | Out-Null

# 2. Copiar apps.json
Write-Host "`nCopiando 'application/apps.json'..."
Copy-Item -Path $sourceJson -Destination $destDir

# 3. Copiar la carpeta assets/apps
Write-Host "Copiando contenido de 'application/assets/apps'..."
if (Test-Path $sourceAssets) {
    Copy-Item -Path (Join-Path $sourceAssets "*") -Destination $destAssetsDir -Recurse
    Write-Host "✅ assets/apps copiado" -ForegroundColor Green
} else {
    Write-Host "⚠️ Directorio no encontrado: $sourceAssets" -ForegroundColor Yellow
}

# 4. Copiar la carpeta assets/apps-size
Write-Host "Copiando contenido de 'application/assets/apps-size'..."
if (Test-Path $sourceAppsSize) {
    Copy-Item -Path (Join-Path $sourceAppsSize "*") -Destination $destAppsSizeDir -Recurse
    Write-Host "✅ assets/apps-size copiado" -ForegroundColor Green
} else {
    Write-Host "⚠️ Directorio no encontrado: $sourceAppsSize" -ForegroundColor Yellow
}

# 5. Copiar la carpeta assets/media/trailers
Write-Host "Copiando contenido de 'application/assets/media/trailers'..."
if (Test-Path $sourceTrailers) {
    Copy-Item -Path (Join-Path $sourceTrailers "*") -Destination $destTrailersDir -Recurse
    Write-Host "✅ assets/trailers copiado" -ForegroundColor Green
} else {
    Write-Host "⚠️ Directorio no encontrado: $sourceTrailers" -ForegroundColor Yellow
}

# 6. Copiar el instalador generado en setup a la carpeta dist principal
Write-Host "`nCopiando 'StormStore-Setup.exe' a 'application/dist'..."
$setupExeSource = Join-Path $scriptDir "setup\dist\StormStore-Setup.exe"
$appDistDest = Join-Path $scriptDir "dist"
if (Test-Path $setupExeSource) {
    if (!(Test-Path $appDistDest)) { New-Item -ItemType Directory -Path $appDistDest -Force | Out-Null }
    Copy-Item -Path $setupExeSource -Destination $appDistDest -Force
    Write-Host "✅ Instalador copiado" -ForegroundColor Green
} else {
    Write-Host "⚠️ Instalador no encontrado: $setupExeSource" -ForegroundColor Yellow
}

Write-Host "`n✅ Archivos de documentación actualizados en 'docs/assets'." -ForegroundColor Green