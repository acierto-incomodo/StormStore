#!/bin/bash
set -e

echo "🔹 Generating APT package index (Packages.gz)..."
dpkg-scanpackages ./debs /dev/null | gzip -9c > Packages.gz

echo "✅ Packages.gz generated successfully."

echo "📦 Committing and pushing changes to GitHub..."
git add .
git commit -m "Update repository"
git push

echo "🚀 Repository updated and published successfully!"
