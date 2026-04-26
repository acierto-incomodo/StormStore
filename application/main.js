const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  session,
  nativeTheme,
  dialog,
  protocol,
  net,
  Tray,
  Menu,
} = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const { pathToFileURL } = require("url");
const { spawn, exec } = require("child_process");
const { autoUpdater } = require("electron-updater");
const SteamPath = require("steam-path");
const gameScanner = require("@equal-games/game-scanner");
const DiscordRPC = require("discord-rpc");

let appsData = require("./apps.json");
let isOffline = true; // Por defecto asumimos offline hasta que la sincronización diga lo contrario

const ICON_SIZES = [
  "256x256",
  "512x512",
  "1024x1024",
  "2048x2048",
  "4096x4096",
];
let ICONS_CACHE_DIR;
let APPS_JSON_CACHE;
const SETTINGS_PATH = path.join(
  app.getPath("appData"),
  "StormGamesStudios",
  "StormStore",
  "settings.json",
);

const REMOTE_APPS_URL =
  "https://acierto-incomodo.github.io/StormStore/assets/apps.json";
const REMOTE_ICONS_BASE =
  "https://acierto-incomodo.github.io/StormStore/assets/apps-size/";

// Variables globales
let mainWindow;
let updateInfo = null;
let tray = null;

// =====================================
// GESTIÓN DE AJUSTES
// =====================================
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
    }
  } catch (e) {
    console.error("Error leyendo ajustes:", e);
  }
  return {
    auto_updates: false,
    start_with_windows: false,
    start_minimized: false,
    show_tray: true,
  };
}

function applySettings(settings) {
  // 1. Iniciar con Windows
  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: settings.start_with_windows,
      path: process.execPath,
      args: settings.start_minimized ? ["--start-minimized"] : [],
    });
  }

  // 2. Tray Icon
  if (settings.show_tray) {
    createTray();
  } else {
    if (tray) {
      tray.destroy();
      tray = null;
    }
  }
}

function saveSettings(newSettings) {
  try {
    const dir = path.dirname(SETTINGS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(newSettings, null, 2));
    applySettings(newSettings);
  } catch (err) {
    console.error("Error guardando ajustes:", err);
  }
}

