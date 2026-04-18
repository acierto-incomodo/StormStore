@echo off
set "ROOT_DIR=%~dp0"

echo [1/2] Ejecutando make.ps1 en la carpeta application...
pushd "%ROOT_DIR%application"
powershell -ExecutionPolicy Bypass -File make.ps1
popd

echo.
echo [2/2] Ejecutando generate_tree.py en la carpeta docs...
pushd "%ROOT_DIR%docs"
python generate_tree.py
popd

echo.
echo ¡Todo listo! El proceso ha terminado con éxito.
pause