const { app, BrowserWindow, ipcMain, shell, session, nativeTheme } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const { spawn, exec } = require("child_process");
const { autoUpdater } = require("electron-updater");
const SteamPath = require("steam-path");
const gameScanner = require("@equal-games/game-scanner");

const apps = require("./apps.json");

// Variables globales
let mainWindow;
let updateInfo = null;

// ❌ StormStore SOLO WINDOWS
if (process.platform !== "win32") {
  app.quit();
}

// =====================================
// CONFIGURACIÓN DE ACTUALIZACIONES
// =====================================
autoUpdater.autoDownload = false;
autoUpdater.allowDowngrade = true;
autoUpdater.checkForUpdates();

autoUpdater.on("update-available", (info) => {
  updateInfo = info;
  if (mainWindow) {
    // Forzar la redirección a la página de actualizaciones
    mainWindow.loadFile(path.join(__dirname, "renderer/updates.html"));
    // Una vez que la página se carga, le enviamos la información de la actualización
    // para que la muestre.
    mainWindow.webContents.once("did-finish-load", () => {
      mainWindow.webContents.send("update-available", info);
    });
  }
});

autoUpdater.on("update-not-available", () => {
  if (mainWindow) {
    mainWindow.webContents.send("update-not-available");
  }
});

autoUpdater.on("download-progress", (progressObj) => {
  if (mainWindow) {
    mainWindow.webContents.send("download-progress", progressObj);
  }
});

autoUpdater.on("update-downloaded", () => {
  // Ya no se instala automáticamente. Solo notifica a la página de actualizaciones.
  if (mainWindow) {
    mainWindow.webContents.send("update-downloaded");
  }
});

autoUpdater.on("error", (err) => {
  console.error("Error en autoUpdater:", err);
  if (mainWindow) {
    mainWindow.webContents.send("update-error", err.message);
  }
});

// =====================================
// FIN CONFIGURACIÓN ACTUALIZACIONES
// =====================================

