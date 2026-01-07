#!/bin/bash
set -e

# --- Color and Print Functions ---
C_RESET='\033[0m'
C_RED='\033[0;31m'
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

print_error() {
    printf "${C_RED}[✖] Error: %s${C_RESET}\n" "$1"
}

print_header "Instalando PairDrop Server (Docker)"

# Comprobar permisos de administrador
if [ "$EUID" -ne 0 ]; then
  print_error "Este script requiere privilegios de administrador. Por favor ejecútalo con sudo."
  exit 1
fi

# Comprobar si Docker está instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor instálalo antes de continuar."
    exit 1
fi

# Comprobar si existe un contenedor previo y eliminarlo
if docker ps -a --format '{{.Names}}' | grep -q "^pairdrop$"; then
    print_info "Se encontró un contenedor 'pairdrop' existente. Eliminando..."
    docker stop pairdrop >/dev/null 2>&1 || true
    docker rm pairdrop >/dev/null 2>&1 || true
fi

print_info "Descargando e iniciando contenedor PairDrop..."

# Ejecutar el contenedor con reinicio automático
docker run -d --restart=unless-stopped --name=pairdrop -p 127.0.0.1:3000:3000 lscr.io/linuxserver/pairdrop

if [ $? -eq 0 ]; then
    print_success "PairDrop instalado y ejecutándose correctamente."
    print_info "Accede a través de: http://127.0.0.1:3000"
else
    print_error "Fallo al iniciar el contenedor Docker."
    exit 1
fi
