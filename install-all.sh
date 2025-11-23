#!/bin/bash
set -e

echo "🔹 Installing StormStore from the official StormGamesStudios repository..."

# StormGamesStudios APT repository (hosted on GitHub Pages)
REPO_URL="https://acierto-incomodo.github.io/StormStore/"

# File where the repository source will be saved
LIST_FILE="/etc/apt/sources.list.d/stormgamesstudios.list"

# Check for admin permissions
if [ "$EUID" -ne 0 ]; then
  echo "❌ This script requires administrator privileges. Run it with: sudo ./install-stormstore.sh"
  exit 1
fi

# Add the repo if it doesn’t already exist
if [ ! -f "$LIST_FILE" ]; then
  echo "deb [trusted=yes] $REPO_URL ./" | tee "$LIST_FILE" > /dev/null
  echo "✅ Repository successfully added."
else
  echo "ℹ️ Repository already exists."
fi

# Update package list
echo "📦 Updating package list..."
apt update -y

# Install Cardinal AI Dual Model App
echo "🚀 Installing Cardinal AI Dual Model App..."
apt install -y cardinal-ai-dualmodel-app

# Install WhatsApp Web
echo "🚀 Installing WhatsApp Web..."
apt install -y whatsapp-web

# Install PairDrop APP
echo "🚀 Installing PairDrop APP..."
apt install -y pairdrop

# Install MyJonCraft SGS Config Transfer
echo "🚀 Installing MyJonCraft SGS Config Transfer..."
apt install -y data-exporter

# Install MultiAI
echo "🚀 Installing MultiAI..."
apt install -y multiai 

# Install TheShooter
echo "🚀 Installing TheShooter..."
apt install -y  theshooterlauncher

echo "✅ Installation complete."