// -----------------------------
// Ventana principal
// -----------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1226,
    height: 750,
    minWidth: 1226,
    minHeight: 750,
    backgroundColor: "#00000000",
    frame: false,
    backgroundMaterial: "mica",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets/app.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  mainWindow = win;

  const startInBigPicture = process.argv.includes('--bigpicture');
  win.loadFile(path.join(__dirname, startInBigPicture ? "renderer/bigpicture.html" : "renderer/index.html"));

  win.maximize();

  win.on("maximize", () => {
    win.webContents.send("window-maximized");
  });

  win.on("unmaximize", () => {
    win.webContents.send("window-restored");
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

// -----------------------------
// Utilidades
// -----------------------------
function resolveWindowsPath(p) {
  return path.normalize(p.replace(/%appdata%/gi, app.getPath("appData")));
}

function getDownloadDir() {
  const dir = path.join(
    app.getPath("appData"),
    "StormGamesStudios",
    "StormStore",
    "downloads",
  );

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

// -----------------------------
// IPC
// -----------------------------
ipcMain.handle("get-apps", () => {
  return apps.map((appItem) => {
    const installed = appItem.paths.some((p) => {
      const resolved = resolveWindowsPath(p);
      return fs.existsSync(resolved);
    });

    return {
      ...appItem,
      installed,
    };
  });
});

ipcMain.handle("get-steam-games", async () => {
  try {
    let steamPath = null;
    
    // 1. Intentar con librería steam-path
    try {
      steamPath = await SteamPath.getSteamPath();
    } catch (e) {
      console.log("steam-path failed, trying registry...");
    }

    // 2. Intentar registro de Windows (HKCU)
    if (!steamPath) {
      try {
        const { stdout } = await new Promise((resolve, reject) => {
          exec('reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath', (err, stdout) => {
            if (err) reject(err);
            else resolve({ stdout });
          });
        });
        
        // Parsear salida: ... SteamPath    REG_SZ    C:/Program Files (x86)/Steam
        const match = stdout.match(/SteamPath\s+REG_SZ\s+(.+)/i);
        if (match && match[1]) {
          steamPath = match[1].trim();
        }
      } catch (e) {
        console.log("Registry query failed:", e);
      }
    }

    // 3. Fallback manual
    if (!steamPath) {
      const possible = [
        "C:\\Program Files (x86)\\Steam",
        "C:\\Program Files\\Steam",
        "D:\\Steam",
        "E:\\Steam"
      ];
      for (const p of possible) {
        if (fs.existsSync(p)) {
          steamPath = p;
          break;
        }
      }
    }

    if (!steamPath) {
      console.log("Steam path not found");
      return [];
    }

    // Normalizar path (Steam en registro usa /)
    steamPath = path.normalize(steamPath);
    console.log("Steam Path detected:", steamPath);

    // Usar Set para evitar duplicados
    const libraries = new Set();
    // Añadir librería por defecto
    if (fs.existsSync(path.join(steamPath, "steamapps"))) {
        libraries.add(path.join(steamPath, "steamapps"));
    }

    const vdfPath = path.join(steamPath, "steamapps", "libraryfolders.vdf");
    
    if (fs.existsSync(vdfPath)) {
      try {
        const vdfContent = fs.readFileSync(vdfPath, "utf8");
        // Regex para capturar el valor de "path"
        const pathRegex = /"path"\s+"([^"]+)"/g;
        let match;
        while ((match = pathRegex.exec(vdfContent)) !== null) {
          let libPath = match[1];
          // Corregir escapes de backslash dobles a simples
          libPath = libPath.replace(/\\\\/g, "\\"); 
          // Normalizar
          libPath = path.normalize(libPath);
          
          const steamAppsPath = path.join(libPath, "steamapps");
          if (fs.existsSync(steamAppsPath)) {
             libraries.add(steamAppsPath);
          }
        }
      } catch (e) {
        console.error("Error reading libraryfolders.vdf:", e);
      }
    }

    const games = [];
    const seenAppIds = new Set();

    for (const lib of libraries) {
      console.log("Scanning library:", lib);
      if (!fs.existsSync(lib)) continue;
      
      try {
      const files = fs.readdirSync(lib);
      for (const file of files) {
        if (file.startsWith("appmanifest_") && file.endsWith(".acf")) {
          try {
            const content = fs.readFileSync(path.join(lib, file), "utf8");
            const nameMatch = content.match(/"name"\s+"([^"]+)"/);
            const appIdMatch = content.match(/"appid"\s+"(\d+)"/);
            const installDirMatch = content.match(/"installdir"\s+"([^"]+)"/);
            
            if (nameMatch && appIdMatch) {
              const name = nameMatch[1];
              const appId = appIdMatch[1];
              const installDir = installDirMatch ? installDirMatch[1] : null;
              
              // Filtrar "Steamworks Common Redistributables" (228980)
              if (appId === "228980") continue;

              if (!seenAppIds.has(appId)) {
                seenAppIds.add(appId);
                games.push({
                  id: `steam-${appId}`,
                  name: name,
                  description: "Juego de Steam",
                  category: "Steam",
                  icon: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
                  paths: [`steam://rungameid/${appId}`],
                  installPath: installDir ? path.join(lib, "common", installDir) : null,
                  installed: true,
                  steam: "si",
                  wifi: "no"
                });
              }
            }
          } catch (e) { console.error(e); }
        }
      }
      } catch (e) {
        console.error("Error reading library directory:", lib, e);
      }
    }
    
    console.log(`Found ${games.length} Steam games`);
    return games;
  } catch (error) {
    console.error("Error getting steam games:", error);
    return [];
  }
});

ipcMain.handle("get-epic-games", async () => {
  try {
    const games = gameScanner.epic ? gameScanner.epic.games() : [];

    return games.map((game) => ({
      id: `epic-${game.id}`,
      name: game.name,
      description: "Juego de Epic Games",
      category: "Epic Games",
      icon: "../assets/icons/epic-games.svg",
      paths: [`com.epicgames.launcher://apps/${game.id}?action=launch&silent=true`],
      installPath: game.path,
      installed: true,
      epic: "si",
      wifi: "no",
    }));
  } catch (error) {
    console.error("Error getting epic games:", error);
    return [];
  }
});

ipcMain.handle("install-app", async (_, appData) => {
  // ---------------------------------------------------------
  // 1. Pre-instalación (Ej: Runtimes .NET, VC++, etc.)
  // ---------------------------------------------------------
  if (appData.preInstall && Array.isArray(appData.preInstall)) {
    for (const item of appData.preInstall) {
      // Resolvemos la ruta relativa (asumiendo base en renderer como los iconos: ../assets/...)
      const prePath = path.join(__dirname, "renderer", item.path);

      if (fs.existsSync(prePath)) {
        await new Promise((resolvePre, rejectPre) => {
          exec(`"${prePath}" ${item.args || ""}`, (err) => {
            if (err) rejectPre(new Error(`Error en pre-instalación (${item.path}): ${err.message}`));
            else resolvePre();
          });
        });
      }
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const downloadDir = getDownloadDir();
      const filePath = path.join(downloadDir, `${appData.id}.exe`);

      function download(url) {
        const file = fs.createWriteStream(filePath);

        https
          .get(url, (res) => {
            // 🔁 Redirecciones (GitHub)
            if (res.statusCode === 302 || res.statusCode === 301) {
              file.close();
              fs.unlinkSync(filePath);
              return download(res.headers.location);
            }

            if (res.statusCode !== 200) {
              file.close();
              fs.unlinkSync(filePath);
              return reject(new Error("Error descargando el archivo"));
            }

            res.pipe(file);

            file.on("finish", () => {
              file.close(() => {
                // ▶ Ejecutar instalador
                exec(`"${filePath}"`, (err) => {
                  if (err) {
                    console.error("Error ejecutando instalador:", err);
                    return reject(err);
                  }

                  // 🧹 Borrar instalador después de 10s
                  setTimeout(() => {
                    if (fs.existsSync(filePath)) {
                      fs.unlinkSync(filePath);
                    }
                  }, 10000);

                  resolve(true);
                });
              });
            });
          })
          .on("error", (err) => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            reject(err);
          });
      }

      download(appData.download);
    } catch (err) {
      reject(err);
    }
  });
});

