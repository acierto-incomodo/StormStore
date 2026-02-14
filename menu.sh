#!/bin/bash

# Re-ejecutar el script con sudo si no es root
if [ "$EUID" -ne 0 ]; then
exec sudo "$0" "$@"
fi

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

print_option() {
    printf "   ${C_CYAN}[${C_YELLOW}%s${C_CYAN}]${C_RESET} %s\n" "$1" "$2"
}

# Limpiar pantalla para mostrar el menú
clear

# Banner
printf "${C_BLUE}"
cat << "EOF"
  ____              _ _             _   ____            _                 
 / ___|__ _ _ __ __| (_)_ __   __ _| | / ___| _   _ ___| |_ ___ _ __ ___  
| |   / _` | '__/ _` | | '_ \ / _` | | \___ \| | | / __| __/ _ \ '_ ` _ \ 
| |__| (_| | | | (_| | | | | | (_| | |  ___) | |_| \__ \ ||  __/ | | | | |
 \____\__,_|_| _\__,_|_|_|_|_|\__,_|_| |____/ \__, |___/\__\___|_| |_| |_|
|_ _|_ __  ___| |_ __ _| | | ___ _ __         |___/                       
 | || '_ \/ __| __/ _` | | |/ _ \ '__|                                    
 | || | | \__ \ || (_| | | |  __/ |                                       
|___|_| |_|___/\__\__,_|_|_|\___|_|                                       
EOF
printf "${C_RESET}By StormGamesStudios v(1.0.10)\n\n"

print_header "MENÚ PRINCIPAL"
echo ""
print_option "1" "Instalar Todo"
print_option "2" "Actualizar Sistema (Update Debian)"
print_option "3" "Eliminar StormStore"
print_option "4" "Instalar MCSManager"
print_option "5" "Instalar PairDrop Server"
print_option "6" "Instalar Playit (APT)"
print_option "7" "Instalar Dependencias Extra"
print_option "reboot" "Reiniciar Sistema"
print_option "poweroff" "Apagar Sistema"
print_option "update" "Actualizar Sistema (Full Upgrade)"
print_option "exit" "Salir"
echo ""
printf "${C_CYAN}=====================================================${C_RESET}\n"
echo ""

read -p "Selecciona una opción [1-7 + extra]: " option

case $option in
    1)
        print_header "🚀 Iniciando Instalación..."
        if [ -f "./debian-machine-install-auto-3.sh" ]; then
            ./debian-machine-install-auto-3.sh
        else
            printf "${C_RED}[✖] No se encontró el archivo debian-machine-install-auto-3.sh en este directorio.${C_RESET}\n"
            printf "${C_YELLOW}[i] Intentando descargarlo...${C_RESET}\n"
            wget -q --show-progress https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/debian-machine-install-auto-3.sh
            chmod +x debian-machine-install-auto-3.sh
            ./debian-machine-install-auto-3.sh
        fi
        ;;
    2)
        print_header "🔄 Actualizando Sistema Modo Debian..."
        if [ -f "./update-debian.sh" ]; then
            ./update-debian.sh
        else
            printf "${C_RED}[✖] No se encontró el archivo update-debian.sh en este directorio.${C_RESET}\n"
            printf "${C_YELLOW}[i] Intentando descargarlo...${C_RESET}\n"
            wget -q --show-progress https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/update-debian.sh
            chmod +x update-debian.sh
            ./update-debian.sh
        fi
        ;;
    3)
        print_header "Eliminando StormStore..."
        if [ -f "./remove-all.sh" ]; then
            ./remove-all.sh
        else
            printf "${C_RED}[✖] No se encontró el archivo remove-all.sh en este directorio.${C_RESET}\n"
            printf "${C_YELLOW}[i] Intentando descargarlo...${C_RESET}\n"
            wget -q --show-progress https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/remove-all.sh
            chmod +x remove-all.sh
            ./remove-all.sh
        fi
        ;;
    4)
        print_header "🎮 Instalando MCSManager..."
        if [ -f "./install-mcsmanager.sh" ]; then
            ./install-mcsmanager.sh
        else
            printf "${C_RED}[✖] No se encontró el archivo install-mcsmanager.sh en este directorio.${C_RESET}\n"
            printf "${C_YELLOW}[i] Intentando descargarlo...${C_RESET}\n"
            wget -q --show-progress https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/install-mcsmanager.sh
            chmod +x install-mcsmanager.sh
            ./install-mcsmanager.sh
        fi
        ;;
    5)
        print_header "💧 Instalando PairDrop Server..."
        if [ -f "./install-pairdrop.sh" ]; then
            ./install-pairdrop.sh
        else
            printf "${C_RED}[✖] No se encontró el archivo install-pairdrop.sh en este directorio.${C_RESET}\n"
            printf "${C_YELLOW}[i] Intentando descargarlo...${C_RESET}\n"
            wget -q --show-progress https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/install-pairdrop.sh
            chmod +x install-pairdrop.sh
            ./install-pairdrop.sh
        fi
        ;;
    6)
        print_header "🌍 Instalando Playit..."
        curl -SsL https://playit-cloud.github.io/ppa/key.gpg | gpg --dearmor | tee /etc/apt/trusted.gpg.d/playit.gpg >/dev/null
        echo "deb [signed-by=/etc/apt/trusted.gpg.d/playit.gpg] https://playit-cloud.github.io/ppa/data ./" | tee /etc/apt/sources.list.d/playit-cloud.list
        apt update
        apt install -y playit
        systemctl enable playit
        systemctl start playit
        echo "Playit instalado correctamente."
        ;;
    7)
        print_header "🔄 Instalando dependencias extra..."
        if [ -f "./dependencias-extra.sh" ]; then
            ./dependencias-extra.sh
        else
            printf "${C_RED}[✖] No se encontró el archivo dependencias-extra.sh en este directorio.${C_RESET}\n"
            printf "${C_YELLOW}[i] Intentando descargarlo...${C_RESET}\n"
            wget -q --show-progress https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/dependencias-extra.sh
            chmod +x dependencias-extra.sh
            ./dependencias-extra.sh
        fi
        ;;
    reboot)
        print_header "🔄 Reiniciando el sistema..."
        reboot
        ;;
    poweroff)
        print_header "🛑 Apagando el sistema..."
        poweroff
        ;;
    update)
        echo "🧹 Limpiando caché de APT..."
        apt clean

        echo "🔄 Actualizando lista de paquetes..."
        apt update

        echo "⬆️ Actualizando el sistema (full-upgrade)..."
        apt full-upgrade -y

        echo "🗑️ Eliminando paquetes innecesarios..."
        apt autoremove -y

        echo "✅ Todo listo"

        print_header "Actualizando Menu..."
        rm -f ./menu.sh
        wget -q --show-progress https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/menu.sh
        chmod +x menu.sh
        ./menu.sh
        ;;
    exit)
        echo "Saliendo..."
        exit 0
        ;;
    make)
        print_header "🚧 Iniciando Script de Construcción..."
        chmod +x make.sh
        if [ -n "$SUDO_USER" ]; then
            # Run as the original user to avoid permission issues in .git
            sudo -u "$SUDO_USER" ./make.sh
        else
            ./make.sh
        fi
        echo "Saliendo..."
        exit 0
        ;;
    *)
        printf "${C_RED}[✖] Opción inválida.${C_RESET}\n"
        for i in {5..1}; do
            printf "\r${C_YELLOW}Reintentando en%2d segundos... (Presiona Ctrl+C para cancelar)${C_RESET}" "$i"
            sleep 1
        done
        chmod +x menu.sh
        ./menu.sh
        ;;
esac
