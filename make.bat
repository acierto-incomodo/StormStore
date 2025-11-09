@echo off
setlocal

echo "==> Generating APT package index (Packages.gz)..."
REM dpkg-scanpackages es una herramienta de Linux. Asegurate de que sea accesible desde tu entorno.
REM El equivalente de /dev/null en Windows es NUL.
dpkg-scanpackages ./debs NUL | gzip -9c > Packages.gz

echo "--> Packages.gz generated successfully."
echo.

echo "==> Committing and pushing changes to GitHub..."
git add .
git commit -m "Update repository"
git push

echo "--> Repository updated and published successfully!"
echo.
endlocal
