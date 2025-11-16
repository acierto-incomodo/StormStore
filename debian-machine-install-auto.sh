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
apt install -y sudo curl wget git lsb-release ca-certificates gnupg btop

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
# 6️⃣ Instalar Python 3
# ========================
echo "Instalando Python 3..."
apt-get install -y python3 python3-venv python3-dev python3-pip

# ========================
# 6️⃣ Instalar UFW
# ========================
echo "Instalando UFW..."
apt-get install -y ufw

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
docker compose pull
docker compose up -d

# ========================
# 12️⃣ Configurar MCSManager config.json
# ========================
CONFIG_PATH="/home/$USER/mcsmanager/web/data/SystemConfig/config.json"
echo "Configurando config.json de MCSManager..."

mkdir -p "$(dirname "$CONFIG_PATH")"

cat > "$CONFIG_PATH" <<EOL
{
    "httpPort": 23333,
    "httpIp": "0.0.0.0",
    "prefix": "",
    "reverseProxyMode": false,
    "dataPort": 23334,
    "forwardType": 1,
    "crossDomain": false,
    "gzip": false,
    "maxCompress": 1,
    "maxDownload": 10,
    "zipType": 1,
    "totpDriftToleranceSteps": 0,
    "loginCheckIp": true,
    "loginInfo": "",
    "canFileManager": true,
    "allowUsePreset": false,
    "language": "en_us",
    "presetPackAddr": "https://script.mcsmanager.com/market.json",
    "redisUrl": "",
    "allowChangeCmd": false,
    "businessMode": false,
    "businessId": "",
    "panelId": "c8e0b8d9-44e3-40fe-8ec8-970a39f03d2d",
    "registerCode": "",
    "ssl": false,
    "sslPemPath": "",
    "sslKeyPath": ""
}
EOL

echo "config.json configurado con httpIp 0.0.0.0 y puerto 23333."


# ========================
# 11️⃣ Instalando StormPack
# ========================
curl -fsSL https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/install-all.sh | sudo bash


# ========================
# 12️⃣ Servicio systemd para actualizar al reinicio
# ========================
echo "Creando servicio para actualizar el sistema automáticamente al reinicio..."

cat > /usr/local/sbin/auto-update.sh <<EOL
#!/bin/bash
apt update
apt upgrade -y
EOL

chmod +x /usr/local/sbin/auto-update.sh

cat > /etc/systemd/system/auto-update.service <<EOL
[Unit]
Description=Actualizar sistema automáticamente al reinicio
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/auto-update.sh

[Install]
WantedBy=multi-user.target
EOL

systemctl daemon-reload
systemctl enable auto-update.service
echo "Servicio auto-update creado y habilitado."


# ========================
# 11️⃣ btop ya instalado en dependencias
# ========================
echo "¡Setup completo! Docker, MCSManager, Node.js, Java, Python, SSH, puertos, autologin y btop listos."
echo "By StormGamesStudios"


# ========================
# 🔁 Reinicio con cuenta atrás de 10 segundos
# ========================
echo "El sistema se reiniciará en 10 segundos..."
for i in {10..1}; do
    echo "$i..."
    sleep 1
done
echo "Reiniciando ahora..."
sleep 1
echo "Bienvenido a Cardinal System"
sleep 1

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


reboot
