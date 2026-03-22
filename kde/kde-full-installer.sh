#!/bin/bash

# kde-full-installer.sh
# Descarga e instala el menú KDE y system-update como comandos globales

if [ "$EUID" -ne 0 ]; then
  exec sudo "$0" "$@"
fi

BASE_URL="https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/kde"
INSTALL_DIR="/usr/local/bin"

C_RESET='\033[0m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_CYAN='\033[0;36m'

echo ""
printf "${C_CYAN}==============================${C_RESET}\n"
printf "${C_CYAN} KDE Full Installer           ${C_RESET}\n"
printf "${C_CYAN}==============================${C_RESET}\n"
echo ""

printf "${C_YELLOW}[i] Descargando menu...${C_RESET}\n"
wget -q --show-progress "$BASE_URL/menu.sh" -O "$INSTALL_DIR/menu"
chmod +x "$INSTALL_DIR/menu"

printf "${C_YELLOW}[i] Descargando system-update...${C_RESET}\n"
wget -q --show-progress "$BASE_URL/system-update.sh" -O "$INSTALL_DIR/system-update"
chmod +x "$INSTALL_DIR/system-update"

printf "${C_YELLOW}[i] Descargando install-kde.sh...${C_RESET}\n"
wget -q --show-progress "$BASE_URL/install-kde.sh" -O "$INSTALL_DIR/install-kde.sh"
chmod +x "$INSTALL_DIR/install-kde.sh"

printf "${C_YELLOW}[i] Descargando theme-installer-kde.sh...${C_RESET}\n"
wget -q --show-progress "$BASE_URL/theme-installer-kde.sh" -O "$INSTALL_DIR/theme-installer-kde.sh"
chmod +x "$INSTALL_DIR/theme-installer-kde.sh"

echo ""
printf "${C_GREEN}[✔] Todo instalado correctamente.${C_RESET}\n"
printf "${C_GREEN}[✔] Escribe 'menu' en la terminal para abrir el menú.${C_RESET}\n"
echo ""

exec "$INSTALL_DIR/menu"