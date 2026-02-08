#!/bin/bash
set -e

#!/usr/bin/env bash

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

print_success() {
    printf "${C_GREEN}[✔] ¡Hecho! %s${C_RESET}\n" "$1"
}

print_info() {
    printf "${C_YELLOW}[i] %s${C_RESET}\n" "$1"
}

# Banner de bienvenida
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
printf "${C_RESET}By StormGamesStudios (v1.0.22 - Old)\n\n"
print_info "Iniciando el script de configuración automática para Debian Trixie."
print_info "Este script se ejecutará como root y configurará todo el entorno."
sleep 3

# Usuario
USER="aitor"

print_header "1️⃣  Actualizando el sistema"
print_info "Actualizando la lista de paquetes y actualizando los paquetes instalados..."
apt update && apt upgrade -y
print_success "Sistema actualizado correctamente."

print_header "2️⃣  Instalando dependencias básicas"
print_info "Instalando: sudo, curl, wget, git, btop, zsh y otras utilidades..."
apt install -y sudo curl wget git lsb-release ca-certificates gnupg btop zsh net-tools glances ncdu duf micro tmpreaper tcpdump resolvconf
print_success "Dependencias básicas instaladas."

print_header "3️⃣  Instalando Docker"
print_info "Descargando el script oficial de instalación de Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
print_info "Ejecutando el script de instalación..."
sh get-docker.sh
rm get-docker.sh

print_info "Añadiendo al usuario '$USER' al grupo 'docker' para permitir el uso sin sudo."
usermod -aG docker $USER

print_info "Habilitando y arrancando el servicio de Docker..."
systemctl enable docker
systemctl start docker
print_success "Docker instalado y configurado."

print_header "4️⃣  Instalando Node.js (v22 y v20)"
print_info "Configurando el repositorio de NodeSource para Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
print_info "Instalando Node.js 22 desde apt..."
apt install -y nodejs

print_info "Instalando nvm (Node Version Manager) para gestionar múltiples versiones..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "/root/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm install 22

print_success "Node.js 22 (sistema) y Node.js 20/22 (nvm) instalados."

print_header "5️⃣  Instalando Java (8, 17 y 21)"
print_info "Instalando OpenJDK 8, 17 y 21..."
apt install -y openjdk-8-jdk openjdk-17-jdk openjdk-21-jdk
print_success "Java 8, 17 y 21 instalados."

print_header "6️⃣  Instalando Python 3"
print_info "Instalando Python 3 y herramientas relacionadas (pip, venv)..."
apt-get install -y python3 python3-venv python3-dev python3-pip
print_success "Python 3 instalado."

# print_header "7️⃣  Instalando Playit"
# print_info "Habilitando y arrancando servicio Playit..."
# systemctl enable playit
# systemctl start playit
# print_success "Servicio Playit habilitado y en ejecución."

print_header "7️⃣  Instalando Tailscale"
print_info "Instalando Tailscale y habilitando el servicio..."
curl -fsSL https://tailscale.com/install.sh | sh
print_info "Habilitando y arrancando service de Tailscale..."
systemctl enable tailscaled
systemctl start tailscaled
print_success "Tailscale instalado y en ejecución."

print_header "7️⃣  Instalando y Configurando UFW (Firewall)"
print_info "Instalando UFW (Uncomplicated Firewall)..."
apt-get install -y ufw

print_header "8️⃣  Configurando SSH en múltiples puertos"
print_info "Modificando la configuración de SSH para escuchar en los puertos 22, 1234 y 2222..."
sed -i '/^Port /d' /etc/ssh/sshd_config
echo -e "Port 22\nPort 1234\nPort 2222" >> /etc/ssh/sshd_config
print_info "Reiniciando el servicio SSH para aplicar los cambios..."
systemctl restart ssh
print_success "SSH configurado en puertos 22, 1234 y 2222."

PORTS=(22 1234 2222 23333 24444 3000 3001 24454 25565 25566 16384 8123 4000 4001 2223 10000)
print_info "Reiniciando UFW a su configuración por defecto..."
ufw --force reset
print_info "Configurando reglas por defecto: denegar entrantes, permitir salientes."
ufw default allow outgoing
ufw default deny incoming
print_info "Abriendo los puertos necesarios..."
for p in "${PORTS[@]}"; do
    printf "    - Abriendo puerto ${C_YELLOW}%s${C_RESET} (TCP/UDP)\n" "$p"
    ufw allow $p/tcp
    ufw allow $p/udp
    sudo ufw allow in on tailscale0 to any port $p
done
print_info "Activando el firewall UFW..."
ufw enable
print_success "Firewall UFW configurado y activado."

# print_header "9️⃣  Instalando MCSManager con Docker"
# print_info "Creando directorios para MCSManager en /home/$USER/mcsmanager..."
# mkdir -p /home/$USER/mcsmanager/{web,daemon/data/InstanceData,daemon/logs,web/logs,web/data}