ipcMain.handle("open-app", async (_, exePath, requiresSteam) => {
  try {
    if (exePath.startsWith("steam://") || exePath.startsWith("com.epicgames.launcher://")) {
      exec(`start "" "${exePath}"`);
      return true;
    }

    if (requiresSteam) {
      exec("start steam://");
    }

    const resolvedExe = resolveWindowsPath(exePath);

    if (!fs.existsSync(resolvedExe)) {
      throw new Error("El ejecutable no existe");
    }

    const appDir = path.dirname(resolvedExe);

    spawn(`"${resolvedExe}"`, {
      cwd: appDir,
      detached: true,
      shell: true, // 🔥 CLAVE EN WINDOWS
      stdio: "ignore",
    }).unref();

    app.quit();
    return true;
  } catch (err) {
    console.error("Error al abrir app:", err.message);
    return false;
  }
});

ipcMain.handle("open-app-location", async (_, exePath) => {
  if (!exePath) return;
  const resolved = resolveWindowsPath(exePath);
  if (fs.existsSync(resolved)) {
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      shell.openPath(resolved);
    } else {
      shell.showItemInFolder(resolved);
    }
  }
});

ipcMain.handle("uninstall-app", async (_, uninstallPath) => {
  try {
    const resolved = resolveWindowsPath(uninstallPath);

    if (!fs.existsSync(resolved)) {
      throw new Error("Desinstalador no encontrado");
    }

    exec(`"${resolved}"`);
    return true;
  } catch (err) {
    console.error("Error al desinstalar:", err.message);
    return false;
  }
});

ipcMain.handle("check-trailer-exists", (_, id) => {
  const trailerPath = path.join(__dirname, "assets", "trailers", `${id}.mp4`);
  return fs.existsSync(trailerPath);
});

ipcMain.handle("open-big-picture", () => {
  // Si hay una actualización pendiente, no permitir entrar a Big Picture.
  if (updateInfo) {
    console.log("Actualización pendiente. El modo Big Picture está deshabilitado.");
    // Opcional: traer la ventana al frente si está minimizada.
    if (mainWindow && mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow?.focus();
    return;
  }

  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, "renderer/bigpicture.html"));
  }
});

ipcMain.handle("open-main-view", () => {
  if (mainWindow) {
    mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));
  }
});

// -----------------------------
// Versión de StormStore
// -----------------------------
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// =====================================
// MANEJO DE ACTUALIZACIONES
// =====================================
ipcMain.handle("check-for-updates", async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return result;
  } catch (err) {
    console.error("Error checking for updates:", err);
    throw err;
  }
});

ipcMain.handle("get-update-info", () => {
  return updateInfo;
});

ipcMain.handle("download-update", async () => {
  try {
    await autoUpdater.downloadUpdate();
    return true;
  } catch (err) {
    console.error("Error downloading update:", err);
    throw err;
  }
});

ipcMain.handle("install-update", () => {
  autoUpdater.quitAndInstall();
});

// -----------------------------
// Controles de Ventana (Custom)
// -----------------------------
ipcMain.on("window-minimize", () => mainWindow?.minimize());
ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on("window-close", () => mainWindow?.close());
ipcMain.handle("is-maximized", () => mainWindow?.isMaximized());

ipcMain.on("app-quit", () => {
  app.quit();
});

// =====================================
// FIN MANEJO DE ACTUALIZACIONES
// =====================================

// -----------------------------
// Inicio
// -----------------------------
// =====================================
// INSTANCIA ÚNICA
// Evita que se puedan abrir múltiples instancias/ventanas de la app
// Si otra instancia se inicia, traemos la ventana principal al frente.
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (event, argv, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Forzar el tema oscuro para toda la aplicación
    nativeTheme.themeSource = 'dark';
    // Permisos para WebHID
    session.defaultSession.setDevicePermissionHandler((details) => {
      if (details.deviceType === 'hid' && details.origin === 'file://') {
        return true;
      }
      return false;
    });

    createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform === "win32") app.quit();
  });
}