function createTray() {
  if (tray) return;
  tray = new Tray(path.join(__dirname, "assets/app.ico"));
  const contextMenu = Menu.buildFromTemplate([
    { label: "Abrir StormStore", click: () => {
      mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }},
    { label: "Modo StormVortex", click: () => {
      mainWindow.show();
      mainWindow.setFullScreen(true);
      mainWindow.loadFile(path.join(__dirname, "renderer/bigpicture.html"));
      setActivity();
      mainWindow.focus();
    }},
    { label: "Buscar actualizaciones", click: () => {
      mainWindow.show();
      mainWindow.loadFile(path.join(__dirname, "renderer/updates.html"));
      autoUpdater.checkForUpdates();
    }},
    { type: "separator" },
    { label: "Reiniciar StormStore", click: () => {
      app.isQuiting = true;
      app.relaunch();
      app.exit(0);
    }},
    { type: "separator" },
    {
      label: "Salir",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip("StormStore");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// =====================================
// DISCORD RPC
// =====================================
const clientId = "1474762522048331787"; // ⚠️ REEMPLAZAR CON TU CLIENT ID REAL DE DISCORD

let rpc;
// try {
//   DiscordRPC.register(clientId);
//   rpc = new DiscordRPC.Client({ transport: 'ipc' });
// } catch (e) {
//   // Si falla la inicialización (ej. módulo corrupto), no detenemos la app
//   console.log("Discord RPC no pudo iniciarse:", e);
// }

const startTimestamp = Date.now();

const defaultRpcActivity = {
  details: "Explorando aplicaciones",
  state: "Navegando",
  largeImageKey: "stormstore",
  largeImageText: "StormStore",
  smallImageKey: undefined,
  smallImageText: undefined,
};

let rpcActivity = { ...defaultRpcActivity };

async function setActivity() {
  if (!rpc || !mainWindow) return;

  try {
    rpc
      .setActivity({
        ...rpcActivity,
        startTimestamp,
        instance: false,
      })
      .catch(() => {}); // Ignoramos errores si Discord se cierra de repente
  } catch (e) {
    // Ignoramos errores síncronos
  }
}

// if (rpc) {
//   rpc.on('ready', () => {
//     setActivity();
//     setInterval(() => setActivity(), 1000);
//   });

//   rpc.login({ clientId }).catch(() => {
//     // Discord no está abierto o no instalado. Ignoramos el error silenciosamente.
//   });
// }

// ❌ StormStore SOLO WINDOWS
if (process.platform !== "win32") {
  app.quit();
}

// Registrar protocolo stormstore://
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("stormstore", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("stormstore");
}

// Registro de esquema para iconos locales (necesario antes de app.ready)
protocol.registerSchemesAsPrivileged([
  {
    scheme: "storm-asset",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
  },
]);

// =====================================
// CONFIGURACIÓN DE ACTUALIZACIONES
// =====================================
autoUpdater.autoDownload = false;
autoUpdater.allowDowngrade = true;
autoUpdater.checkForUpdates();

autoUpdater.on("checking-for-update", () => {
  if (mainWindow) {
    mainWindow.setProgressBar(2); // Indeterminate
  }
});

autoUpdater.on("update-available", (info) => {
  updateInfo = info;
  if (mainWindow) {
    mainWindow.setProgressBar(-1);
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
    mainWindow.setProgressBar(-1);
    mainWindow.webContents.send("update-not-available");
  }
});

autoUpdater.on("download-progress", (progressObj) => {
  if (mainWindow) {
    mainWindow.setProgressBar(progressObj.percent / 100);
    mainWindow.webContents.send("download-progress", progressObj);
  }
});

autoUpdater.on("update-downloaded", () => {
  if (mainWindow) {
    mainWindow.setProgressBar(1, { mode: "normal" });
    setTimeout(() => {
      if (mainWindow) mainWindow.setProgressBar(-1);
    }, 3000);
    mainWindow.webContents.send("update-downloaded");
  }
});

autoUpdater.on("error", (err) => {
  console.error("Error en autoUpdater:", err);
  if (mainWindow) {
    mainWindow.setProgressBar(1, { mode: "error" });
    mainWindow.flashFrame(true);
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.setProgressBar(-1);
        mainWindow.flashFrame(false);
      }
    }, 3000);
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
    show: false,
    backgroundMaterial: "mica",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets/app.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  mainWindow = win;

  const vortexFlags = [
    "--StormVortex",
    "--stormvortex",
    "--vortex",
    "--bigpicture",
    "--Vortex",
    "--BigPicture",
    "--Bigpicture",
  ];
  const settings = loadSettings();
  const startInBigPicture = process.argv.some((arg) =>
    vortexFlags.includes(arg),
  );
  const isSilentStart = (settings.start_minimized || process.argv.includes("--start-minimized")) && !startInBigPicture;

  win.loadFile(
    path.join(
      __dirname,
      startInBigPicture ? "renderer/bigpicture.html" : "renderer/index.html",
    ),
  );

  win.once("ready-to-show", () => {
    if (startInBigPicture) {
      win.setFullScreen(true);
      win.show();
    } else if (isSilentStart) {
      // Si es inicio silencioso, no llamamos a win.show(). 
      // La ventana permanece oculta y solo el icono de la bandeja será visible.
      console.log("StormStore: Iniciando en modo silencioso (solo bandeja).");
    } else {
      win.maximize();
      win.show();
    }
  });

  win.on("close", (event) => {
    const currentSettings = loadSettings();
    if (currentSettings.show_tray && !app.isQuiting) {
      event.preventDefault();
      win.hide();
    }
    return false;
  });

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

function findExecutable(p) {
  const resolved = resolveWindowsPath(p);
  if (!resolved.includes("*")) {
    return fs.existsSync(resolved) ? resolved : null;
  }

  const dir = path.dirname(resolved);
  const pattern = path.basename(resolved);

  if (!fs.existsSync(dir)) return null;

  try {
    const files = fs.readdirSync(dir);
    // Escape regex characters except *
    const regexString =
      "^" +
      pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") +
      "$";
    const regex = new RegExp(regexString, "i");

    const matches = files.filter((f) => regex.test(f));

    if (matches.length === 0) return null;

    // Lógica específica para HMCL: preferir cualquier otro sobre la versión base 3.6.11
    if (pattern.toUpperCase().startsWith("HMCL-")) {
      const specific = "HMCL-3.6.11.exe";
      const others = matches.filter(
        (f) => f.toUpperCase() !== specific.toUpperCase(),
      );
      if (others.length > 0) {
        // Ordenar descendente para coger la versión más nueva si hay varias
        others.sort((a, b) =>
          b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" }),
        );
        return path.join(dir, others[0]);
      }
    }

    // Default sort for wildcards: descending (newest usually)
    matches.sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true, sensitivity: "base" }),
    );
    return path.join(dir, matches[0]);
  } catch (e) {
    console.error("Error finding executable for wildcard:", p, e);
    return null;
  }
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

async function runApp(exePath, requiresSteam) {
  try {
    if (
      exePath.startsWith("steam://") ||
      exePath.startsWith("com.epicgames.launcher://")
    ) {
      exec(`start "" "${exePath}"`);
      return true;
    }

    if (requiresSteam) {
      exec("start steam://");
    }

    const resolvedExe = findExecutable(exePath);

    if (!resolvedExe) {
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
}

async function showVirusWarning(appName) {
  if (!mainWindow) return true;

  return new Promise((resolve) => {
    mainWindow.webContents.send("show-virus-alert", appName);

    ipcMain.once("virus-alert-response", (event, response) => {
      resolve(response);
    });
  });
}

async function handleProtocolUrl(url) {
  if (!url || !mainWindow) return;
  const prefix = "stormstore://run/";
  if (url.startsWith(prefix)) {
    const id = url.substring(prefix.length).replace(/\/$/, "");
    const appItem = appsData.find((a) => a.id === id);

    if (appItem && appItem["virus-alert"] === "alert") {
      const proceed = await showVirusWarning(appItem.name);
      if (!proceed) return;
    }

    if (appItem) {
      if (appItem["virus-alert"] === "alert") {
        const proceed = await showVirusWarning(appItem.name);
        if (!proceed) return;
      }

      const validPath = appItem.paths.find((p) => findExecutable(p) !== null);
      if (validPath) {
        runApp(validPath, appItem.steam === "si");
      } else {
        mainWindow.webContents.send(
          "show-toast",
          `La aplicación '${appItem.name}' no está instalada. Iniciando instalación...`,
        );
        installAppLogic(appItem)
          .then(() => {
            mainWindow.webContents.send(
              "show-toast",
              `Instalación de '${appItem.name}' completada.`,
            );
          })
          .catch((err) => {
            console.error(err);
            mainWindow.webContents.send(
              "show-toast",
              `Error instalando '${appItem.name}'.`,
            );
          });
      }
    } else {
      mainWindow.webContents.send(
        "show-toast",
        `Programa no encontrado con ID: ${id}`,
      );
    }
  }
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const download = (downloadUrl) => {
      const file = fs.createWriteStream(dest);
      https
        .get(downloadUrl, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            file.close();
            fs.unlink(dest, () => {});
            return download(res.headers.location);
          }
          if (res.statusCode !== 200) {
            file.close();
            fs.unlink(dest, () => {});
            return reject(new Error(`Status ${res.statusCode}`));
          }
          res.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        })
        .on("error", (err) => {
          file.close();
          fs.unlink(dest, () => {});
          reject(err);
        });
    };
    download(url);
  });
}

