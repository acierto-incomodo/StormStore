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

print_header "Removing StormStore Repository"

# StormGamesStudios APT repository file
LIST_FILE="/etc/apt/sources.list.d/stormgamesstudios.list"

# Check for admin permissions
if [ "$EUID" -ne 0 ]; then
  print_error "This script requires administrator privileges. Please run it with sudo."
  exit 1
fi

# Remove the repository if it exists
print_info "Removing StormStore APT repository..."
if [ -f "$LIST_FILE" ]; then
  rm -f "$LIST_FILE"
  print_success "Repository file removed successfully."
else
  print_info "Repository file does not exist."
fi

# Update package list
print_info "Updating package list to reflect removal..."
apt update -y

print_success "Removal complete."
