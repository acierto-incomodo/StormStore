@echo off
echo === Procesando imágenes con Python ===

:: Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo Python no está instalado. Por favor, instala Python primero.
    exit /b 1
)

:: Instalar Pillow si no está instalado
echo Instalando/verificando Pillow...
pip install Pillow --quiet

:: Ejecutar el script de redimensionamiento
echo Ejecutando imagenes.py...
if exist "imagenes.py" (
    python imagenes.py
    echo ✅ Procesamiento de imágenes completado
) else (
    echo ❌ No se encontró imagenes.py
    exit /b 1
)

exit /b 0