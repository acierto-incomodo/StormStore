#!/bin/bash

set -e

# Obligatorio sudo
if [ "$EUID" -ne 0 ]; then
  echo "Este script debe ejecutarse con sudo"
  echo "Usa: sudo ./install.sh"
  exit 1
fi

echo "================================="
echo " KDE Neon Developer Setup Script "
echo "================================="

USER_HOME=$(eval echo ~${SUDO_USER})

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
neofetch

echo "Instalando Node.js LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

echo "Instalando herramientas globales de Node..."
npm install -g \
npm \
pnpm \
yarn \
npm-check-updates \
vercel \
electron \
electron-builder

echo "Instalando Bun..."
curl -fsSL https://bun.sh/install | bash
export PATH="$USER_HOME/.bun/bin:$PATH"

echo "Instalando Opera..."
wget -qO- https://deb.opera.com/archive.key | gpg --dearmor -o /usr/share/keyrings/opera.gpg

echo "deb [signed-by=/usr/share/keyrings/opera.gpg] https://deb.opera.com/opera-stable/ stable non-free" \
> /etc/apt/sources.list.d/opera.list

apt update
apt install -y opera-stable

echo "Instalando Visual Studio Code..."
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

echo "Instalando utilidades KDE..."

apt install -y \
kdeconnect \
konsole \
kate \
dolphin-plugins \
ark

echo "Instalando pear-desktop (última versión)..."

PEAR_URL=$(curl -s https://api.github.com/repos/pear-devs/pear-desktop/releases/latest \
| grep browser_download_url \
| grep amd64.deb \
| cut -d '"' -f 4)

wget -O pear.deb $PEAR_URL
apt install -y ./pear.deb
rm pear.deb

echo "Instalando StormStore..."

curl -fsSL https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/install-all.sh | bash

echo "================================="
echo "Instalación terminada"
echo "Reinicia el sistema"
echo "================================="