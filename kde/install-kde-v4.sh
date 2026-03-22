#!/bin/bash

set -e

# exigir sudo
if [ "$EUID" -ne 0 ]; then
  echo "Ejecuta este script con:"
  echo "sudo ./install-kde.sh"
  exit 1
fi

USER_HOME=$(eval echo ~${SUDO_USER})
SCRIPT_PATH=$(realpath "$0")

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
v

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

wget -qO - https://apt.packages.shiftkey.dev/gpg.key | gpg --dearmor | tee /usr/share/keyrings/shiftkey-packages.gpg > /dev/null

sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/shiftkey-packages.gpg] https://apt.packages.shiftkey.dev/ubuntu/ any main" > /etc/apt/sources.list.d/shiftkey-packages.list'

apt update
apt install -y github-desktop

echo "Instalando Wine..."

dpkg --add-architecture i386

mkdir -pm755 /etc/apt/keyrings

wget -O /etc/apt/keyrings/winehq.key \
https://dl.winehq.org/wine-builds/winehq.key

wget -NP /etc/apt/sources.list.d/ \
https://dl.winehq.org/wine-builds/ubuntu/dists/jammy/winehq-jammy.sources

apt update
apt install -y --install-recommends winehq-stable

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

echo ""
echo "=============================="
echo " Instalación completada       "
echo "=============================="
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