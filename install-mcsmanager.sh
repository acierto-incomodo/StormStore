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

# Comprobar si es root
if [ "$EUID" -ne 0 ]; then
    printf "${C_RED}[✖] Este script debe ejecutarse como root.${C_RESET}\n"
    exit 1
fi

print_header "1️⃣  Preparando entorno en /srv/"
print_info "Cambiando al directorio /srv/..."
cd /srv/

print_header "2️⃣  Instalando Node.js 20.11"
if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v)
    print_info "Node.js ya está instalado ($NODE_VER). Saltando descarga manual."
else
    print_info "Descargando Node.js 20.11.0..."
    wget -q https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
    
    print_info "Descomprimiendo archivo..."
    tar -xf node-v20.11.0-linux-x64.tar.xz
    rm node-v20.11.0-linux-x64.tar.xz

    print_info "Configurando enlaces simbólicos en /usr/bin..."
    ln -sf /srv/node-v20.11.0-linux-x64/bin/node /usr/bin/node
    ln -sf /srv/node-v20.11.0-linux-x64/bin/npm /usr/bin/npm
    print_success "Node.js instalado y configurado."
fi

print_header "3️⃣  Instalando MCSManager"
print_info "Creando directorio /srv/mcsmanager/..."
mkdir -p /srv/mcsmanager/
cd /srv/mcsmanager/

print_info "Descargando la última versión de MCSManager..."
wget -q https://github.com/MCSManager/MCSManager/releases/latest/download/mcsmanager_linux_release.tar.gz

print_info "Descomprimiendo archivos..."
tar --strip-components=1 -xzf mcsmanager_linux_release.tar.gz
rm mcsmanager_linux_release.tar.gz

print_info "Instalando dependencias del panel..."
chmod +x install.sh
./install.sh
print_success "MCSManager descargado e instalado."

print_header "4️⃣  Configurando ejecución automática (Systemd)"

# Servicio Daemon
print_info "Creando servicio systemd para MCSManager Daemon..."
cat > /etc/systemd/system/mcsm-daemon.service <<EOF
[Unit]
Description=MCSManager Daemon
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/mcsmanager
ExecStart=/bin/bash /srv/mcsmanager/start-daemon.sh
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

# Servicio Web
print_info "Creando servicio systemd para MCSManager Web..."
cat > /etc/systemd/system/mcsm-web.service <<EOF
[Unit]
Description=MCSManager Web Panel
After=network.target mcsm-daemon.service

[Service]
Type=simple
WorkingDirectory=/srv/mcsmanager
ExecStart=/bin/bash /srv/mcsmanager/start-web.sh
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOF

print_info "Recargando demonio de systemd..."
systemctl daemon-reload

print_info "Habilitando y arrancando servicios..."
systemctl enable --now mcsm-daemon
systemctl enable --now mcsm-web

print_success "Servicios mcsm-daemon y mcsm-web configurados y en ejecución."

print_header "🎉 Instalación Finalizada"
print_info "Accede al panel web en: http://<TU-IP>:23333"
print_info "Puertos abiertos necesarios: 23333 (Web) y 24444 (Daemon)"