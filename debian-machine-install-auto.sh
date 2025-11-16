#!/bin/bash
set -e

# =========================================
# Script de setup completo para Debian Trixie
# =========================================

# Usuario
USER="aitor"

# ========================
# 1️⃣ Actualizar sistema
# ========================
echo "Actualizando sistema..."
apt update && apt upgrade -y

# ========================
# 2️⃣ Instalar dependencias básicas
# ========================
echo "Instalando dependencias básicas..."
apt install -y curl wget git lsb-release ca-certificates gnupg btop

# ========================
# 3️⃣ Instalar Docker
# ========================
echo "Instalando Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# ========================
# 4️⃣ Instalar Node.js 22 y 20
# ========================
echo "Instalando Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

echo "Instalando Node.js 20 (via nvm)..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "/root/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm install 22

# ========================
# 5️⃣ Instalar Java 21
# ========================
echo "Instalando Java 21..."
apt install -y openjdk-21-jdk

# ========================
# 6️⃣ Instalar Python 3.14
# ========================
echo "Instalando Python 3.14..."
apt install -y python3.14 python3.14-venv python3.14-dev

# ========================
# 7️⃣ Configurar SSH con dos puertos
# ========================
echo "Configurando SSH en los puertos 22 y 1234..."
sed -i '/^Port /d' /etc/ssh/sshd_config
echo -e "Port 22\nPort 1234" >> /etc/ssh/sshd_config
systemctl restart ssh

# ========================
# 8️⃣ Abrir puertos en UFW
# ========================
PORTS=(22 1234 23333 24444 3000 3001 24454 25565 25566 16384 8123 4000 4001 2223)
echo "Configurando UFW..."
ufw --force reset
ufw default allow outgoing
ufw default deny incoming
for p in "${PORTS[@]}"; do
    ufw allow $p/tcp
    ufw allow $p/udp
done
ufw enable

# ========================
# 9️⃣ Instalar MCSManager con Docker
# ========================
echo "Instalando MCSManager..."
mkdir -p /home/$USER/mcsmanager/{web,daemon/data/InstanceData,daemon/logs,web/logs,web/data}

cat > /home/$USER/mcsmanager/docker-compose.yml <<EOL
version: "3"

services:
  web:
    image: githubyumao/mcsmanager-web:latest
    restart: unless-stopped
    ports:
      - "23333:23333"
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /home/$USER/mcsmanager/web/data:/opt/mcsmanager/web/data
      - /home/$USER/mcsmanager/web/logs:/opt/mcsmanager/web/logs

  daemon:
    image: githubyumao/mcsmanager-daemon:latest
    restart: unless-stopped
    ports:
      - "24444:24444"
    environment:
      - MCSM_DOCKER_WORKSPACE_PATH=/home/$USER/mcsmanager/daemon/data/InstanceData
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /home/$USER/mcsmanager/daemon/data:/opt/mcsmanager/daemon/data
      - /home/$USER/mcsmanager/daemon/logs:/opt/mcsmanager/daemon/logs
      - /var/run/docker.sock:/var/run/docker.sock
EOL

cd /home/$USER/mcsmanager
docker compose up -d

# ========================
# 🔟 Autologin en tty1
# ========================
echo "Configurando autologin en tty1..."
mkdir -p /etc/systemd/system/getty@tty1.service.d
tee /etc/systemd/system/getty@tty1.service.d/override.conf > /dev/null <<EOL
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $USER --noclear %I \$TERM
EOL
systemctl daemon-reexec
systemctl restart getty@tty1

# ========================
# 11️⃣ btop ya instalado en dependencias
# ========================
echo "¡Setup completo! Docker, MCSManager, Node.js, Java, Python, SSH, puertos, autologin y btop listos."
