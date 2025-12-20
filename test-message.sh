#!/bin/bash

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

# --- INICIO DE LA DEMOSTRACIÓN ---

# Banner de bienvenida
printf "${C_YELLOW}"
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
printf "${C_RESET}By StormGamesStudios\n\n"
print_info "Iniciando el script de configuración automática para Debian Trixie."
print_info "Este script se ejecutará como root y configurará todo el entorno."
sleep 1

print_header "1️⃣  Actualizando el sistema"
print_info "Actualizando la lista de paquetes y actualizando los paquetes instalados..."
sleep 1
print_success "Sistema actualizado correctamente."
sleep 1

print_header "2️⃣  Instalando dependencias básicas"
print_info "Instalando: sudo, curl, wget, git, btop, zsh y otras utilidades..."
sleep 1
print_success "Dependencias básicas instaladas."
sleep 1

print_header "8️⃣  Configurando Firewall (Ejemplo de lista)"
PORTS=(22 1234 23333 24444 25565 8123)
print_info "Abriendo los puertos necesarios..."
for p in "${PORTS[@]}"; do
    printf "    - Abriendo puerto ${C_YELLOW}%s${C_RESET} (TCP/UDP)\n" "$p"
    sleep 0.2
done
print_info "Activando el firewall UFW..."
sleep 1
print_success "Firewall UFW configurado y activado."
sleep 1

print_header "1️⃣4️⃣ Instalando Oh My Zsh para el usuario 'aitor'"
print_info "Instalando Oh My Zsh de forma no interactiva..."
sleep 1
print_info "Cambiando la shell por defecto del usuario 'aitor' a Zsh..."
sleep 1
print_success "Oh My Zsh instalado y configurado como shell por defecto."
sleep 1

print_header "🎉 ¡INSTALACIÓN COMPLETA! 🎉"
print_success "El sistema está listo y configurado."
print_info "Componentes instalados: Docker, MCSManager, Node.js, Java, Python, SSH, UFW, Fail2Ban, Oh My Zsh, btop."
printf "${C_CYAN}By StormGamesStudios${C_RESET}\n"
sleep 1

print_header "🔁 Reinicio del sistema"
print_info "El sistema se reiniciará para aplicar todos los cambios."
echo ""
for i in {5..1}; do
    printf "\r${C_YELLOW}Reiniciando en %2d segundos... (Presiona Ctrl+C para cancelar)${C_RESET}" "$i"
    sleep 1
done
echo -e "\nReiniciando ahora..."
sleep 1
echo "Bienvenido a Cardinal System..."
sleep 1

print_info "Fin de la demostración de mensajes."