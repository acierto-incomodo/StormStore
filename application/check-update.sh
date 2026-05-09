#!/bin/bash

echo "🚀 Iniciando limpieza del proyecto..."

echo "🗑️ Eliminando node_modules..."
rm -rf node_modules

echo "🗑️ Eliminando package.json..."
rm -f package.json

echo "🔄 Actualizando dependencias con ncu..."
ncu -u

echo "📦 Instalando dependencias nuevas..."
npm install

echo "✅ Todo listo! Proyecto actualizado correctamente."