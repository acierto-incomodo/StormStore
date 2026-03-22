#!/bin/bash

set -e

# exigir sudo
if [ "$EUID" -ne 0 ]; then
  echo "Ejecuta este script con:"
  echo "sudo ./install-kde-v3.sh"
  exit 1
fi

USER_HOME=$(eval echo ~${SUDO_USER})

echo "=============================="
echo " KDE Neon Developer Bootstrap "
echo "=============================="

echo "Actualizando sistema..."
apt update
apt full-upgrade -y

echo "Instalando herramientas básicas..."

apt install -y \
git \
git-lfs \
gh \
curl \
wget \
build-essential \
cmake \
python3 \
python3-pip \
python3-venv \
software-properties-common \
apt-transport-https \
ca-certificates \
gnupg \
unzip \
zip \
flatpak \
htop \
neofetch \
snapd

systemctl enable --now snapd

echo "Activando Flathub..."

sudo -u $SUDO_USER flatpak remote-add --if-not-exists flathub \
https://flathub.org/repo/flathub.flatpakrepo

echo "Instalando Node.js LTS..."

curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

echo "Instalando herramientas globales Node..."

npm install -g \
npm \
pnpm \
yarn \
npm-check-updates \
vercel \
electron \
electron-builder

echo "Instalando Bun..."

sudo -u $SUDO_USER bash -c "curl -fsSL https://bun.sh/install | bash"

echo "Instalando Opera..."

wget -qO- https://deb.opera.com/archive.key | gpg --dearmor -o /usr/share/keyrings/opera.gpg

echo "deb [signed-by=/usr/share/keyrings/opera.gpg] https://deb.opera.com/opera-stable/ stable non-free" \
> /etc/apt/sources.list.d/opera.list

apt update
apt install -y opera-stable

echo "Instalando VS Code..."

wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/vscode.gpg

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/vscode.gpg] https://packages.microsoft.com/repos/code stable main" \
> /etc/apt/sources.list.d/vscode.list

apt update
apt install -y code

echo "Instalando GitHub Desktop..."

wget -O github-desktop.deb \
https://github.com/shiftkey/desktop/releases/latest/download/github-desktop-linux-amd64.deb

apt install -y ./github-desktop.deb
rm github-desktop.deb

echo "Instalando Docker..."

apt install -y docker.io
systemctl enable docker
systemctl start docker
usermod -aG docker $SUDO_USER

echo "Instalando Wine..."

dpkg --add-architecture i386

mkdir -pm755 /etc/apt/keyrings

wget -O /etc/apt/keyrings/winehq.key \
https://dl.winehq.org/wine-builds/winehq.key

wget -NP /etc/apt/sources.list.d/ \
https://dl.winehq.org/wine-builds/ubuntu/dists/jammy/winehq-jammy.sources

apt update
apt install -y --install-recommends winehq-stable

echo "Instalando Waydroid..."

curl https://repo.waydro.id | bash
apt install -y waydroid

echo "Activando binder para Waydroid..."

modprobe binder_linux || true

echo "Inicializando Waydroid..."

waydroid init || true

echo "Instalando Steam..."

apt install -y steam

echo "Instalando Unity Hub..."

wget -O unityhub.deb \
https://public-cdn.cloud.unity3d.com/hub/prod/UnityHub.AppImage

chmod +x unityhub.deb
mv unityhub.deb /usr/local/bin/unityhub

echo "Instalando Android Studio..."

snap install android-studio --classic

echo "Instalando Tailscale..."

curl -fsSL https://tailscale.com/install.sh | sh

echo "Instalando snap mc-installer..."

snap install mc-installer

echo "Instalando utilidades KDE..."

apt install -y \
kdeconnect \
konsole \
kate \
dolphin-plugins \
ark

echo "Instalando pear-desktop..."

PEAR_URL=$(curl -s https://api.github.com/repos/pear-devs/pear-desktop/releases/latest \
| grep browser_download_url \
| grep amd64.deb \
| cut -d '"' -f 4)

wget -O pear.deb $PEAR_URL
apt install -y ./pear.deb
rm pear.deb

echo "Instalando StormStore..."

curl -fsSL https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/install-all.sh | bash

echo "=============================="
echo " Instalación completada"
echo " Reinicia el sistema"
echo "=============================="