async function syncRemoteData() {
  if (!fs.existsSync(ICONS_CACHE_DIR)) {
    fs.mkdirSync(ICONS_CACHE_DIR, { recursive: true });
  }

  // Asegurar que existan las subcarpetas para cada tamaño
  ICON_SIZES.forEach((size) => {
    const dir = path.join(ICONS_CACHE_DIR, size);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  try {
    const data = await new Promise((resolve, reject) => {
      const req = https.get(REMOTE_APPS_URL, (res) => {
        if (res.statusCode !== 200)
          return reject(new Error("Error fetching apps.json"));
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on("error", reject);
      req.end();
    });

    appsData = data;
    isOffline = false; // Sincronización exitosa = Estamos online
    fs.writeFileSync(APPS_JSON_CACHE, JSON.stringify(appsData, null, 2));

    // Notificar al frontend que los datos han sido actualizados
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        "show-toast",
        "Catálogo de aplicaciones sincronizado.",
      );
    }

    // DESCARGA DE ICONOS: Siempre verificamos si faltan en la caché local
    for (const item of appsData) {
      const fileName = path.basename(item.icon);
      const prioritySize = "1024x1024";

      // 1. Descargar prioridad (1024x1024) primero y esperar (await) para asegurar disponibilidad inmediata
      const priorityPath = path.join(ICONS_CACHE_DIR, prioritySize, fileName);
      if (!fs.existsSync(priorityPath)) {
        await downloadFile(
          `${REMOTE_ICONS_BASE}${prioritySize}/${fileName}`,
          priorityPath,
        ).catch(() => {});
      }

      // 2. Descargar el resto de tamaños en segundo plano para optimizar
      ICON_SIZES.filter((s) => s !== prioritySize).forEach((size) => {
        const localPath = path.join(ICONS_CACHE_DIR, size, fileName);
        if (!fs.existsSync(localPath)) {
          downloadFile(
            `${REMOTE_ICONS_BASE}${size}/${fileName}`,
            localPath,
          ).catch(() => {});
        }
      });
    }
  } catch (err) {
    console.error("Sync failed, using cache:", err.message);
    isOffline = true; // Fallo en la red = Modo offline
    if (fs.existsSync(APPS_JSON_CACHE)) {
      appsData = JSON.parse(fs.readFileSync(APPS_JSON_CACHE, "utf8"));
    }
  }
}

// -----------------------------
// IPC
// -----------------------------
ipcMain.handle("get-apps", () => {
  return appsData.map((appItem) => {
    const fileName = path.basename(appItem.icon);
    const local1024 = path.join(ICONS_CACHE_DIR, "1024x1024", fileName);

    let iconUrl;

    // Si existe la versión de 1024 localmente, la usamos siempre (prioridad absoluta)
    if (fs.existsSync(local1024)) {
      iconUrl = `storm-asset://1024x1024/${fileName}`;
    } else if (isOffline) {
      // Si estamos offline y no hay 1024, buscamos cualquier otro tamaño disponible en caché
      const availableSize = ICON_SIZES.find((s) =>
        fs.existsSync(path.join(ICONS_CACHE_DIR, s, fileName)),
      );
      iconUrl = availableSize
        ? `storm-asset://${availableSize}/${fileName}`
        : appItem.icon;
    } else {
      // En modo online sin caché de 1024, pedimos la de 1024 remota por defecto
      iconUrl = `${REMOTE_ICONS_BASE}1024x1024/${fileName}`;
    }

    let executablePath = null;
    for (const p of appItem.paths) {
      if (findExecutable(p) !== null) {
        executablePath = p;
        break;
      }
    }

    let uninstallExists = false;
    if (appItem.uninstall) {
      const resolvedUninstall = resolveWindowsPath(appItem.uninstall);
      uninstallExists = fs.existsSync(resolvedUninstall);
    }

    return {
      ...appItem,
      icon: iconUrl,
      installed: executablePath !== null,
      executablePath,
      uninstallExists,
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
          exec(
            'reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath',
            (err, stdout) => {
              if (err) reject(err);
              else resolve({ stdout });
            },
          );
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
        "E:\\Steam",
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
                    installPath: installDir
                      ? path.join(lib, "common", installDir)
                      : null,
                    installed: true,
                    executablePath: `steam://rungameid/${appId}`,
                    steam: "si",
                    wifi: "no",
                  });
                }
              }
            } catch (e) {
              console.error(e);
            }
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
      paths: [
        `com.epicgames.launcher://apps/${game.id}?action=launch&silent=true`,
      ],
      installPath: game.path,
      installed: true,
      executablePath: `com.epicgames.launcher://apps/${game.id}?action=launch&silent=true`,
      epic: "si",
      wifi: "no",
    }));
  } catch (error) {
    console.error("Error getting epic games:", error);
    return [];
  }
});

