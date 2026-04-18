from PIL import Image
import os
import shutil
from pathlib import Path

def limpiar_y_crear_carpeta_apps_size():
    """Elimina la carpeta apps-size si existe y la crea de nuevo"""
    apps_size_path = "apps-size"
    
    # Eliminar carpeta apps-size si existe
    if os.path.exists(apps_size_path):
        print(f"Eliminando carpeta existente: {apps_size_path}")
        shutil.rmtree(apps_size_path)
    
    # Crear carpeta apps-size
    os.makedirs(apps_size_path)
    print(f"Carpeta creada: {apps_size_path}")
    
    return apps_size_path

def copiar_imagenes_origen(destino_4096):
    """Copia todas las imágenes de la carpeta apps a la carpeta 4096x4096"""
    apps_path = "apps"
    
    if not os.path.exists(apps_path):
        print(f"Error: La carpeta '{apps_path}' no existe")
        return False
    
    # Crear carpeta 4096x4096
    os.makedirs(destino_4096)
    print(f"Carpeta creada: {destino_4096}")
    
    # Copiar todas las imágenes de apps a 4096x4096
    imagenes_copiadas = 0
    for archivo in os.listdir(apps_path):
        if archivo.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp')):
            origen = os.path.join(apps_path, archivo)
            destino = os.path.join(destino_4096, archivo)
            shutil.copy2(origen, destino)
            imagenes_copiadas += 1
            print(f"Copiada: {archivo} -> 4096x4096/{archivo}")
    
    print(f"Total de imágenes copiadas: {imagenes_copiadas}")
    return imagenes_copiadas > 0

def redimensionar_imagenes(origen_path, destino_path, tamaño):
    """Redimensiona todas las imágenes de una carpeta a un tamaño específico"""
    # Crear carpeta de destino
    os.makedirs(destino_path, exist_ok=True)
    
    # Procesar cada imagen en la carpeta de origen
    imagenes_procesadas = 0
    for archivo in os.listdir(origen_path):
        if archivo.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp')):
            origen_img = os.path.join(origen_path, archivo)
            destino_img = os.path.join(destino_path, archivo)
            
            try:
                # Abrir imagen
                with Image.open(origen_img) as img:
                    # Redimensionar usando LANCZOS para mejor calidad
                    img_redimensionada = img.resize((tamaño, tamaño), Image.Resampling.LANCZOS)
                    
                    # Guardar imagen (manteniendo el formato original)
                    if archivo.lower().endswith('.png'):
                        img_redimensionada.save(destino_img, 'PNG', optimize=True)
                    else:
                        img_redimensionada.save(destino_img, quality=95)
                    
                    imagenes_procesadas += 1
                    print(f"Redimensionada: {archivo} -> {tamaño}x{tamaño}")
                    
            except Exception as e:
                print(f"Error procesando {archivo}: {e}")
    
    return imagenes_procesadas

def main():
    print("=== INICIANDO PROCESAMIENTO DE IMÁGENES ===\n")
    
    # 1. Limpiar y crear carpeta apps-size
    apps_size_path = limpiar_y_crear_carpeta_apps_size()
    
    # 2. Definir resoluciones (de mayor a menor)
    resoluciones = [4096, 2048, 1024, 512, 256]
    
    # 3. Copiar imágenes originales a 4096x4096
    print("\n--- Copiando imágenes originales ---")
    carpeta_4096 = os.path.join(apps_size_path, "4096x4096")
    if not copiar_imagenes_origen(carpeta_4096):
        print("Error: No se pudieron copiar las imágenes. Verifica que la carpeta 'apps' existe y contiene imágenes.")
        return
    
    # 4. Procesar cada resolución (de mayor a menor)
    print("\n--- Redimensionando imágenes ---")
    for i in range(len(resoluciones) - 1):
        tamaño_actual = resoluciones[i]
        tamaño_siguiente = resoluciones[i + 1]
        
        origen = os.path.join(apps_size_path, f"{tamaño_actual}x{tamaño_actual}")
        destino = os.path.join(apps_size_path, f"{tamaño_siguiente}x{tamaño_siguiente}")
        
        print(f"\nRedimensionando de {tamaño_actual}x{tamaño_actual} a {tamaño_siguiente}x{tamaño_siguiente}")
        imagenes_procesadas = redimensionar_imagenes(origen, destino, tamaño_siguiente)
        print(f"✓ {imagenes_procesadas} imágenes redimensionadas a {tamaño_siguiente}x{tamaño_siguiente}")
    
    # 5. Resumen final
    print("\n=== PROCESO COMPLETADO ===")
    print(f"Estructura creada en: {apps_size_path}/")
    for res in resoluciones:
        carpeta = os.path.join(apps_size_path, f"{res}x{res}")
        if os.path.exists(carpeta):
            num_imagenes = len([f for f in os.listdir(carpeta) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp'))])
            print(f"  📁 {res}x{res}: {num_imagenes} imágenes")
    
    print("\n✅ ¡Todas las imágenes han sido procesadas correctamente!")

if __name__ == "__main__":
    main()