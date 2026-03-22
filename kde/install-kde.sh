#!/bin/bash

set -e

# Re-ejecutar el script con sudo si no es root
if [ "$EUID" -ne 0 ]; then
  exec sudo "$0" "$@"
fi

USER_HOME=$(eval echo ~${SUDO_USER})
SCRIPT_PATH=$(realpath "$0")

echo "=============================="
echo " KDE Neon Developer Bootstrap "
echo "=============================="

echo "Actualizando sistema..."
apt update -y
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
v

echo "Instalando Opera..."

wget -O opera.deb \
https://github.com/acierto-incomodo/StormStore/releases/download/v1.2.24/opera-stable_129.0.5823.15_amd64.deb

apt install -y ./opera.deb
rm opera.deb

echo "Instalando VS Code..."

wget -O vscode.deb "https://code.visualstudio.com/sha/download?build=stable&os=linux-deb-x64"
apt install -y ./vscode.deb
rm vscode.deb

echo "Instalando GitHub Desktop..."

sudo -u $SUDO_USER flatpak install -y flathub io.github.shiftey.Desktop

echo "Instalando Wine..."

dpkg --add-architecture i386

apt update
apt install -y --install-recommends wine

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

echo "Instalando Tesseract OCR (extracción de texto en capturas de pantalla)..."

apt install -y \
  tesseract-ocr \
  tesseract-ocr-eng \
  tesseract-ocr-spa \
  tesseract-ocr-eus

echo "  -> Idiomas instalados: inglés, español, euskera"

echo "Instalando Discord..."

wget -O discord.deb "https://discord.com/api/download?platform=linux&format=deb"
apt install -y ./discord.deb
rm discord.deb

echo "Instalando Vencord..."

sudo -u $SUDO_USER sh -c "$(curl -sS https://vencord.dev/install.sh)"

echo ""
echo "=============================="
echo " Instalación completada       "
echo "=============================="
echo ""

# Preguntar si descargar system-update
read -p "¿Descargar system-update.sh para usarlo como comando global? [s/N]: " INSTALL_SYSUPDATE

if [[ "$INSTALL_SYSUPDATE" =~ ^[sS]$ ]]; then
  echo "Descargando system-update.sh..."
  wget -O /usr/local/bin/system-update \
    https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/system-update.sh
  chmod +x /usr/local/bin/system-update
  echo "  -> Listo. Ejecuta 'system-update' en cualquier terminal."
fi

echo ""
echo "El sistema se reiniciará en 10 segundos."
echo "Presiona Ctrl+C para cancelar."
echo ""

for i in $(seq 10 -1 1); do
  echo -ne " Reiniciando en $i segundos...\r"
  sleep 1
done

echo ""
echo "Eliminando script y reiniciando..."
rm -f "$SCRIPT_PATH"
reboot