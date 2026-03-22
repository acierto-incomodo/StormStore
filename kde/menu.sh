#!/bin/bash

# Re-ejecutar el script con sudo si no es root
if [ "$EUID" -ne 0 ]; then
  exec sudo "$0" "$@"
fi

REAL_USER="${SUDO_USER:-$USER}"
BASE_URL="https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/kde"
INSTALL_DIR="/usr/local/bin"

# Colores
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

print_option() {
  printf "   ${C_CYAN}[${C_YELLOW}%s${C_CYAN}]${C_RESET} %s\n" "$1" "$2"
}

clear

printf "${C_BLUE}"
cat << "EOF"
  _  _______  _____   __  __
 | |/ /  __ \|  ___| |  \/  | ___ _ __  _   _
 | ' /| |  | | |__   | |\/| |/ _ \ '_ \| | | |
 | . \| |__| |  __|  | |  | |  __/ | | | |_| |
 |_|\_\_____/|___|   |_|  |_|\___|_| |_|\__,_|

 v1.0.1 - By StormGamesStudios
EOF
printf "${C_RESET}By StormGamesStudios\n\n"

print_header "MENÚ KDE"
echo ""
print_option "1" "Ejecutar install-kde.sh"
print_option "2" "Ejecutar system-update"
print_option "3" "Ejecutar theme-installer-kde.sh"
print_option "4" "Instalar Vencord"
print_option "5" "Actualizar menú"
print_option "exit" "Salir"
echo ""
printf "${C_CYAN}=====================================================${C_RESET}\n"
echo ""

read -p "Selecciona una opción: " option

case $option in
  1)
    print_header "Ejecutando install-kde.sh..."
    if [ -f "$INSTALL_DIR/install-kde.sh" ]; then
      bash "$INSTALL_DIR/install-kde.sh"
    else
      printf "${C_YELLOW}[i] Descargando install-kde.sh...${C_RESET}\n"
      wget -q --show-progress "$BASE_URL/install-kde.sh" -O "$INSTALL_DIR/install-kde.sh"
      chmod +x "$INSTALL_DIR/install-kde.sh"
      bash "$INSTALL_DIR/install-kde.sh"
    fi
    exec "$INSTALL_DIR/menu"
    ;;
  2)
    print_header "Ejecutando system-update..."
    if [ -f "$INSTALL_DIR/system-update" ]; then
      bash "$INSTALL_DIR/system-update"
    else
      printf "${C_YELLOW}[i] Descargando system-update...${C_RESET}\n"
      wget -q --show-progress "$BASE_URL/system-update.sh" -O "$INSTALL_DIR/system-update"
      chmod +x "$INSTALL_DIR/system-update"
      bash "$INSTALL_DIR/system-update"
    fi
    exec "$INSTALL_DIR/menu"
    ;;
  3)
    print_header "Ejecutando theme-installer-kde.sh..."
    if [ -f "$INSTALL_DIR/theme-installer-kde.sh" ]; then
      bash "$INSTALL_DIR/theme-installer-kde.sh"
    else
      printf "${C_YELLOW}[i] Descargando theme-installer-kde.sh...${C_RESET}\n"
      wget -q --show-progress "$BASE_URL/theme-installer-kde.sh" -O "$INSTALL_DIR/theme-installer-kde.sh"
      chmod +x "$INSTALL_DIR/theme-installer-kde.sh"
      bash "$INSTALL_DIR/theme-installer-kde.sh"
    fi
    exec "$INSTALL_DIR/menu"
    ;;
  4)
    print_header "Instalando Vencord..."
    sudo -u $REAL_USER sh -c "$(curl -sS https://vencord.dev/install.sh)"
    exec "$INSTALL_DIR/menu"
    ;;
  5)
    print_header "Actualizando menú..."
    rm -f "$INSTALL_DIR/menu"
    rm -f "$INSTALL_DIR/system-update"
    wget -q --show-progress "$BASE_URL/menu.sh" -O "$INSTALL_DIR/menu"
    chmod +x "$INSTALL_DIR/menu"
    wget -q --show-progress "$BASE_URL/system-update.sh" -O "$INSTALL_DIR/system-update"
    chmod +x "$INSTALL_DIR/system-update"
    printf "${C_GREEN}[✔] Menú y system-update actualizados.${C_RESET}\n"
    exec "$INSTALL_DIR/menu"
    ;;
  exit)
    echo "Saliendo..."
    exit 0
    ;;
  *)
    printf "${C_RED}[✖] Opción inválida.${C_RESET}\n"
    for i in {3..1}; do
      printf "\r${C_YELLOW}Volviendo al menú en %d segundos...${C_RESET}" "$i"
      sleep 1
    done
    exec "$INSTALL_DIR/menu"
    ;;
esac