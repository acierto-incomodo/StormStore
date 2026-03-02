#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import re

"""
Este script genera automáticamente la estructura de archivos para el explorador
web de la documentación (docs/index.html).

Escanea los directorios especificados y actualiza el objeto `fileStructure`
en `docs/script.js`.

Para ejecutarlo, sitúate en la carpeta `docs` y ejecuta:
python generate_tree.py
"""

# --- CONFIGURACIÓN ---

# Directorio raíz del repositorio (un nivel arriba de /docs)
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Archivo JavaScript que se va a modificar
JS_FILE_PATH = os.path.join(os.path.dirname(__file__), 'script.js')

# Lista de directorios a escanear (relativos a la raíz del repo)
DIRS_TO_SCAN = ['application/assets', 'debs']

# Archivos y carpetas a ignorar
IGNORE_LIST = {'.DS_Store', 'Thumbs.db', '__pycache__'}

# Mapeo de extensiones a tipos de archivo para los iconos
TYPE_MAPPING = {
    # Imágenes
    '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.gif': 'image', '.svg': 'image', '.webp': 'image',
    # Vídeos
    '.mp4': 'video', '.webm': 'video', '.ogg': 'video',
    # Audio
    '.mp3': 'audio', '.wav': 'audio', '.oga': 'audio',
    # Fuentes
    '.ttf': 'font', '.otf': 'font', '.woff': 'font', '.woff2': 'font',
    # Paquetes
    '.deb': 'deb'
}

def get_file_type(filename):
    """Devuelve el tipo de archivo basado en su extensión."""
    _, ext = os.path.splitext(filename)
    return TYPE_MAPPING.get(ext.lower(), 'default')

def generate_tree(start_path):
    """Función recursiva para construir el diccionario de la estructura de archivos."""
    tree = {}
    # Usamos try-except por si una carpeta no existe
    try:
        # Ordenamos para una salida consistente
        for item_name in sorted(os.listdir(start_path)):
            if item_name in IGNORE_LIST:
                continue

            item_path = os.path.join(start_path, item_name)
            if os.path.isdir(item_path):
                tree[item_name] = {
                    "type": "folder",
                    "children": generate_tree(item_path)
                }
            else:
                tree[item_name] = {
                    "type": get_file_type(item_name)
                }
    except FileNotFoundError:
        print(f"⚠️  Advertencia: El directorio no se encontró: {start_path}")
    return tree

def main():
    """Función principal del script."""
    print("🚀  Generando estructura de archivos...")
    
    final_structure = {}
    for path_str in DIRS_TO_SCAN:
        parts = path_str.split('/')
        current_level = final_structure
        
        # Navegar o crear la ruta en el diccionario
        for i, part in enumerate(parts):
            if part not in current_level:
                current_level[part] = {"type": "folder", "children": {}}
            
            # Si es el final de la ruta, escanear el contenido
            if i == len(parts) - 1:
                scan_path = os.path.join(ROOT_DIR, path_str)
                current_level[part]['children'] = generate_tree(scan_path)
            else:
                current_level = current_level[part]["children"]

    print("✅  Estructura generada. Actualizando script.js...")

    try:
        with open(JS_FILE_PATH, 'r', encoding='utf-8') as f:
            js_content = f.read()

        # Convertir el diccionario de Python a una cadena de objeto JavaScript (JSON)
        structure_json = json.dumps(final_structure, indent=4)
        replacement_str = f"const fileStructure = {structure_json};"

        # Usar regex para reemplazar el objeto 'fileStructure' completo
        pattern = re.compile(r"const fileStructure = \{.*?\};", re.DOTALL)
        new_js_content = re.sub(pattern, replacement_str, js_content, count=1)

        with open(JS_FILE_PATH, 'w', encoding='utf-8') as f:
            f.write(new_js_content)
        print("🎉 ¡Éxito! El archivo docs/script.js ha sido actualizado.")

    except Exception as e:
        print(f"❌ Error al actualizar el archivo JavaScript: {e}")

if __name__ == "__main__":
    main()