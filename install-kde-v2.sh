#!/bin/bash

set -e

# Comprobar si se ejecuta con sudo
if [ "$EUID" -ne 0 ]; then
  echo "Este script debe ejecutarse con sudo."
  echo "Usa: sudo ./install.sh"
  exit 1
fi

echo "======================================"
echo "  Script de instalación inicial"
echo "  KDE Neon - entorno de desarrollo"
echo "======================================"

# Actualizar sistema
echo "Actualizando sistema..."
apt update
apt full-upgrade -y

# Herramientas básicas
echo "Instalando herramientas básicas..."
apt install -y \
git \
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

# Node.js LTS
echo "Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Gestores de paquetes Node globales
echo "Instalando herramientas Node..."
npm install -g \
npm \
pnpm \
yarn \
npm-check-updates \
vercel \
electron \
electron-builder

# Instalar Opera
echo "Instalando Opera..."
wget -qO- https://deb.opera.com/archive.key | gpg --dearmor -o /usr/share/keyrings/opera.gpg

echo "deb [signed-by=/usr/share/keyrings/opera.gpg] https://deb.opera.com/opera-stable/ stable non-free" \
> /etc/apt/sources.list.d/opera.list

apt update
apt install -y opera-stable

# Instalar VS Code
echo "Instalando VS Code..."
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > /usr/share/keyrings/vscode.gpg

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/vscode.gpg] https://packages.microsoft.com/repos/code stable main" \
> /etc/apt/sources.list.d/vscode.list

apt update
apt install -y code

# Herramientas KDE
echo "Instalando utilidades KDE..."
apt install -y \
kdeconnect \
konsole \
kate \
dolphin-plugins \
ark

# Configuración básica Git
echo "Configurando Git..."
git config --global init.defaultBranch main

# StormStore
echo "Instalando StormStore..."
curl -fsSL https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/install-all.sh | bash

echo "======================================"
echo "Instalación completada"
echo "======================================"