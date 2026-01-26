const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

let mainWindow;

// 🔒 SOLO WINDOWS
if (process.platform !== "win32") {
  app.quit();
}

// =======================
// 🧠 UTILIDADES
// =======================

function resolvePath(p) {
  return path.normalize(
    p.replace(/%appdata%/gi, app.getPath("appData"))
  );
}

// =======================
// 🪟 CREAR VENTANA
// =======================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("index.html");
}

// =======================
// 🚀 APP READY
// =======================

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform === "win32") app.quit();
});

// =======================
// 📦 IPC
// =======================

// 📋 Obtener lista de apps
ipcMain.handle("get-apps", async () => {
  const appsPath = path.join(__dirname, "apps.json");
  return JSON.parse(fs.readFileSync(appsPath, "utf8"));
});

// ▶️ Abrir app (launcher / updater)
ipcMain.handle("open-app", async (_, exePath) => {
  const resolved = resolvePath(exePath);

  console.log("Ruta final:", resolved);

  if (!fs.existsSync(resolved)) {
    throw new Error("El ejecutable no existe");
  }

  spawn("cmd.exe", ["/c", "start", "", `"${resolved}"`], {
    detached: true,
    stdio: "ignore",
  }).unref();

  return true;
});

// ⬇️ Instalar app (descarga externa)
ipcMain.handle("install-app", async (_, url) => {
  spawn("cmd.exe", ["/c", "start", "", url], {
    detached: true,
    stdio: "ignore",
  }).unref();

  return true;
});

// 🏷️ OBTENER VERSIÓN DE LA APP (package.json)
ipcMain.handle("get-version", () => {
  return app.getVersion();
});
