if (Test-Path -Path "dist") {
    Write-Host "Eliminando dist..."
    Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
}

npm i

npm run build

# Reemplazar espacios por guiones en los nombres de archivo .exe y .blockmap generados
Get-ChildItem -Path . -Recurse -Include '*.exe', '*.blockmap' | ForEach-Object {
    $newName = $_.Name -replace ' ', '-'
    Rename-Item -Path $_.FullName -NewName $newName
}

# Actualizar archivos para la documentación
Write-Host "Ejecutando script para crear el instalador..."
cd .\setup
.\BuildWin.ps1
cd ..