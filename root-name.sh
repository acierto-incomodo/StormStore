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

print_header "1️⃣6️⃣ Configurando Prompt de Root"
print_info "Configurando el prompt (PS1) en /root/.bashrc..."
cat >> /root/.bashrc << 'EOF'

export PS1="\[\033[01;34m\][Cardinal System] \[\033[00m\]- \[\033[01;32m\]\u@\h:\w\$ \[\033[00m\]"
EOF
print_success "Prompt de root configurado."