async function installAppLogic(appData) {
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
              if (mainWindow) {
                mainWindow.setProgressBar(1, { mode: "error" });
                mainWindow.flashFrame(true);
                setTimeout(() => {
                  if (mainWindow) {
                    mainWindow.setProgressBar(-1);
                    mainWindow.flashFrame(false);
                  }
                }, 3000);
              }
              return reject(new Error("Error descargando el archivo"));
            }

            const totalLength = parseInt(res.headers["content-length"], 10);
            let downloaded = 0;

            if (mainWindow) {
              mainWindow.setProgressBar(0, { mode: "normal" });
            }

            res.on("data", (chunk) => {
              downloaded += chunk.length;
              if (mainWindow && !isNaN(totalLength) && totalLength > 0) {
                mainWindow.setProgressBar(downloaded / totalLength);
              }
            });

            res.pipe(file);

            file.on("finish", () => {
              file.close(() => {
                if (mainWindow) mainWindow.setProgressBar(2); // Indeterminate during install
                // ▶ Ejecutar instalador
                exec(`"${filePath}"`, (err) => {
                  if (err) {
                    console.error("Error ejecutando instalador:", err);
                    if (mainWindow) {
                      mainWindow.setProgressBar(1, { mode: "error" });
                      mainWindow.flashFrame(true);
                      setTimeout(() => {
                        if (mainWindow) {
                          mainWindow.setProgressBar(-1);
                          mainWindow.flashFrame(false);
                        }
                      }, 3000);
                    }
                    return reject(err);
                  }

                  // 🧹 Borrar instalador después de 10s
                  setTimeout(() => {
                    if (fs.existsSync(filePath)) {
                      fs.unlinkSync(filePath);
                    }
                  }, 10000);

                  if (mainWindow) {
                    mainWindow.setProgressBar(1, { mode: "normal" });
                    setTimeout(() => {
                      if (mainWindow) mainWindow.setProgressBar(-1);
                    }, 3000);
                  }

                  resolve(true);
                });
              });
            });
          })
          .on("error", (err) => {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (mainWindow) {
              mainWindow.setProgressBar(1, { mode: "error" });
              mainWindow.flashFrame(true);
              setTimeout(() => {
                if (mainWindow) {
                  mainWindow.setProgressBar(-1);
                  mainWindow.flashFrame(false);
                }
              }, 3000);
            }
            reject(err);
          });
      }

      download(appData.download);
    } catch (err) {
      reject(err);
    }
  });
}

