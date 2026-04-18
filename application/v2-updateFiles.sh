#!/bin/bash
set -e

# --- Colores y funciones de impresión ---
C_RESET='\033[0m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_CYAN='\033[0;36m'

print_header() {
    printf "\n${C_CYAN}=== %s ===${C_RESET}\n" "$1"
}

print_success() {
    printf "${C_GREEN}[✔] %s${C_RESET}\n" "$1"
}

print_info() {
    printf "${C_YELLOW}[i] %s${C_RESET}\n" "$1"
}

# El script se ejecuta desde la carpeta 'application'
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

SOURCE_JSON="$SCRIPT_DIR/apps.json"
SOURCE_ASSETS="$SCRIPT_DIR/assets/apps"
DEST_DIR="$ROOT_DIR/docs/assets"
DEST_ASSETS_DIR="$ROOT_DIR/docs/assets/apps"

print_header "Actualizando archivos para la documentación"

# 1. Limpiar el directorio de destino
print_info "Limpiando directorio de destino: $DEST_DIR"
rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"

print_info "Limpiando directorio de assets: $DEST_ASSETS_DIR"
rm -rf "$DEST_ASSETS_DIR"
mkdir -p "$DEST_ASSETS_DIR"

# 2. Copiar apps.json
print_info "Copiando 'application/apps.json'..."
cp "$SOURCE_JSON" "$DEST_DIR/"

# 3. Copiar la carpeta assets/apps
print_info "Copiando contenido de 'application/assets/apps'..."
cp -r "$SOURCE_ASSETS/." "$DEST_ASSETS_DIR/"

print_success "Archivos de documentación actualizados en 'docs/files' y 'docs/assets/apps'."