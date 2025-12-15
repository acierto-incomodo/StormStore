#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import argparse
import json
import subprocess
import requests
import os
import sys

# --- CONFIGURACIÓN DEL REPOSITORIO ---
# ⚠️ Importante: Asegúrate de que esta URL base apunte a tu rama principal (main)
GITHUB_USER = "acierto-incomodo"
REPO_NAME = "StormStore"
GITHUB_BASE_URL = f"https://raw.githubusercontent.com/{GITHUB_USER}/{REPO_NAME}/main"

# Mapeo de tipos de paquetes a sus nombres de carpeta en GitHub y gestores de sistema
PACKAGE_TYPES = {
    "deb": {
        "folder": "debs",  # Tu carpeta específica en GitHub
        "index_file": "index_deb.json",
        "install_cmd": ["sudo", "dpkg", "-i"], # Comando de bajo nivel para instalar el archivo
        "description": "Paquetes Debian (.deb)"
    },
    "snap": {
        "folder": "snaps", # Un ejemplo de carpeta, ajústala si es necesario
        "index_file": "index_snap.json",
        "install_cmd": ["sudo", "snap", "install", "--dangerous"], # Se usa --dangerous para instalar desde un archivo local
        "description": "Paquetes Snap (.snap)"
    }
    # Puedes añadir más tipos aquí (ej: "rpm", "flatpak")
}

# Almacena el índice descargado para usarlo en múltiples comandos
INDEX_CACHE = {} 
# --------------------------------------

def fetch_index(pkg_type):
    """Descarga el manifiesto/índice para un tipo de paquete dado."""
    if pkg_type in INDEX_CACHE:
        return INDEX_CACHE[pkg_type]
        
    config = PACKAGE_TYPES[pkg_type]
    index_url = f"{GITHUB_BASE_URL}/{config['folder']}/{config['index_file']}"
    
    print(f"-> Descargando índice de {pkg_type} desde {index_url}...")
    try:
        response = requests.get(index_url)
        response.raise_for_status() # Lanza error para códigos HTTP malos (ej. 404)
        indice = response.json()
        INDEX_CACHE[pkg_type] = indice
        return indice
    except requests.exceptions.RequestException as e:
        print(f"Error al descargar el índice de {pkg_type}: {e}", file=sys.stderr)
        return None

def stormstore_update():
    """Implementa stormstore update - Descarga y almacena en caché todos los índices."""
    print("--- StormStore Update ---")
    success_count = 0
    for pkg_type, info in PACKAGE_TYPES.items():
        if fetch_index(pkg_type) is not None:
            print(f"  ✅ Índice de {pkg_type} actualizado con éxito.")
            success_count += 1
        else:
            print(f"  ❌ Falló la actualización del índice de {pkg_type}.")
    
    if success_count == 0:
        print("No se pudo actualizar ningún índice.")
        return False
    return True

def stormstore_install(pkg_type, pkg_name):
    """Implementa stormstore install tipo nombre_aplicacion."""
    print(f"\n--- Instalando {pkg_name} ({pkg_type}) ---")
    
    # 1. Obtener Índice
    indice = fetch_index(pkg_type)
    if indice is None:
        return
        
    # 2. Buscar Paquete
    if pkg_name not in indice:
        print(f"Error: Aplicación '{pkg_name}' no encontrada en el repositorio {pkg_type}.", file=sys.stderr)
        return

    paquete_info = indice[pkg_name]
    descargar_url = paquete_info['descargar_url']
    nombre_archivo = paquete_info['nombre_archivo_local']
    install_cmd_base = PACKAGE_TYPES[pkg_type]['install_cmd']
    
    # Directorio temporal para la descarga
    temp_dir = "/tmp" 
    temp_filepath = os.path.join(temp_dir, nombre_archivo)

    # 3. Descargar Archivo
    print(f"-> Descargando {paquete_info['nombre_legible']} v{paquete_info['version']}...")
    try:
        with requests.get(descargar_url, stream=True) as r:
            r.raise_for_status()
            with open(temp_filepath, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        print(f"   Descarga completada en {temp_filepath}")
    except requests.exceptions.RequestException as e:
        print(f"Error al descargar el paquete: {e}", file=sys.stderr)
        return

    # 4. Instalar (Ejecutar el gestor nativo)
    print("-> Iniciando instalación con gestor de sistema...")
    full_command = install_cmd_base + [temp_filepath]
    print(f"   Ejecutando: {' '.join(full_command)}")
    
    try:
        # Pide la contraseña de sudo si es necesario
        subprocess.run(full_command, check=True, text=True) 
        print(f"\n¡{pkg_name} instalado con éxito!")

    except subprocess.CalledProcessError as e:
        print(f"\nError en la instalación de {pkg_name}: El comando falló.", file=sys.stderr)
        print(f"Código de retorno: {e.returncode}", file=sys.stderr)
        print(f"Salida de error: \n{e.stderr}", file=sys.stderr)

    except FileNotFoundError:
        print(f"Error: El ejecutable para {pkg_type} no se encontró en el PATH. ¿Está instalado?", file=sys.stderr)

    finally:
        # 5. Limpieza
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)
            print(f"-> Archivo temporal {nombre_archivo} eliminado.")

