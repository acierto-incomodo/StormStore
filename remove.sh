#!/bin/bash
set -e

echo "🔹 Removing StormStore repository..."

# StormGamesStudios APT repository file
LIST_FILE="/etc/apt/sources.list.d/stormgamesstudios.list"

# Check for admin permissions
if [ "$EUID" -ne 0 ]; then
  echo "❌ This script requires administrator privileges. Run it with: sudo ./remove-stormstore.sh"
  exit 1
fi

# Remove the repository if it exists
if [ -f "$LIST_FILE" ]; then
  rm -f "$LIST_FILE"
  echo "✅ Repository successfully removed."
else
  echo "ℹ️ Repository does not exist."
fi

# Update package list
echo "📦 Updating package list..."
apt update -y

echo "✅ Removal complete."
