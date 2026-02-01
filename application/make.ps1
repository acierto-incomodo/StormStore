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