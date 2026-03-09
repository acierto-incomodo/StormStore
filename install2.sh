REPO_URL="https://acierto-incomodo.github.io/StormStore"
LIST_FILE="/etc/apt/sources.list.d/stormstore.list"

echo "deb [trusted=yes] $REPO_URL ./" | sudo tee "$LIST_FILE" > /dev/null
sudo apt update