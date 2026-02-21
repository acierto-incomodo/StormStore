<#
.SYNOPSIS
    Make script para StormStore - build seguro para GitHub
.DESCRIPTION
    Usa el certificado ya existente y la contraseña de .env para firmar.
    No expone la contraseña en el script.
#>

# Cargar variables de entorno desde .env
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        $name, $value = $_.Split('=', 2)
        if ($name -and $value) { 
            [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), [System.EnvironmentVariableTarget]::Process) 
        }
    }
}

# Ruta al certificado existente
$certPath = "C:\Users\melio\Documents\GitHub\Certificados\StormStore\StormStore.pfx"

# Verificar que el certificado y la contraseña funcionen
if (Test-Path $certPath) {
    Write-Host "Verificando certificado..."
    $certPass = [System.Environment]::GetEnvironmentVariable("CERTIFICATE_PASSWORD", [System.EnvironmentVariableTarget]::Process)
    if (-not $certPass) {
        Write-Error "ERROR: La variable CERTIFICATE_PASSWORD no está definida en .env"
        exit 1
    }

    $null = certutil -p "$certPass" -dump "$certPath" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ERROR: La contraseña en .env no es válida para el certificado en $certPath"
        exit 1
    }
} else {
    Write-Error "ERROR: No se encuentra el certificado en $certPath"
    exit 1
}

# Limpiar dist
if (Test-Path -Path "dist") {
    Write-Host "Eliminando dist..."
    Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
}

# Instalar dependencias
npm install

# Ejecutar build
Write-Host "Ejecutando build de electron-builder..."
npm run build

# Reemplazar espacios en los nombres de archivos .exe y .blockmap
Get-ChildItem -Path . -Recurse -Include '*.exe', '*.blockmap' | ForEach-Object {
    $newName = $_.Name -replace ' ', '-'
    Rename-Item -Path $_.FullName -NewName $newName
}

# Duplicar el .exe generado como StormStore-Setup.exe
$exeFile = Get-ChildItem -Path "dist" -Filter "*.exe" | Select-Object -First 1
if ($exeFile) {
    Copy-Item -Path $exeFile.FullName -Destination (Join-Path $exeFile.DirectoryName "StormStore-Setup.exe") -Force
    Write-Host "Se ha creado una copia: StormStore-Setup.exe"
}

Write-Host "✅ Build completada correctamente"