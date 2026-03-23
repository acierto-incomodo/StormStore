#!/bin/bash

echo "==> Instalando Tesseract OCR..."
sudo apt install -y tesseract-ocr tesseract-ocr-eng tesseract-ocr-spa libtesseract5

echo "==> Creando symlink para Spectacle..."
if [ ! -f /usr/lib/x86_64-linux-gnu/libtesseract.so ]; then
    sudo ln -s /usr/lib/x86_64-linux-gnu/libtesseract.so.5 /usr/lib/x86_64-linux-gnu/libtesseract.so
    echo "    Symlink creado."
else
    echo "    Symlink ya existe, omitiendo."
fi

echo "==> Listo. Abre Spectacle y el OCR debería funcionar."
