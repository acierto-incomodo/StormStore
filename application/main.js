const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const { spawn, exec } = require("child_process");
const { autoUpdater } = require("electron-updater");

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
autoUpdater.checkForUpdates();

autoUpdater.on("update-available", (info) => {
  updateInfo = info;
  if (mainWindow) {
    mainWindow.webContents.send("update-available", info);
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
    height: 650,
    minWidth: 1226,
    minHeight: 650,
    backgroundColor: "#1e1e1e",
    icon: path.join(__dirname, "assets/app.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,

      autoHideMenuBar: true,
    },
  });

  mainWindow = win;
  win.loadFile(path.join(__dirname, "renderer/index.html"));

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
                  app.quit();
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

ipcMain.handle("open-app", async (_, exePath) => {
  try {
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

  app.whenReady().then(createWindow);

  app.on("window-all-closed", () => {
    if (process.platform === "win32") app.quit();
  });
}
