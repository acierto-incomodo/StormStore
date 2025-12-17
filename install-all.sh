#!/bin/bash
set -e

# --- Color and Print Functions ---
C_RESET='\033[0m'
C_RED='\033[0;31m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_CYAN='\033[0;36m'

print_header() {
    printf "\n${C_CYAN}=== %s ===${C_RESET}\n" "$1"
}

print_success() {
    printf "${C_GREEN}[✔] %s${C_RESET}\n" "$1"
}

print_info() {
    printf "${C_YELLOW}[i] %s${C_RESET}\n" "$1"
}

print_error() {
    printf "${C_RED}[✖] Error: %s${C_RESET}\n" "$1"
}

print_header "Installing StormStore Repository and Apps"

# StormGamesStudios APT repository (hosted on GitHub Pages)
REPO_URL="https://acierto-incomodo.github.io/StormStore/"
LIST_FILE="/etc/apt/sources.list.d/stormgamesstudios.list"

# Check for admin permissions
if [ "$EUID" -ne 0 ]; then
  print_error "This script requires administrator privileges. Please run it with sudo."
  exit 1
fi

# Add the repo if it doesn’t already exist
print_info "Adding StormStore APT repository..."
if [ ! -f "$LIST_FILE" ]; then
  echo "deb [trusted=yes] $REPO_URL ./" | tee "$LIST_FILE" > /dev/null
  print_success "Repository added successfully."
else
  print_info "Repository already exists."
fi

# Update package list
print_info "Updating package list..."
apt update -y

# List of all packages to install
PACKAGES=(
    "cardinal-ai-dualmodel-app"
    "whatsapp-web"
    "pairdrop"
    "data-exporter"
    "multiai"
    "theshooterlauncher"
    "kartsmultiplayerlauncher"
)

print_info "Installing all StormStore applications..."
for pkg in "${PACKAGES[@]}"; do
    print_info "  -> Installing ${pkg}..."
    apt install -y "${pkg}"
done
print_success "All applications have been installed successfully."