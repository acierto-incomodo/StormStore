# Este script actualiza los archivos para la documentación en la carpeta /docs/files

# Definir rutas
$scriptDir = $PSScriptRoot
$rootDir = Resolve-Path -Path (Join-Path $scriptDir "..")
$destDir = Join-Path $rootDir "docs/files"

$sourceJson = Join-Path $scriptDir "apps.json"
$sourceAssets = Join-Path $scriptDir "assets/apps"

Write-Host "--- Actualizando archivos de documentación ---"

# 1. Limpiar el directorio de destino (eliminar y volver a crear)
Write-Host "Limpiando directorio de destino: $destDir"
if (Test-Path $destDir) {
    Remove-Item -Path $destDir -Recurse -Force
}
New-Item -Path $destDir -ItemType Directory -Force | Out-Null

# 2. Copiar apps.json
Write-Host "Copiando 'application/apps.json'..."
Copy-Item -Path $sourceJson -Destination $destDir

# 3. Copiar la carpeta assets/apps
Write-Host "Copiando contenido de 'application/assets/apps'..."
Copy-Item -Path (Join-Path $sourceAssets "*") -Destination $destDir -Recurse

Write-Host "✅ Archivos de documentación actualizados en 'docs/files'."