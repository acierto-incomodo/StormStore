@echo off
title 🚀 Updater de Node Project

echo 🚀 Iniciando limpieza del proyecto...

echo 🗑️ Eliminando node_modules...
rmdir /s /q node_modules

echo 🗑️ Eliminando package.json...
del /f /q package.json

echo 🔄 Actualizando dependencias con ncu...
ncu -u

echo 📦 Instalando dependencias nuevas...
npm install

echo.
echo ✅ Todo listo! Proyecto actualizado correctamente.
pause