# cat > /home/$USER/mcsmanager/docker-compose.yml <<EOL
# version: "3"
#
# services:
#   web:
#     image: githubyumao/mcsmanager-web:latest
#     restart: unless-stopped
#     ports:
#       - "23333:23333"
#     volumes:
#       - /etc/localtime:/etc/localtime:ro
#       - /home/$USER/mcsmanager/web/data:/opt/mcsmanager/web/data
#       - /home/$USER/mcsmanager/web/logs:/opt/mcsmanager/web/logs
#
#   daemon:
#     image: githubyumao/mcsmanager-daemon:latest
#     restart: unless-stopped
#     ports:
#       - "24444:24444"
#     environment:
#       - MCSM_DOCKER_WORKSPACE_PATH=/home/$USER/mcsmanager/daemon/data/InstanceData
#     volumes:
#       - /etc/localtime:/etc/localtime:ro
#       - /home/$USER/mcsmanager/daemon/data:/opt/mcsmanager/daemon/data
#       - /home/$USER/mcsmanager/daemon/logs:/opt/mcsmanager/daemon/logs
#       - /var/run/docker.sock:/var/run/docker.sock
# EOL

# print_info "Navegando al directorio de MCSManager..."
# cd /home/$USER/mcsmanager
# print_info "Descargando las imágenes de Docker más recientes para MCSManager..."
# #tre docker compose pull
# print_info "Iniciando los contenedores de MCSManager en segundo plano..."
# # docker compose up -d
# print_success "MCSManager instalado y en ejecución."

# print_info "Creando servicio systemd para reiniciar MCSManager al arranque..."
# cat > /etc/systemd/system/mcsmanager-restart.service <<EOL
# [Unit]
# Description=Reiniciar contenedores MCSManager al arranque
# After=docker.service
# Requires=docker.service
#
# [Service]
# Type=oneshot
# ExecStart=/usr/bin/docker stop mcsmanager-daemon-1 mcsmanager-web-1
#
# [Install]
# WantedBy=multi-user.target
# EOL

# systemctl daemon-reload
# systemctl enable mcsmanager-restart.service
# print_success "Servicio 'mcsmanager-restart.service' creado y habilitado."

# print_header "🔟 Configurando MCSManager (config.json)"
# CONFIG_PATH_WEB="/home/$USER/mcsmanager/web/data/SystemConfig/config.json"
# CONFIG_PATH_PANEL="/home/$USER/mcsmanager/daemon/data/Config/global.json"

# mkdir -p "$(dirname "$CONFIG_PATH_WEB")"

# # cat > "$CONFIG_PATH_WEB" <<EOL
# # {
# #   "httpPort": 23333,
# #     "httpIp": "0.0.0.0",
# #     "prefix": "",
# #     "reverseProxyMode": false,
# #     "dataPort": 23333,
# #     "forwardType": 1,
# #     "crossDomain": false,
# #     "gzip": false,
# #    "maxCompress": 1,
# #    "maxDownload": 10,
# #    "zipType": 1,
# #    "totpDriftToleranceSteps": 0,
# #    "loginCheckIp": true,
# #    "loginInfo": "",
# #    "canFileManager": true,
# #    "allowUsePreset": false,
# #    "language": "en_us",
# #    "presetPackAddr": "https://script.mcsmanager.com/market.json",
# #    "redisUrl": "",
# #    "allowChangeCmd": false,
# #    "businessMode": false,
# #    "businessId": "",
# #    "panelId": "c8e0b8d9-44e3-40fe-8ec8-970a39f03d2d",
# #    "registerCode": "",
# #    "ssl": false,
# #    "sslPemPath": "",
# #    "sslKeyPath": ""
# #}
# #EOL

# print_success "config.json de MCSManager creado con la configuración por defecto."

print_header "1️⃣1️⃣ Instalando Repositorio StormStore y Apps"
print_info "Añadiendo el repositorio APT de StormStore e instalando aplicaciones..."
print_info "  - CardinalAI, WhatsApp Web, PairDrop, MultiAI, TheShooter, KartsMultiplayer y más."
curl -fsSL https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/install-all.sh | sudo bash
print_success "Repositorio y aplicaciones de StormStore instalados."

# print_header "1️⃣2️⃣ Creando servicio de auto-actualización"
# print_info "Creando un script y un servicio systemd para actualizar el sistema en cada reinicio."

# cat > /usr/local/sbin/auto-update.sh <<EOL
# #!/bin/bash
# apt update
# apt upgrade -y
# EOL

# chmod +x /usr/local/sbin/auto-update.sh

# cat > /etc/systemd/system/auto-update.service <<EOL
# [Unit]
# Description=Actualizar sistema automáticamente al reinicio
# After=network.target