ipcMain.handle("install-app", async (_, appData) => {
  if (appData["virus-alert"] === "alert") {
    const proceed = await showVirusWarning(appData.name);
    if (!proceed) return false;
  }
  return await installAppLogic(appData);
});

ipcMain.handle("open-app", async (_, exePath, requiresSteam) => {
  const appItem = appsData.find((a) => a.paths.includes(exePath));
  if (appItem && appItem["virus-alert"] === "alert") {
    const proceed = await showVirusWarning(appItem.name);
    if (!proceed) return false;
  }
  return await runApp(exePath, requiresSteam);
});

ipcMain.handle("open-app-location", async (_, exePath) => {
  if (!exePath) return;

  let resolved = findExecutable(exePath);

  if (resolved) {
    shell.showItemInFolder(resolved);
  } else {
    // Fallback: try to open the directory if the path contains wildcards or just doesn't exist as file
    const rawPath = resolveWindowsPath(exePath);
    const dir = path.dirname(rawPath);
    if (fs.existsSync(dir)) {
      shell.openPath(dir);
    }
  }
});

ipcMain.handle("delete-app-folder", async (_, exePath) => {
  try {
    const resolvedExe = findExecutable(exePath);
    let folderPath;

    if (resolvedExe) {
      folderPath = path.dirname(resolvedExe);
    } else {
      const raw = resolveWindowsPath(exePath);
      folderPath = path.dirname(raw);
    }

    if (folderPath && fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error deleting app folder:", err);
    throw err;
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

ipcMain.handle("open-big-picture", () => {
  if (mainWindow) {
    mainWindow.setFullScreen(true);
    mainWindow.loadFile(path.join(__dirname, "renderer/bigpicture.html"));
    setActivity();
    mainWindow.focus();
  }
});

ipcMain.handle("open-main-view", () => {
  if (mainWindow) {
    mainWindow.setFullScreen(false);
    mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));
    setActivity();
    mainWindow.focus();
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
ipcMain.on("window-close", () => {
  mainWindow?.close();
});
ipcMain.handle("is-maximized", () => mainWindow?.isMaximized());

ipcMain.on("app-quit", () => {
  app.isQuiting = true;
  app.quit();
});

ipcMain.on("set-discord-activity", (event, activity) => {
  // Reset to default and then merge the new activity to avoid stale data
  rpcActivity = { ...defaultRpcActivity, ...activity };
  setActivity();
});

ipcMain.handle("sync-remote-data", async () => {
  await syncRemoteData();
  return true;
});

ipcMain.handle("get-settings", () => loadSettings());
ipcMain.on("save-settings", (event, settings) => saveSettings(settings));

ipcMain.handle("clear-cache", async () => {
  try {
    const cacheDir = path.join(
      app.getPath("appData"),
      "StormGamesStudios",
      "StormStore",
      "StormStoreCache",
    );

    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }

    // Reiniciar la sincronización para descargar todo de nuevo desde el servidor
    await syncRemoteData();
    return true;
  } catch (err) {
    console.error("Error al limpiar caché:", err);
    return false;
  }
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
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    const url = argv.find((arg) => arg.startsWith("stormstore://"));
    if (url) handleProtocolUrl(url);
  });

  app.whenReady().then(() => {
    // Forzar el tema oscuro para toda la aplicación
    nativeTheme.themeSource = "dark";

    // Configurar tareas de la Jump List para Windows
    if (process.platform === "win32") {
      app.setUserTasks([
        {
          program: process.execPath,
          arguments: "--StormVortex",
          iconPath: path.join(__dirname, "assets/app.ico"),
          iconIndex: 0,
          title: "Modo StormVortex",
          description: "Inicia StormStore directamente en modo Big Picture",
        },
        {
          program: process.execPath,
          arguments: "--start-minimized",
          iconPath: path.join(__dirname, "assets/app.ico"),
          iconIndex: 0,
          title: "Iniciar en segundo plano",
          description:
            "Abre la aplicación minimizada en la bandeja del sistema",
        },
      ]);
    }

    const CACHE_DIR = path.join(
      app.getPath("appData"),
      "StormGamesStudios",
      "StormStore",
      "StormStoreCache",
    );
    ICONS_CACHE_DIR = path.join(CACHE_DIR, "icons");
    APPS_JSON_CACHE = path.join(CACHE_DIR, "apps.json");

    if (fs.existsSync(APPS_JSON_CACHE)) {
      try {
        appsData = JSON.parse(fs.readFileSync(APPS_JSON_CACHE, "utf8"));
      } catch (e) {}
    }

    // Manejador del protocolo storm-asset://
    protocol.handle("storm-asset", (request) => {
      // La URL ahora incluye el tamaño, ej: storm-asset://1024x1024/icono.png
      const assetPath = request.url.replace("storm-asset://", "");
      const filePath = path.join(ICONS_CACHE_DIR, assetPath);
      return net.fetch(pathToFileURL(filePath).toString());
    });

    syncRemoteData();

    // Permisos para WebHID
    session.defaultSession.setDevicePermissionHandler((details) => {
      if (details.deviceType === "hid" && details.origin === "file://") {
        return true;
      }
      return false;
    });

    applySettings(loadSettings());
    createWindow();
    const url = process.argv.find((arg) => arg.startsWith("stormstore://"));
    if (url) handleProtocolUrl(url);
  });

  app.on("window-all-closed", () => {
    if (process.platform === "win32") app.quit();
  });
}
