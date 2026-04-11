# Guarda como Clear.ps1
$folders = @(
  "build",
  "dist",
  "downloads",
  "game",
  "theshooterlauncher_deb",
  "snap",
  "WinDownloads"
)

$files = @(
  "main.spec",
  "theshooterlauncher_deb.deb",
  "launcher_win.py",
  "launcher_win.spec",
  "installer_updater.spec",
  "version_win_launcher.txt",
  "StormStore-Setup.spec"
)

foreach ($folder in $folders) {
  if (Test-Path -LiteralPath $folder -PathType Container) {
    Write-Host "Eliminando carpeta: $folder"
    Remove-Item -LiteralPath $folder -Recurse -Force -ErrorAction SilentlyContinue
  } else {
    Write-Host "No existe la carpeta: $folder"
  }
}

foreach ($file in $files) {
  if (Test-Path -LiteralPath $file -PathType Leaf) {
    Write-Host "Eliminando archivo: $file"
    Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue
  } else {
    Write-Host "No existe el archivo: $file"
  }
}

Write-Host "Proceso completado."
exit 0