# [Service]
# Type=oneshot
# ExecStart=/usr/local/sbin/auto-update.sh

# [Install]
# WantedBy=multi-user.target
# EOL

# systemctl daemon-reload
# systemctl enable auto-update.service
# print_success "Servicio 'auto-update.service' creado y habilitado."

print_header "1️⃣3️⃣ Instalando y configurando Fail2Ban"
print_info "Instalando Fail2Ban para proteger contra ataques de fuerza bruta..."
apt install -y fail2ban

cat > /etc/fail2ban/jail.local <<EOL
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22,1234,2222
EOL

print_info "Habilitando y reiniciando el servicio Fail2Ban..."
systemctl enable fail2ban
systemctl restart fail2ban
print_success "Fail2Ban configurado para proteger los puertos SSH 22, 1234 y 2222."

print_header "1️⃣4️⃣ Instalando Ngrok"
print_info "Añadiendo el repositorio de Ngrok e instalando ngrok..."
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
  | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
  && echo "deb https://ngrok-agent.s3.amazonaws.com bookworm main" \
  | sudo tee /etc/apt/sources.list.d/ngrok.list \
  && sudo apt update \
  && sudo apt install -y ngrok
print_success "Ngrok instalado."

print_info "Eliminando carpetas de Oh My Zsh antiguas si existen..."
for d in "/home/aito/.oh-my-zsh" "/home/$USER/.oh-my-zsh"; do
    if [ -d "$d" ]; then
        rm -rf "$d"
        print_success "Eliminado $d"
    fi
done

print_header "1️⃣4️⃣ Instalando Oh My Zsh para el usuario '$USER'"
print_info "Instalando Oh My Zsh de forma no interactiva..."
sudo -u $USER sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh) --unattended"
print_info "Cambiando la shell por defecto del usuario '$USER' a Zsh..."
chsh -s $(which zsh) $USER
print_success "Oh My Zsh instalado y configurado como shell por defecto."

print_header "1️⃣5️⃣ Configurando comportamiento de la tapa del portátil"
print_info "Modificando logind.conf para ignorar el cierre de la tapa..."
sed -i '/^HandleLidSwitch=/d' /etc/systemd/logind.conf
sed -i '/^HandleLidSwitchDocked=/d' /etc/systemd/logind.conf
echo -e "HandleLidSwitch=ignore\nHandleLidSwitchDocked=ignore" >> /etc/systemd/logind.conf
systemctl restart systemd-logind
print_success "El sistema ya no se suspenderá al cerrar la tapa."

print_header "1️⃣6️⃣ Instalando Webmin"
print_info "Configurando repositorio e instalando Webmin..."
curl -o setup-repos.sh https://raw.githubusercontent.com/webmin/webmin/master/setup-repos.sh
sh setup-repos.sh --force
rm setup-repos.sh
apt-get install -y webmin
print_success "Webmin instalado. Accede en https://<IP>:10000"

print_header "1️⃣6️⃣ Configurando Prompt de Root"
print_info "Configurando el prompt (PS1) en /root/.bashrc..."
cat >> /root/.bashrc << 'EOF'

export PS1="\[\033[01;34m\][Cardinal System] \[\033[00m\]- \[\033[01;32m\]\u@\h:\w\$ \[\033[00m\]"
EOF
print_success "Prompt de root configurado."

print_header "1️⃣7️⃣  Recargando actualización del sistema"
print_info "Actualizando la lista de paquetes, actualizando los paquetes instalados e eliminando extras innecesarios..."
apt update && apt upgrade -y && apt autoremove -y
print_success "Sistema actualizado correctamente."

print_header "Finalizando la instalación"
print_success "Descargando el script del menú rapido..."
rm -f menu.sh
wget -q --show-progress https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/menu.sh
chmod +x menu.sh
rm -f /root/menu.sh
wget -q --show-progress https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/menu.sh -O /root/menu.sh
chmod +x /root/menu.sh

print_header "🎉 ¡INSTALACIÓN COMPLETA! 🎉"
print_success "El sistema está listo y configurado."
print_info "Componentes instalados: Docker, MCSManager, Node.js, Java, Python, SSH, UFW, Fail2Ban, Oh My Zsh, btop."
printf "${C_CYAN}By StormGamesStudios${C_RESET}\n"

print_header "🔁 Reinicio del sistema"
print_info "El sistema se reiniciará para aplicar todos los cambios."
echo ""
for i in {10..1}; do
    printf "\r${C_YELLOW}Reiniciando en%2d segundos... (Presiona Ctrl+C para cancelar)${C_RESET}" "$i"
    sleep 1
done
echo -e "\nReiniciando ahora..."
sleep 1
echo "Bienvenido a Cardinal System..."
sleep 1

reboot
