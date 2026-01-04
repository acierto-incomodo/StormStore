#!/bin/bash
set -e

# Colores para la salida
C_RESET='\033[0m'
C_RED='\033[0;31m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_BLUE='\033[0;34m'
C_CYAN='\033[0;36m'

print_header() {
    printf "\n${C_CYAN}=====================================================${C_RESET}\n"
    printf "${C_CYAN} %-50s ${C_RESET}\n" "$1"
    printf "${C_CYAN}=====================================================${C_RESET}\n"
}

print_success() {
    printf "${C_GREEN}[✔] ¡Hecho! %s${C_RESET}\n" "$1"
}

print_info() {
    printf "${C_YELLOW}[i] %s${C_RESET}\n" "$1"
}

print_header "Actualizando Script de Instalación"

print_info "Eliminando versión anterior..."
rm -f ./debian-machine-install-auto.sh

print_info "Descargando la última versión..."
wget https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/debian-machine-install-auto.sh

print_info "Dando permisos de ejecución..."
chmod +x debian-machine-install-auto.sh

print_success "Script actualizado correctamente."

print_header "Ejecutando Script de Instalación"
./debian-machine-install-auto.sh