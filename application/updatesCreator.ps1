# Definir variables
$repoDir = "$PWD/.."  # asumimos que el script está en root/application
$applicationDir = "$repoDir/application"
$diffFile = "$applicationDir/Changes.txt"

# Eliminar Changes.txt si existe
if (Test-Path $diffFile) {
    Remove-Item $diffFile
    Write-Host "Archivo anterior eliminado: $diffFile"
}

# Entrar al repo
Push-Location $repoDir

# Obtener el último tag
$latestTag = git tag --sort=-creatordate | Select-Object -First 1
Write-Host "Último release encontrado: $latestTag"

# Asegurarse de estar en main actualizado
git checkout main
git pull

# Generar diff solo para la carpeta application desde el último tag hasta HEAD
Write-Host "Generando diff de 'application' desde $latestTag hasta HEAD..."
git diff $latestTag HEAD -- application > $diffFile 2>$null

# Comprobar si hay contenido
if ((Get-Content $diffFile | Measure-Object -Line).Lines -eq 0) {
    Add-Content $diffFile "No hay cambios en 'application' desde el release $latestTag."
    Write-Host "No se encontraron cambios nuevos en 'application'."
} else {
    Write-Host "`n¡Listo! El archivo con los cambios se ha guardado en:`n$diffFile"
}

# Volver al directorio original
Pop-Location