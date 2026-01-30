const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const { spawn, exec } = require("child_process");

const apps = require("./apps.json");

// ❌ StormStore SOLO WINDOWS
//if (process.platform !== "win32") {
//  app.quit();
//}

// -----------------------------
// Ventana principal
// -----------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1210,
    height: 650,
    backgroundColor: "#1e1e1e",
    icon: path.join(__dirname, "assets/app.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

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

// -----------------------------
// Inicio
// -----------------------------
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform === "win32") app.quit();
});
