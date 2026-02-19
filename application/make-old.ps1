# Eliminar carpetas y archivos previos antes de construir
if (Test-Path -Path "node_modules") {
    Write-Host "Eliminando node_modules..."
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path -Path "dist") {
    Write-Host "Eliminando dist..."
    Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
}

if (Test-Path -Path "package-lock.json") {
    Write-Host "Eliminando package-lock.json..."
    Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
}

npm i

npm run build

# Reemplazar espacios por guiones en los nombres de archivo .exe y .blockmap generados
Get-ChildItem -Path . -Recurse -Include '*.exe', '*.blockmap' | ForEach-Object {
    $newName = $_.Name -replace ' ', '-'
    Rename-Item -Path $_.FullName -NewName $newName
}

# Duplicar el .exe generado y llamarlo StormStore-Setup.exe
$exeFile = Get-ChildItem -Path "dist" -Filter "*.exe" | Select-Object -First 1
if ($exeFile) {
    Copy-Item -Path $exeFile.FullName -Destination (Join-Path $exeFile.DirectoryName "StormStore-Setup.exe") -Force
    Write-Host "Se ha creado una copia: StormStore-Setup.exe"
}