const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const { spawn } = require("child_process");

const apps = require("./apps.json");

// Crear ventana principal
function createWindow() {
  const win = new BrowserWindow({
    width: 1210,
    height: 650,
    backgroundColor: "#1e1e1e",
    icon: path.join(__dirname, "./assets/app.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  win.loadFile("renderer/index.html");

  // Interceptar solicitudes de nueva ventana (window.open) y abrirlas en el navegador
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" }; // Evita que Electron cree su propia ventana
  });
}

/* 📁 Carpeta de descargas */
function getDownloadDir() {
  const base = app.getPath("appData");
  const dir = path.join(base, "StormGamesStudios", "StormStore", "downloads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// API para renderer
ipcMain.handle("get-apps", () => {
  return apps.map((appItem) => ({
    ...appItem,
    installed: appItem.paths.some((p) => {
      const resolvedPath = path.normalize(
        p.replace(/%appdata%/gi, app.getPath("appData")),
      );
      return fs.existsSync(resolvedPath);
    }),
  }));
});

ipcMain.handle("install-app", (e, appData) => {
  const downloadDir = getDownloadDir();
  const filePath = path.join(downloadDir, `${appData.id}.exe`);
  const file = fs.createWriteStream(filePath);

  https.get(appData.download, (res) => {
    res.pipe(file);
    file.on("finish", () => {
      file.close();
      exec(`"${filePath}"`);
      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 10000);
    });
  });
});

ipcMain.handle("open-app", async (event, exePath) => {
  try {
    const appDir = path.dirname(exePath);

    spawn(exePath, [], {
      cwd: appDir,      // 🔥 CLAVE: carpeta del programa
      detached: true,
      stdio: "ignore",
    }).unref();

    return true;
  } catch (err) {
    console.error("Error al abrir app:", err);
    return false;
  }
});

// Nueva API: obtener versión de la app
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// Crear ventana al iniciar
app.whenReady().then(createWindow);
