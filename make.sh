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

print_header "Building and Publishing Repository"

print_info "Cleaning up old build artifacts..."
rm -rf Packages.gz

sleep 1

print_info "Generating APT package index (Packages.gz)..."
dpkg-scanpackages ./debs /dev/null | gzip -9c > Packages.gz

print_success "Packages.gz generated successfully."

print_info "Committing and pushing changes to GitHub..."
git add .
git commit -m "Update repository"
git push

print_success "Repository updated and published successfully!"
print_info "Repository URL: https://github.com/acierto-incomodo/StormStore"