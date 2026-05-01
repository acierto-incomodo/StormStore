#!/bin/bash
set -e

# --- Colores y funciones de impresión ---
C_RESET='\033[0m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_CYAN='\033[0;36m'
C_RED='\033[0;31m'

print_header() {
    printf "\n${C_CYAN}=== %s ===${C_RESET}\n" "$1"
}

print_success() {
    printf "${C_GREEN}[✔] %s${C_RESET}\n" "$1"
}

print_info() {
    printf "${C_YELLOW}[i] %s${C_RESET}\n" "$1"
}

print_error() {
    printf "${C_RED}[✘] %s${C_RESET}\n" "$1"
}

# El script se ejecuta desde la carpeta 'application'
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

SOURCE_JSON="$SCRIPT_DIR/apps.json"
SOURCE_ASSETS="$SCRIPT_DIR/assets/apps"
SOURCE_APPS_SIZE="$SCRIPT_DIR/assets/apps-size"
SOURCE_TRAILERS="$SCRIPT_DIR/assets/media/trailers"
DEST_DIR="$ROOT_DIR/docs/assets"
DEST_ASSETS_DIR="$ROOT_DIR/docs/assets/apps"
DEST_APPS_SIZE_DIR="$ROOT_DIR/docs/assets/apps-size"
DEST_TRAILERS_DIR="$ROOT_DIR/docs/assets/trailers"

print_header "Actualizando archivos para la documentación"

# 0. Ejecutar run.py.bat desde la ubicación assets
print_info "Ejecutando run.py.bat para procesar imágenes..."
RUN_PY_BAT_PATH="$SCRIPT_DIR/assets/run.py.bat"

if [ -f "$RUN_PY_BAT_PATH" ]; then
    print_info "Ejecutando: $RUN_PY_BAT_PATH"
    # Guardar directorio actual
    CURRENT_DIR=$(pwd)
    # Cambiar al directorio assets
    cd "$SCRIPT_DIR/assets"
    
    # Ejecutar run.py.bat (en Linux/Mac可能需要使用wine o similar para .bat)
    if command -v wine &> /dev/null; then
        # Si hay wine instalado (para ejecutar .bat en Linux/Mac)
        if wine "$RUN_PY_BAT_PATH" 2>/dev/null; then
            print_success "run.py.bat ejecutado correctamente (via wine)"
        else
            print_error "Error al ejecutar run.py.bat con wine"
        fi
    elif command -v cmd.exe &> /dev/null; then
        # Si estamos en WSL o similar con cmd.exe disponible
        if cmd.exe /c "$RUN_PY_BAT_PATH" 2>/dev/null; then
            print_success "run.py.bat ejecutado correctamente (via cmd.exe)"
        else
            print_error "Error al ejecutar run.py.bat con cmd.exe"
        fi
    else
        # En Linux/Mac sin soporte para .bat, mostrar advertencia
        print_error "No se puede ejecutar .bat en este sistema (falta wine o cmd.exe)"
        print_info "Asegúrate de ejecutar manualmente: cd $SCRIPT_DIR/assets && ./run.py.bat"
        
        # Intentar ejecutar directamente el script Python si existe
        TAMAÑO_IMAGENES_PY="$SCRIPT_DIR/assets/tamaño-imagenes.py"
        if [ -f "$TAMAÑO_IMAGENES_PY" ]; then
            print_info "Intentando ejecutar tamaño-imagenes.py directamente..."
            if command -v python3 &> /dev/null; then
                cd "$SCRIPT_DIR/assets"
                python3 "$TAMAÑO_IMAGENES_PY"
                print_success "tamaño-imagenes.py ejecutado correctamente"
            else
                print_error "Python3 no encontrado"
            fi
        fi
    fi
    
    # Volver al directorio original
    cd "$CURRENT_DIR"
else
    print_error "No se encontró run.py.bat en: $RUN_PY_BAT_PATH"
fi

# 1. Limpiar el directorio de destino
print_info "Limpiando directorio de destino: $DEST_DIR"
rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"

print_info "Limpiando directorio de assets: $DEST_ASSETS_DIR"
rm -rf "$DEST_ASSETS_DIR"
mkdir -p "$DEST_ASSETS_DIR"

print_info "Limpiando directorio de apps-size: $DEST_APPS_SIZE_DIR"
rm -rf "$DEST_APPS_SIZE_DIR"
mkdir -p "$DEST_APPS_SIZE_DIR"

print_info "Limpiando directorio de trailers: $DEST_TRAILERS_DIR"
rm -rf "$DEST_TRAILERS_DIR"
mkdir -p "$DEST_TRAILERS_DIR"

# 2. Copiar apps.json
print_info "Copiando 'application/apps.json'..."
cp "$SOURCE_JSON" "$DEST_DIR/"

# 3. Copiar la carpeta assets/apps
print_info "Copiando contenido de 'application/assets/apps'..."
if [ -d "$SOURCE_ASSETS" ]; then
    cp -r "$SOURCE_ASSETS/." "$DEST_ASSETS_DIR/"
    print_success "apps copiados correctamente"
else
    print_error "Directorio no encontrado: $SOURCE_ASSETS"
fi

# 4. Copiar la carpeta assets/apps-size
print_info "Copiando contenido de 'application/assets/apps-size'..."
if [ -d "$SOURCE_APPS_SIZE" ]; then
    cp -r "$SOURCE_APPS_SIZE/." "$DEST_APPS_SIZE_DIR/"
    print_success "apps-size copiados correctamente"
else
    print_error "Directorio no encontrado: $SOURCE_APPS_SIZE"
fi

# 5. Copiar la carpeta assets/media/trailers
print_info "Copiando contenido de 'application/assets/media/trailers'..."
if [ -d "$SOURCE_TRAILERS" ]; then
    cp -r "$SOURCE_TRAILERS/." "$DEST_TRAILERS_DIR/"
    print_success "trailers copiados correctamente"
else
    print_error "Directorio no encontrado: $SOURCE_TRAILERS"
fi

print_success "Archivos de documentación actualizados en 'docs/assets'"
print_info "Contenido copiado:"
echo "  - apps.json"
echo "  - assets/apps/"
echo "  - assets/apps-size/"
echo "  - assets/trailers/"