def stormstore_upgrade(pkg_name=None):
    """Implementa stormstore upgrade [nombre_aplicacion] o stormstore full-upgrade."""
    # Nota: La implementación completa de upgrade es compleja (requiere conocer la versión local)
    # Aquí simularemos la actualización y nos enfocaremos en la ejecución del comando.
    
    if pkg_name is None:
        print("\n--- StormStore Full Upgrade (Actualización Completa) ---")
        # En una implementación real, iterarías sobre todos los paquetes instalados,
        # verificarías sus versiones en los índices y llamarías a:
        # stormstore_install(tipo, paquete)
        print("Simulando proceso de Full Upgrade: Buscando versiones nuevas en todos los índices...")
        
        if not stormstore_update():
            return
            
        print("Full upgrade completado (Simulación: No se realizó ninguna instalación real).")
        
    else:
        print(f"\n--- StormStore Upgrade {pkg_name} ---")
        # En un sistema unificado como el tuyo, para actualizar un paquete ya instalado 
        # sin saber su tipo, necesitarías una base de datos local que almacene:
        # "nombre_paquete" -> "tipo_instalado" (deb/snap)
        
        # Como no tenemos esa base de datos local aún, el usuario debe indicar el tipo:
        print(f"Para actualizar un paquete individual, use: `stormstore install TIPO {pkg_name}` con la nueva versión en el índice.")
        print("O implementa la búsqueda local del tipo de paquete.")


def stormstore_uninstall(pkg_type, pkg_name):
    """Implementa stormstore uninstall tipo nombre_aplicacion."""
    print(f"\n--- Desinstalando {pkg_name} ({pkg_type}) ---")

    if pkg_type not in PACKAGE_TYPES:
        print(f"Error: Tipo de paquete '{pkg_type}' no soportado.", file=sys.stderr)
        return

    # El nombre que pasas a los gestores de sistema debe ser el nombre registrado, 
    # no el nombre del archivo. Usaremos el nombre que el usuario tecleó como identificador.
    
    uninstall_cmd = []
    
    if pkg_type == "deb":
        uninstall_cmd = ["sudo", "apt", "purge", "-y", pkg_name]
    elif pkg_type == "snap":
        uninstall_cmd = ["sudo", "snap", "remove", pkg_name]
    
    if not uninstall_cmd:
        print(f"Error: Comando de desinstalación no definido para {pkg_type}.", file=sys.stderr)
        return

    print(f"   Ejecutando: {' '.join(uninstall_cmd)}")

    try:
        subprocess.run(uninstall_cmd, check=True, text=True) 
        print(f"\n¡{pkg_name} desinstalado con éxito!")

    except subprocess.CalledProcessError as e:
        print(f"\nError en la desinstalación: El comando falló.", file=sys.stderr)
        print(f"Código de retorno: {e.returncode}", file=sys.stderr)
        # Nota: La salida de error puede estar en e.stdout o e.stderr dependiendo del gestor
        
    except FileNotFoundError:
        print(f"Error: El gestor de paquetes para {pkg_type} no se encontró en el PATH.", file=sys.stderr)


def main():
    """Configura y maneja los argumentos de línea de comandos."""
    parser = argparse.ArgumentParser(
        description="StormStore - El gestor de paquetes unificado y personalizado.",
        epilog="¡Asegúrate de ejecutar 'stormstore update' regularmente!"
    )
    
    # Subcomandos principales (install, update, upgrade, uninstall)
    subparsers = parser.add_subparsers(dest="comando", required=True)

    # 1. Subcomando 'install'
    parser_install = subparsers.add_parser('install', help='Instala un paquete específico.')
    choices_types = list(PACKAGE_TYPES.keys())
    parser_install.add_argument('tipo', 
        choices=choices_types, 
        help=f"Tipo de paquete a instalar. Opciones: {', '.join(choices_types)}."
    )
    parser_install.add_argument('nombre_aplicacion', help='Nombre clave del paquete.')
    
    # 2. Subcomando 'update'
    subparsers.add_parser('update', help='Actualiza los índices de todos los repositorios (metadata).')

    # 3. Subcomando 'upgrade' / 'full-upgrade'
    parser_upgrade = subparsers.add_parser('upgrade', help='Actualiza un paquete o realiza una actualización completa (full-upgrade).')
    # Usamos nargs='?' para que el argumento sea opcional. Si no se da, es 'full-upgrade'.
    parser_upgrade.add_argument('nombre_aplicacion', nargs='?', help='Nombre del paquete a actualizar (opcional, si se omite, hace full-upgrade).')
    
    # Para tener 'full-upgrade' como un alias o comando explícito:
    subparsers.add_parser('full-upgrade', help='Realiza una actualización completa del sistema StormStore.')

    # 4. Subcomando 'uninstall'
    parser_uninstall = subparsers.add_parser('uninstall', help='Desinstala un paquete.')
    parser_uninstall.add_argument('tipo', 
        choices=choices_types, 
        help=f"Tipo de paquete a desinstalar. Opciones: {', '.join(choices_types)}."
    )
    parser_uninstall.add_argument('nombre_aplicacion', help='Nombre del paquete a desinstalar.')
    
    
    args = parser.parse_args()

    # --- Despacho de Comandos ---
    try:
        if args.comando == 'install':
            stormstore_install(args.tipo, args.nombre_aplicacion)
            
        elif args.comando == 'update':
            stormstore_update()
            
        elif args.comando in ('upgrade', 'full-upgrade'):
            # El upgrade individual solo funciona si se pasa el nombre.
            # Si el comando es 'full-upgrade' o si es 'upgrade' sin nombre, actualiza todo.
            pkg_name = args.nombre_aplicacion if args.comando == 'upgrade' else None
            stormstore_upgrade(pkg_name)
            
        elif args.comando == 'uninstall':
            stormstore_uninstall(args.tipo, args.nombre_aplicacion)
            
    except Exception as e:
        print(f"\nUn error inesperado ocurrió: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()