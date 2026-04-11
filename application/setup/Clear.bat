@echo off
setlocal

set "folders=build dist downloads game theshooterlauncher_deb snap WinDownloads"
for %%f in (%folders%) do (
  if exist "%%~f\" (
    echo Eliminando carpeta: %%f
    rmdir /s /q "%%~f"
  ) else (
    echo No existe la carpeta: %%f
  )
)

set "files=main.spec theshooterlauncher_deb.deb launcher_win.py launcher_win.spec installer_updater.spec version_win_launcher.txt"
for %%f in (%files%) do (
  if exist "%%~f" (
    echo Eliminando archivo: %%f
    del /f /q "%%~f"
  ) else (
    echo No existe el archivo: %%f
  )
)

echo Proceso completado.
endlocal
exit /b 0