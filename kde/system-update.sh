#!/usr/bin/env bash

# Re-ejecutar el script con sudo si no es root
if [ "$EUID" -ne 0 ]; then
  exec sudo "$0" "$@"
fi

echo "🧹 Limpiando caché de APT..."
apt clean

echo "🔄 Actualizando lista de paquetes..."
apt update

echo "⬆️ Actualizando el sistema (full-upgrade)..."
apt full-upgrade -y

echo "🗑️ Eliminando paquetes innecesarios..."
apt autoremove -y

echo "✅ Todo listo"
