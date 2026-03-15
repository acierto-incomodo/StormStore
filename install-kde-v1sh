#!/bin/bash

set -e

echo "======================================"
echo "  Script de instalación inicial"
echo "  KDE Neon - entorno de desarrollo"
echo "======================================"

# Actualizar sistema
echo "Actualizando sistema..."
sudo apt update
sudo apt full-upgrade -y

# Herramientas básicas
echo "Instalando herramientas básicas..."
sudo apt install -y \
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

# Instalar Node.js LTS
echo "Instalando Node.js LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Gestores de paquetes Node
echo "Instalando gestores de paquetes Node..."
sudo npm install -g \
npm \
pnpm \
yarn \
npm-check-updates \
vercel \
electron \
electron-builder

# Instalar Opera
echo "Instalando navegador Opera..."
wget -qO- https://deb.opera.com/archive.key | sudo gpg --dearmor -o /usr/share/keyrings/opera.gpg

echo "deb [signed-by=/usr/share/keyrings/opera.gpg] https://deb.opera.com/opera-stable/ stable non-free" | \
sudo tee /etc/apt/sources.list.d/opera.list

sudo apt update
sudo apt install -y opera-stable

# Instalar VS Code
echo "Instalando Visual Studio Code..."
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -D -o root -g root -m 644 packages.microsoft.gpg /usr/share/keyrings/packages.microsoft.gpg

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | \
sudo tee /etc/apt/sources.list.d/vscode.list

sudo apt update
sudo apt install -y code

rm packages.microsoft.gpg

# Instalar herramientas KDE útiles
echo "Instalando herramientas KDE..."
sudo apt install -y \
kdeconnect \
konsole \
kate \
dolphin-plugins \
ark

# Git configuración básica
echo "Configuración básica de Git..."
git config --global init.defaultBranch main

# StormStore
echo "Instalando StormStore..."
curl -fsSL https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/install-all.sh | sudo bash

echo "======================================"
echo " Instalación completada"
echo "======================================"
echo "Reinicia el sistema si es necesario."