const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const { spawn } = require("child_process");

const apps = require("./apps.json");

function resolvePath(p) {
  return p.replace(/%appdata%/gi, app.getPath("appData"));
}

// 🚪 Ventana principal
function createWindow() {
  if (process.platform !== "win32") {
    console.error("StormStore solo funciona en Windows");
    app.quit();
    return;
  }

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

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

/* 📁 Descargas */
function getDownloadDir() {
  const dir = path.join(
    app.getPath("appData"),
    "StormGamesStudios",
    "StormStore",
    "downloads"
  );
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// 📦 Apps
ipcMain.handle("get-apps", () => {
  return apps.map((appItem) => {
    const resolvedPaths = appItem.paths.map(resolvePath);
    return {
      ...appItem,
      installed: resolvedPaths.some((p) => fs.existsSync(p)),
      resolvedPaths,
    };
  });
});

// ⬇️ Instalar
ipcMain.handle("install-app", (_, appData) => {
  const filePath = path.join(getDownloadDir(), `${appData.id}.exe`);
  const file = fs.createWriteStream(filePath);

  https.get(appData.download, (res) => {
    res.pipe(file);
    file.on("finish", () => {
      file.close();

      // abrir instalador
      spawn("cmd.exe", ["/c", "start", "", `"${filePath}"`], {
        detached: true,
        stdio: "ignore",
      }).unref();

      // borrar luego
      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 10000);
    });
  });
});

// ▶️ ABRIR APP (UPDATER / LAUNCHER)
ipcMain.handle("open-app", async (_, exePath) => {
  const resolved = resolvePath(exePath);

  if (!fs.existsSync(resolved)) {
    throw new Error("Ejecutable no encontrado: " + resolved);
  }

  spawn("cmd.exe", ["/c", "start", "", `"${resolved}"`], {
    detached: true,
    stdio: "ignore",
  }).unref();

  return true;
});

// 🪟 Ready
app.whenReady().then(createWindow);
