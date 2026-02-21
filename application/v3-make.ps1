# Cargar variables de entorno desde .env
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        $name, $value = $_.Split('=', 2)
        if ($name -and $value) { [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), [System.EnvironmentVariableTarget]::Process) }
    }
}

# Verificar validez del certificado y contraseña antes de compilar
$certPath = "C:\Users\melio\Documents\GitHub\Certificados\StormStore\StormStore.pfx"
$certPass = [System.Environment]::GetEnvironmentVariable("CERTIFICATE_PASSWORD", [System.EnvironmentVariableTarget]::Process)

if (Test-Path $certPath) {
    Write-Host "Verificando certificado..."
    $null = certutil -p "$certPass" -dump "$certPath" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ERROR: La contraseña en .env no es válida para el certificado en $certPath"
        exit 1
    }
}

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

# Duplicar el .exe generado y llamarlo StormStore-Setup.exe
$exeFile = Get-ChildItem -Path "dist" -Filter "*.exe" | Select-Object -First 1
if ($exeFile) {
    Copy-Item -Path $exeFile.FullName -Destination (Join-Path $exeFile.DirectoryName "StormStore-Setup.exe") -Force
    Write-Host "Se ha creado una copia: StormStore-Setup.exe"
}