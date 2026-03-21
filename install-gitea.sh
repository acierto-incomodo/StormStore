#!/bin/bash
set -e

# --- Color and Print Functions ---
C_RESET='\033[0m'
C_RED='\033[0;31m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_CYAN='\033[0;36m'
C_BOLD='\033[1m'

print_header() {
    printf "\n${C_CYAN}${C_BOLD}=== %s ===${C_RESET}\n" "$1"
}

print_success() {
    printf "${C_GREEN}[✔] %s${C_RESET}\n" "$1"
}

print_info() {
    printf "${C_YELLOW}[i] %s${C_RESET}\n" "$1"
}

print_error() {
    printf "${C_RED}[✖] Error: %s${C_RESET}\n" "$1" >&2
}

# --- Config ---
GITEA_VERSION="1.22.3"
GITEA_USER="git"
GITEA_HOME="/home/git"
GITEA_WORK_DIR="/var/lib/gitea"
GITEA_CUSTOM="/etc/gitea"
GITEA_BIN="/usr/local/bin/gitea"
ARCH="linux-amd64"

# --- Start ---
print_header "Instalando Gitea $GITEA_VERSION"

# Comprobar permisos de administrador
if [ "$EUID" -ne 0 ]; then
    print_error "Este script requiere privilegios de administrador. Ejecútalo con sudo."
    exit 1
fi

# Comprobar dependencias
print_info "Comprobando dependencias..."
for dep in curl git; do
    if ! command -v "$dep" &> /dev/null; then
        print_error "'$dep' no está instalado. Instálalo antes de continuar (apt install $dep)."
        exit 1
    fi
done
print_success "Dependencias OK."

# Crear usuario del sistema para Gitea
print_header "Configurando usuario del sistema"
if id "$GITEA_USER" &>/dev/null; then
    print_info "El usuario '$GITEA_USER' ya existe. Saltando creación."
else
    adduser \
        --system \
        --shell /bin/bash \
        --gecos 'Gitea' \
        --group \
        --disabled-password \
        --home "$GITEA_HOME" \
        "$GITEA_USER"
    print_success "Usuario '$GITEA_USER' creado."
fi

# Crear estructura de directorios
print_header "Creando estructura de directorios"
mkdir -p "$GITEA_WORK_DIR"/{custom,data,log}
mkdir -p "$GITEA_CUSTOM"
chown -R "$GITEA_USER":"$GITEA_USER" "$GITEA_WORK_DIR"
chown -R root:"$GITEA_USER" "$GITEA_CUSTOM"
chmod -R 750 "$GITEA_WORK_DIR"
chmod 770 "$GITEA_CUSTOM"
print_success "Directorios creados y permisos asignados."

# Descargar binario de Gitea
print_header "Descargando Gitea"
DOWNLOAD_URL="https://dl.gitea.com/gitea/${GITEA_VERSION}/gitea-${GITEA_VERSION}-${ARCH}"
print_info "Descargando desde: $DOWNLOAD_URL"

if curl -fsSL "$DOWNLOAD_URL" -o "$GITEA_BIN"; then
    chmod +x "$GITEA_BIN"
    print_success "Binario descargado en $GITEA_BIN."
else
    print_error "No se pudo descargar el binario de Gitea. Comprueba tu conexión o la versión especificada."
    exit 1
fi

# Verificar que el binario funciona
print_info "Verificando binario..."
INSTALLED_VER=$("$GITEA_BIN" --version 2>/dev/null | awk '{print $3}' || true)
if [ -n "$INSTALLED_VER" ]; then
    print_success "Gitea $INSTALLED_VER verificado correctamente."
else
    print_error "El binario descargado no responde. Puede estar corrupto."
    exit 1
fi

# Crear servicio systemd
print_header "Configurando servicio systemd"
print_info "Creando archivo de servicio en /etc/systemd/system/gitea.service..."

cat > /etc/systemd/system/gitea.service <<EOF
[Unit]
Description=Gitea (Git con interfaz web)
After=network.target
After=syslog.target

[Service]
RestartSec=2s
Type=simple
User=${GITEA_USER}
Group=${GITEA_USER}
WorkingDirectory=${GITEA_WORK_DIR}
ExecStart=${GITEA_BIN} web --config ${GITEA_CUSTOM}/app.ini
Restart=always
Environment=USER=${GITEA_USER} HOME=${GITEA_HOME} GITEA_WORK_DIR=${GITEA_WORK_DIR}

[Install]
WantedBy=multi-user.target
EOF

print_success "Archivo de servicio creado."

# Habilitar e iniciar el servicio
print_info "Recargando systemd y habilitando servicio..."
systemctl daemon-reload
systemctl enable --now gitea

# Comprobar estado
sleep 2
if systemctl is-active --quiet gitea; then
    print_success "Servicio gitea activo y en ejecución."
else
    print_error "El servicio no arrancó correctamente. Revisa los logs con: journalctl -u gitea -n 50"
    exit 1
fi

# Resumen final
print_header "Instalación completada"
print_success "Gitea $GITEA_VERSION instalado y ejecutándose."
printf "${C_YELLOW}[i] Accede al asistente de configuración en:${C_RESET} ${C_BOLD}http://localhost:3000${C_RESET}\n"
printf "${C_YELLOW}[i] Datos almacenados en:${C_RESET}  $GITEA_WORK_DIR\n"
printf "${C_YELLOW}[i] Configuración en:${C_RESET}      $GITEA_CUSTOM/app.ini\n"
printf "${C_YELLOW}[i] Logs del servicio:${C_RESET}      journalctl -u gitea -f\n"
printf "${C_YELLOW}[i] Gestionar servicio:${C_RESET}     systemctl [start|stop|restart|status] gitea\n"
