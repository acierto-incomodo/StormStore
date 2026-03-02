# StormStore (https://acierto-incomodo.github.io/StormStore/)

![StormStore Photo](https://github.com/acierto-incomodo/StormStore/blob/main/stormstore.png)

**StormStore** es la plataforma de distribución de software y juegos de **StormGamesStudios**. Este repositorio contiene los scripts de instalación para sistemas Linux y la información del catálogo de aplicaciones.

## 📥 Instalación (Linux)

### Instalar Repositorio
Para añadir el repositorio a tu sistema:

```bash
curl -fsSL https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/install.sh | sudo bash
```

### Instalar Repositorio y Todo el Software
Para instalar el repositorio y descargar automáticamente todos los paquetes disponibles:

```bash
curl -fsSL https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/install-all.sh | sudo bash
```

## 🛠️ Menú de Gestión
El proyecto incluye un script de menú (`menu.sh`) para facilitar tareas administrativas como:
- Actualizar el sistema (Modo Debian o Full Upgrade).
- Instalar servidores y herramientas (MCSManager, PairDrop Server, Playit).
- Gestionar la instalación de StormStore.

## 📦 Paquetes del Repositorio

Una vez instalado el repositorio, puedes instalar las siguientes aplicaciones mediante `apt`:

| Aplicación | Comando de Instalación | Descripción |
| :--- | :--- | :--- |
| **CardinalAI MultiModel** | `sudo apt install cardinal-ai-dualmodel-app` | Aplicación de IA multimodal. |
| **WhatsApp Web** | `sudo apt install whatsapp-web` | Cliente de escritorio para WhatsApp Web. |
| **PairDrop** | `sudo apt install pairdrop` | Transferencia de archivos local P2P. |
| **MyJonCraft Config** | `sudo apt install data-exporter` | Herramienta de transferencia de configuración SGS. |
| **MultiAI** | `sudo apt install multiai` | Interfaz para múltiples modelos de IA. |
| **The Shooter** | `sudo apt install theshooterlauncher` | Launcher del juego FPS multijugador. |
| **Karts Multiplayer** | `sudo apt install kartsmultiplayerlauncher` | Launcher del juego de carreras. |

## 🎮 Catálogo de Juegos y Apps (Windows)

Esta sección contiene software **exclusivo para Windows**. Para acceder a este catálogo, descarga e instala el cliente de escritorio:

📥 **Descargar StormStore-Setup.exe**

### Juegos
*   **Ambidextro**: Acción táctica con control de armas duales.
*   **Backseat Drivers**: Carreras competitivas con uso de objetos.
*   **Buckshot Roulette**: Estrategia y terror en una mesa de juego mortal.
*   **Content Warning**: Terror cooperativo enfocado en grabar videos virales.
*   **DOOM Classic**: El legendario FPS.
*   **Five Nights at Freddy's (1, 2, 3, 4)**: La saga completa de terror animatrónico.
*   **Hollow Knight: Silksong**: Aventura de acción y plataformas (Metroidvania).
*   **Lethal Company**: Terror cooperativo de recolección en lunas abandonadas.
*   **Mage Arena**: Combate PvP de magos.
*   **R.E.P.O.**: Juego cooperativo de extracción y terror.
*   **Scam Line**: Juego multijugador de engaño social.
*   **The Shooter**: Deathmatch FPS en almacenes.
*   **Karts Multiplayer**: Carreras de karts con amigos.

### Utilidades
*   **StormLauncher (HMCL Edition)**: Launcher avanzado para Minecraft.
*   **StormLibraryV2**: Gestor de biblioteca de juegos de StormGamesStudios.
*   **MultiAI**: Herramienta de productividad con IA.
*   **PairDrop**: Compartición de archivos sencilla.

## ��️ Desinstalación

### Eliminar Repositorio
Elimina solo la configuración del repositorio del sistema:

```bash
curl -fsSL https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/remove.sh | sudo bash
```

### Eliminar Todo
Elimina el repositorio y todos los paquetes instalados:

```bash
curl -fsSL https://raw.githubusercontent.com/acierto-incomodo/StormStore/main/remove-all.sh | sudo bash
```

<br>

Copyright © StormGamesStudios 2025
