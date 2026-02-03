#!/bin/bash

# Colores para los mensajes
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
RED="\e[31m"
RESET="\e[0m"

# Comprobar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}⚠️  Por favor ejecuta este script con sudo${RESET}"
  exit 1
fi

echo -e "${BLUE}🚀 Bienvenido al instalador completo de herramientas de programación!${RESET}"
sleep 1

# Actualizar sistema
echo -e "${YELLOW}🔄 Actualizando lista de paquetes...${RESET}"
apt update -y
sleep 1

echo -e "${YELLOW}⬆️ Actualizando paquetes instalados...${RESET}"
apt upgrade -y
sleep 1

# Instalar utilidades desde apt
echo -e "${GREEN}🛠️ Instalando utilidades esenciales: curl, wget y winetricks...${RESET}"
apt install curl wget winetricks -y
sleep 1

# Instalar Node.js y npm
echo -e "${GREEN}📦 Instalando Node.js y npm...${RESET}"
apt install nodejs npm -y
sleep 1

# Instalar Yarn y PNPM
echo -e "${GREEN}✨ Instalando Yarn y PNPM...${RESET}"
npm install -g yarn pnpm
sleep 1

# Instalar paquetes npm globales útiles
echo -e "${GREEN}🛠️ Instalando paquetes npm globales útiles...${RESET}"
npm install -g \
  npm-check-updates \
  typescript \
  eslint \
  prettier \
  ts-node \
  nodemon \
  http-server \
  serve \
  create-react-app \
  @vue/cli \
  create-next-app \
  eslint-config-prettier

sleep 1

# Mensaje final
echo -e "${BLUE}🎉 ¡Instalación completa!${RESET}"
echo -e "${GREEN}✔️ Node.js, npm, Yarn, PNPM, paquetes npm globales y utilidades esenciales están listas para usar.${RESET}"
