# Reemplazar espacios por guiones en los nombres de archivo .exe y .blockmap generados
Get-ChildItem -Path "dist" -Recurse -Include '*.exe', '*.blockmap' -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.Name -match ' ') {
        $newName = $_.Name -replace ' ', '-'
        Rename-Item -Path $_.FullName -NewName $newName
    }
}