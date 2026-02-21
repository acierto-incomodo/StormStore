#!/bin/bash

set -e

echo "🔄 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

echo "📦 Dependencias básicas..."
sudo apt install -y \
git curl wget build-essential cmake gcc g++ \
python3 python3-pip \
openjdk-21-jdk \
unzip p7zip-full \
net-tools htop neofetch \
openssh-client \
btop \
flatpak

echo "🟢 Node.js LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

echo "🧩 LibreOffice completo..."
sudo apt install -y libreoffice libreoffice-kf5 libreoffice-l10n-es libreoffice-help-es

echo "🔌 Arduino IDE..."
sudo apt install -y arduino

echo "🤖 Android Studio..."
sudo snap install android-studio --classic

echo "🎮 Steam..."
sudo apt install -y steam

echo "🎬 Apps útiles..."
sudo apt install -y vlc gimp obs-studio

echo "💬 Discord..."
sudo snap install discord

echo "📦 Configurando Flatpak..."
sudo flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

echo "📱 ZapZap (WhatsApp Linux)..."
flatpak install -y flathub com.rtosta.zapzap

echo "🎮 CurseForge..."
flatpak install -y flathub com.curseforge.CurseForge

echo "🌐 Opera..."
wget -qO opera.deb https://download.opera.com/download/get/?id=47478&location=415&nothanks=yes&sub=marine
sudo apt install -y ./opera.deb
rm opera.deb

echo "🌐 Waterfox..."
wget -qO waterfox.tar.bz2 https://cdn1.waterfox.net/waterfox/releases/latest/linux
tar -xjf waterfox.tar.bz2
sudo mv waterfox /opt/waterfox
sudo ln -s /opt/waterfox/waterfox /usr/local/bin/waterfox
rm waterfox.tar.bz2

echo "🐙 GitHub Desktop..."
wget -qO github-desktop.deb https://github.com/shiftkey/desktop/releases/latest/download/GitHubDesktop-linux-amd64.deb
sudo apt install -y ./github-desktop.deb
rm github-desktop.deb

echo "🔐 Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh

echo "🍐 Pear Desktop..."
PEAR_URL=$(curl -s https://api.github.com/repos/pear-devs/pear-desktop/releases/latest | grep browser_download_url | grep .deb | cut -d '"' -f 4)
wget -O pear-desktop.deb $PEAR_URL
sudo apt install -y ./pear-desktop.deb
rm pear-desktop.deb

echo "🎮 Minecraft Installer..."
sudo snap install mc-installer

echo "⬇️ YouTube Downloader Plus..."
sudo snap install ytdownloader

echo "🧰 Snapcraft tools..."
sudo snap install snapcraft --classic

echo "🛍 StormStore..."
curl -fsSL https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/install-all.sh | sudo bash

echo "✅ Instalación completada."
echo "👉 Reinicia el sistema."
