#!/bin/bash

# setup-theme.sh
# Aplica modo oscuro y instala Beauty Color Global 6
# Ejecutar con: sudo ./setup-theme.sh

if [ "$EUID" -ne 0 ]; then
  echo "Ejecuta este script con:"
  echo "sudo ./setup-theme.sh"
  exit 1
fi

REAL_USER="${SUDO_USER:-$USER}"
USER_HOME=$(eval echo ~$REAL_USER)

echo "=============================="
echo " KDE Theme Setup              "
echo "=============================="

echo "Descargando Beauty Color Global 6..."

wget -O /tmp/beauty-color-global.tar.gz \
  "https://files.kde-look.org/p/2342252/files/Beauty-Color-Global-6.tar.gz"

echo "Instalando tema..."

sudo -u $REAL_USER kpackagetool6 \
  --type Plasma/LookAndFeel \
  --install /tmp/beauty-color-global.tar.gz

rm /tmp/beauty-color-global.tar.gz

THEME_ID=$(sudo -u $REAL_USER kpackagetool6 --type Plasma/LookAndFeel --list 2>/dev/null | grep -i beauty | head -1 | awk '{print $1}')

if [ -z "$THEME_ID" ]; then
  echo "⚠ No se pudo detectar el ID del tema automáticamente."
  echo "  Ábrelo manualmente desde: Sistema > Apariencia > Tema global"
  exit 1
fi

echo "Tema detectado: $THEME_ID"
echo "Aplicando tema..."

sudo -u $REAL_USER plasma-apply-lookandfeel -a "$THEME_ID"

echo "Aplicando modo oscuro..."

sudo -u $REAL_USER kwriteconfig6 \
  --file kdeglobals \
  --group General \
  --key ColorScheme "BreezeDark"

sudo -u $REAL_USER kwriteconfig6 \
  --file kdeglobals \
  --group KDE \
  --key LookAndFeelPackage "$THEME_ID"

echo "Recargando Plasma..."
sudo -u $REAL_USER DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$(id -u $REAL_USER)/bus" \
  qdbus org.kde.KWin /KWin reconfigure 2>/dev/null || true

echo ""
echo "=============================="
echo " Tema aplicado correctamente  "
echo "=============================="
echo " Si no se ve el cambio, cierra sesión y vuelve a entrar."
echo "=============================="