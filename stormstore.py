import json
import subprocess
import requests
import os

# 1. Configuración de Repositorio
GITHUB_BASE_URL = "https://raw.githubusercontent.com/TuUsuario/stormstore-repo/main"
INDICES = {
    "deb": f"{GITHUB_BASE_URL}/deb/index_deb.json",
    "snap": f"{GITHUB_BASE_URL}/snap/index_snap.json"
}

def stormstore_install(pkg_type, pkg_name):
    """Implementa stormstore install tipo nombre_aplicacion"""
    
    if pkg_type not in INDICES:
        print(f"Error: Tipo de paquete '{pkg_type}' no soportado por StormStore.")
        return

    # 2. Descargar el Índice (El equivalente a 'apt update')
    print(f"-> Actualizando índice de paquetes '{pkg_type}'...")
    try:
        response = requests.get(INDICES[pkg_type])
        response.raise_for_status() # Lanza error para códigos HTTP malos
        indice = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error al descargar el índice: {e}")
        return

    # 3. Buscar el Paquete en el Índice
    if pkg_name not in indice:
        print(f"Error: Aplicación '{pkg_name}' no encontrada en el repositorio {pkg_type}.")
        return

    paquete_info = indice[pkg_name]
    descargar_url = paquete_info['descargar_url']
    nombre_archivo = paquete_info['nombre_archivo_local']

    # 4. Descargar el Archivo (El paquete binario)
    print(f"-> Descargando {paquete_info['nombre_legible']} v{paquete_info['version']}...")
    try:
        pkg_response = requests.get(descargar_url, stream=True)
        pkg_response.raise_for_status()
        
        # Guarda el paquete temporalmente
        with open(nombre_archivo, 'wb') as f:
            for chunk in pkg_response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"   Descarga completada: {nombre_archivo}")
    except requests.exceptions.RequestException as e:
        print(f"Error al descargar el paquete: {e}")
        return

    # 5. Instalar (Ejecutar el gestor nativo)
    print("-> Iniciando instalación...")
    try:
        if pkg_type == "deb":
            # Usa subprocess.run para ejecutar comandos de sistema. Requiere sudo para dpkg!
            # dpkg -i instala un archivo .deb
            subprocess.run(['sudo', 'dpkg', '-i', nombre_archivo], check=True)
            
        elif pkg_type == "snap":
            # Si el archivo descargado es un .snap, lo instalamos con snap install
            # Nota: Snap también puede instalar desde la store, si el paquete ya está allí.
            subprocess.run(['sudo', 'snap', 'install', nombre_archivo, '--dangerous'], check=True)
            
        # Agrega más tipos aquí (ej. "flatpak", "rpm")
            
        print(f"¡{pkg_name} instalado con éxito!")

    except subprocess.CalledProcessError as e:
        print(f"Error en la instalación de {pkg_name}: {e}")

    finally:
        # 6. Limpieza (Opcional)
        os.remove(nombre_archivo)

# Ejemplo de uso:
# stormstore_install("deb", "paquete_a")

def stormstore_update():
    """Implementa stormstore update (solo actualiza índices)"""
    for pkg_type, url in INDICES.items():
        print(f"Actualizando índice para {pkg_type} desde {url}...")
        try:
            # Puedes guardar el JSON en un archivo temporal local para usarlo luego
            response = requests.get(url)
            response.raise_for_status()
            # Aquí guardarías response.content en un archivo local (ej. ~/.stormstore/index_deb.json)
            print("  -> ¡Éxito!")
        except requests.exceptions.RequestException as e:
            print(f"  -> Fallo: {e}")

# stormstore_update()