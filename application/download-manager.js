const fs = require("fs");
const { app } = require("electron");
const fsPromises = fs.promises;
const path = require("path");
const https = require("https");
const http = require("http");
const crypto = require("crypto");
const { exec } = require("child_process");
const { promisify } = require("util");
const extractZip = require("extract-zip");

const execPromise = promisify(exec);

class DownloadManager {
  constructor(mainWindow, ipcMain) {
    this.mainWindow = mainWindow;
    this.ipcMain = ipcMain;
    this.downloads = new Map();

    // Corregir la ruta de 7zr.exe para que funcione empaquetado (fuera del ASAR)
    if (app.isPackaged) {
      // En producción, extraResources se copian a la carpeta 'resources'
      this.sevenZrPath = path.join(
        process.resourcesPath,
        "assets",
        "extraFiles",
        "7zr.exe",
      );
    } else {
      this.sevenZrPath = path.join(
        __dirname,
        "assets",
        "extraFiles",
        "7zr.exe",
      );
    }
  }

  /**
   * Inicia la descarga de un archivo o conjunto de archivos
   */
  async startDownload(id, downloadConfig, tempDir) {
    try {
      // Paso 0: Verificar versión antes de descargar para determinar si es instalación o actualización
      const localVersion = await this._getLocalVersion(downloadConfig);
      const remoteVersion = await this._getRemoteVersion(downloadConfig);
      const isUpdate = localVersion !== null;

      const download = {
        id,
        config: downloadConfig,
        tempDir,
        isUpdate,
        status: "downloading",
        downloadedFiles: [],
        progress: 0,
        downloaded: 0,
        total: 0,
        speed: 0,
        timeRemaining: 0,
        startTime: Date.now(),
        currentRequest: null, // Guardar la petición activa para poder abortarla
        lastByteCount: 0,
        lastProgressUpdate: Date.now(),
      };

      this.downloads.set(id, download);

      // Enviar evento de inicio
      this.mainWindow.webContents.send(
        "download-start",
        id,
        downloadConfig.name,
        isUpdate,
      );

      console.log(
        `Versión local: ${localVersion}, Versión remota: ${remoteVersion}`,
      );

      if (localVersion === remoteVersion && localVersion !== null) {
        // Las versiones coinciden, no descargar
        console.log(
          `Las versiones coinciden (${localVersion}). Saltando descarga.`,
        );
        this.mainWindow.webContents.send("download-complete", id);
        return { success: true, message: "Ya está actualizado" };
      }

      // Versiones diferentes, descargar todo
      console.log("Las versiones son diferentes. Descargando...");

      // Paso 1: Descargar los archivos (SECUENCIAL, 1 por 1)
      await this._downloadFilesSequential(download);

      // Paso 2: Combinar archivos si es necesario (Implementado dentro de _downloadFilesSequential o después)

      // Paso 3: Limpiar directorio destino ANTES de descomprimir
      download.status = "extracting";
      this.mainWindow.webContents.send("cleaning-start", id);
      await this._cleanExtractPath(download);

      // Paso 4: Descomprimir
      this.mainWindow.webContents.send("extracting-start", id);
      await this._extractFiles(download);

      // Paso 5: Descargar y guardar archivo de versión
      download.status = "verifying";
      this.mainWindow.webContents.send("verifying-start", id);
      await this._downloadAndSaveVersion(download, remoteVersion);

      // Paso 6: Limpiar archivos temporales
      await this._cleanup(download);

      // Enviar evento de completación
      download.status = "completed";
      this.mainWindow.webContents.send("download-complete", id);

      return { success: true, message: "Descarga y actualización completada" };
    } catch (error) {
      console.error(`Error en descarga ${id}:`, error);
      this.mainWindow.webContents.send("download-error", id, error.message);

      // Intentar limpiar
      try {
        await this._cleanup(this.downloads.get(id));
      } catch (e) {
        console.error("Error durante cleanup:", e);
      }

      return { success: false, error: error.message };
    }
  }

  async _getLocalVersion(config) {
    try {
      const versionDir = config.checksumPath || config.extractPath;
      const versionPath = path.join(versionDir, config.checksumFile);
      return await fsPromises.readFile(versionPath, "utf8");
    } catch (e) {
      return null;
    }
  }

  async _getRemoteVersion(config) {
    try {
      // Pasar el ID para debug si fuera necesario
      const data = await this._downloadChecksum(config.checksumUrl);
      if (data && data.includes("\n")) {
        // Si el archivo tiene varias líneas (ej: hash + nombre), nos quedamos con la primera
        return data.split("\n")[0].trim();
      }
      return data ? data.trim() : "unknown";
    } catch (e) {
      return "unknown";
    }
  }

  async _downloadFilesSequential(download) {
    const { config, tempDir } = download;

    let totalSize = 0;
    const filesWithSizes = [];

    for (const filename of config.files) {
      if (download.status === "cancelled") return;

      const url = config.downloadUrl + filename;
      const size = await this._getFileSize(url);
      filesWithSizes.push({ filename, url, size });
      totalSize += size;
    }

    download.total = totalSize;

    for (const fileInfo of filesWithSizes) {
      if (download.status === "cancelled") return;

      const filepath = path.join(tempDir, fileInfo.filename);
      await this._downloadFile(
        download,
        fileInfo.url,
        filepath,
        fileInfo.filename,
        fileInfo.size,
      );
    }

    // Si merge es true, combinar después de descargar todos
    if (config.merge) {
      download.status = "merging";
      this.mainWindow.webContents.send("merging-start", download.id);
      if (this.mainWindow) this.mainWindow.setProgressBar(2); // Estado indeterminado durante combinación
      await this._mergeFiles(download);
    }
  }

  async _cleanExtractPath(download) {
    const { config } = download;
    try {
      // BORRADO TOTAL: Eliminar archivos antiguos antes de poner los nuevos
      if (fs.existsSync(config.extractPath)) {
        await fsPromises.rm(config.extractPath, {
          recursive: true,
          force: true,
        });
      }
      await fsPromises.mkdir(config.extractPath, { recursive: true });
    } catch (e) {
      console.error("Error limpiando carpeta de extracción:", e);
    }
  }

  async _downloadAndSaveVersion(download, remoteVersion) {
    const { config } = download;
    const versionDir = config.checksumPath || config.extractPath;
    const versionPath = path.join(versionDir, config.checksumFile);

    await fsPromises.mkdir(versionDir, { recursive: true });
    await fsPromises.writeFile(versionPath, remoteVersion);
  }

  /**
   * Descarga todos los archivos necesarios
   */
  async _downloadFiles(download) {
    const { config, tempDir } = download;

    // Primero, hacer HEAD requests para obtener los tamaños
    let totalSize = 0;
    const fileSizes = [];

    for (const filename of config.files) {
      const url = config.downloadUrl + filename;
      const size = await this._getFileSize(url);
      fileSizes.push(size);
      totalSize += size;
    }

    download.total = totalSize;

    const downloadPromises = [];

    for (let i = 0; i < config.files.length; i++) {
      const filename = config.files[i];
      const url = config.downloadUrl + filename;
      const filepath = path.join(tempDir, filename);

      downloadPromises.push(
        this._downloadFile(download, url, filepath, filename, fileSizes[i]),
      );
    }

    await Promise.all(downloadPromises);
  }

  /**
   * Obtiene el tamaño de un archivo usando HEAD request
   */
  _getFileSize(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith("https") ? https : http;

      const req = protocol.request(url, { method: "HEAD" }, (res) => {
        // Soporte para redirecciones en HEAD (GitHub)
        if (
          [301, 302, 307, 308].includes(res.statusCode) &&
          res.headers.location
        ) {
          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith("http")) {
            const urlObj = new URL(url);
            redirectUrl = urlObj.origin + redirectUrl;
          }
          return this._getFileSize(redirectUrl).then(resolve).catch(reject);
        }
        const size = parseInt(res.headers["content-length"], 10) || 0;
        resolve(size);
      });

      req.on("error", (error) => {
        console.warn(`Error obteniendo tamaño de ${url}:`, error);
        resolve(0); // Asumir tamaño 0 si hay error
      });

      req.end();
    });
  }

  /**
   * Descarga un archivo individual
   */
  _downloadFile(download, url, filepath, filename, fileSize) {
    return new Promise((resolve, reject) => {
      if (download.status === "cancelled")
        return reject(new Error("CANCELLED"));

      const protocol = url.startsWith("https") ? https : http;

      const req = protocol.get(url, (res) => {
        // MANEJO DE REDIRECCIONES
        if (
          [301, 302, 307, 308].includes(res.statusCode) &&
          res.headers.location
        ) {
          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith("http")) {
            const urlObj = new URL(url);
            redirectUrl = urlObj.origin + redirectUrl;
          }
          return this._downloadFile(
            download,
            redirectUrl,
            filepath,
            filename,
            fileSize,
          )
            .then(resolve)
            .catch(reject);
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${url}`));
          return;
        }

        download.currentRequest = req;

        // Asegurarse de que el directorio temporal existe ANTES de crear el stream (Fix ENOENT)
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const totalFileSize =
          parseInt(res.headers["content-length"], 10) || fileSize || 0;
        let downloadedFromThisFile = 0;
        let lastUpdateTime = Date.now();

        const file = fs.createWriteStream(filepath);

        res.on("data", (chunk) => {
          downloadedFromThisFile += chunk.length;
          download.downloaded += chunk.length;

          // Actualizar progreso cada 500ms máximo
          const now = Date.now();
          if (now - lastUpdateTime > 500) {
            const elapsedSeconds = (now - download.startTime) / 1000;
            const speed = download.downloaded / Math.max(elapsedSeconds, 0.1);
            const timeRemaining = Math.max(
              0,
              (download.total - download.downloaded) / Math.max(speed, 1),
            );
            const progressRatio =
              download.downloaded / Math.max(download.total, 1);
            const percent = Math.round(progressRatio * 100);

            if (this.mainWindow) {
              this.mainWindow.setProgressBar(progressRatio);
            }

            this.mainWindow.webContents.send("download-progress", download.id, {
              percent,
              speed,
              timeRemaining,
              downloadedSize: download.downloaded,
              totalSize: download.total,
            });

            lastUpdateTime = now;
          }
        });

        file.on("finish", () => {
          file.close();
          download.downloadedFiles.push({
            filename,
            size: totalFileSize,
            filepath,
          });
          resolve();
        });

        res.pipe(file);
      });

      req.on("error", (error) => {
        if (download.status === "cancelled") {
          resolve(); // Resolver silenciosamente si fue cancelado a propósito
        } else {
          fs.unlink(filepath, () => {});
          reject(error);
        }
      });
    });
  }

  /**
   * Combina múltiples archivos .zip.001, .zip.002, etc en un único .zip
   */
  async _mergeFiles(download) {
    const { config, tempDir } = download;
    const mergedPath = path.join(tempDir, config.mergedName);

    // Obtener archivos ordenados
    const files = [...config.files].sort();

    // Combinar archivos usando Streams (más eficiente para archivos grandes)
    const writeStream = fs.createWriteStream(mergedPath);

    for (const filename of files) {
      const filepath = path.join(tempDir, filename);
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(filepath);
        readStream.pipe(writeStream, { end: false });
        readStream.on("end", resolve);
        readStream.on("error", reject);
      });
    }
    writeStream.end();
    await new Promise((resolve) => writeStream.on("finish", resolve));

    // Eliminar archivos parciales
    for (const filename of files) {
      const filepath = path.join(tempDir, filename);
      await fsPromises.unlink(filepath);
    }

    download.downloadedFiles = [
      { filename: config.mergedName, filepath: mergedPath },
    ];
  }

  /**
   * Descomprime los archivos usando 7zr.exe
   */
  async _extractFiles(download) {
    const { config, tempDir } = download;
    const zipPath = download.downloadedFiles[0].filepath;
    const extractPath = config.extractPath;

    // Asegurarse de que la ruta destino existe (reforzado)
    if (!fs.existsSync(extractPath)) {
      await fsPromises.mkdir(extractPath, { recursive: true });
    }

    if (this.mainWindow) this.mainWindow.setProgressBar(2); // Estado indeterminado durante extracción

    // Si es un archivo .zip, usar la librería extract-zip (soporta ZIP nativamente)
    if (zipPath.toLowerCase().endsWith(".zip")) {
      try {
        await extractZip(path.resolve(zipPath), {
          dir: path.resolve(extractPath),
        });
        return;
      } catch (err) {
        throw new Error(`Error al descomprimir ZIP: ${err.message}`);
      }
    }

    // Ejecutar 7zr para descomprimir
    return new Promise((resolve, reject) => {
      const command = `"${this.sevenZrPath}" x "${zipPath}" -o"${extractPath}" -y`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Error al descomprimir: ${error.message}`));
          return;
        }

        resolve();
      });
    });
  }

  /**
   * Descarga y verifica el archivo checksum
   */
  async _verifyChecksum(download) {
    const { config } = download;

    try {
      const checksum = await this._downloadChecksum(
        config.checksumUrl,
        config.checksumFile,
      );

      // Calcular checksum del contenido descargado
      const expectedChecksum = await this._calculateChecksum(
        config.extractPath,
      );

      if (checksum.trim() !== expectedChecksum.trim()) {
        throw new Error(
          `Verificación fallida: checksums no coinciden\nEsperado: ${checksum}\nObtenido: ${expectedChecksum}`,
        );
      }

      // Guardar checksum localmente
      const checksumDestDir = config.checksumPath || config.extractPath;
      const checksumDest = path.join(checksumDestDir, config.checksumFile);

      // Asegurarse de que el directorio del checksum existe
      await fsPromises.mkdir(checksumDestDir, { recursive: true });

      await fsPromises.writeFile(checksumDest, checksum);
    } catch (error) {
      console.warn(`Advertencia en verificación de checksum: ${error.message}`);
      // No rechazar, solo advertencia
    }
  }

  /**
   * Descarga el archivo de checksum
   */
  _downloadChecksum(url, filename) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith("https") ? https : http;

      const req = protocol.get(url, (res) => {
        // Seguir redirecciones (GitHub usa 302 para descargas)
        if (
          [301, 302, 307, 308].includes(res.statusCode) &&
          res.headers.location
        ) {
          let redirectUrl = res.headers.location;
          if (!redirectUrl.startsWith("http")) {
            const urlObj = new URL(url);
            redirectUrl = urlObj.origin + redirectUrl;
          }
          return this._downloadChecksum(redirectUrl, filename)
            .then(resolve)
            .catch(reject);
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} al obtener el checksum`));
          return;
        }

        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve(data);
        });
      });

      req.on("error", (err) => reject(err));
    });
  }

  /**
   * Calcula el hash SHA-256 de un directorio o archivo
   */
  async _calculateChecksum(filepath) {
    const hash = crypto.createHash("sha256");

    try {
      const stats = await fsPromises.stat(filepath);

      if (stats.isFile()) {
        const data = await fsPromises.readFile(filepath);
        hash.update(data);
      } else if (stats.isDirectory()) {
        // Calcular hash de todos los archivos en el directorio
        const files = await this._getAllFiles(filepath);
        files.sort();

        for (const file of files) {
          const data = await fsPromises.readFile(file);
          hash.update(data);
        }
      }
    } catch (error) {
      throw new Error(`Error calculando checksum: ${error.message}`);
    }

    return hash.digest("hex");
  }

  /**
   * Obtiene todos los archivos en un directorio recursivamente
   */
  async _getAllFiles(dir) {
    const files = [];
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this._getAllFiles(fullPath)));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Limpia archivos temporales
   */
  async _cleanup(download) {
    if (!download || !download.tempDir) return;

    try {
      if (fs.existsSync(download.tempDir)) {
        await fsPromises.rm(download.tempDir, { recursive: true, force: true });
      }

      // Intentar eliminar la carpeta raíz de descargas si queda vacía
      const rootTempDir = path.dirname(download.tempDir);
      if (fs.existsSync(rootTempDir)) {
        const files = await fsPromises.readdir(rootTempDir);
        if (files.length === 0) {
          await fsPromises.rm(rootTempDir, { recursive: true, force: true });
        }
      }
    } catch (error) {
      console.warn(`Error durante cleanup: ${error.message}`);
    }
  }

  /**
   * Pausa una descarga
   */
  pauseDownload(id) {
    const download = this.downloads.get(id);
    if (download) {
      download.status = "paused";
    }
  }

  /**
   * Cancela una descarga
   */
  async cancelDownload(id) {
    const download = this.downloads.get(id);
    if (download) {
      download.status = "cancelled";
      // Abortar la petición HTTP actual si existe
      if (download.currentRequest) {
        download.currentRequest.destroy();
      }
      await this._cleanup(download);
      this.downloads.delete(id);
      // Notificar al frontend
      this.mainWindow.webContents.send("download-cancelled", id);
    }
  }

  /**
   * Obtiene el estado de una descarga
   */
  getDownloadStatus(id) {
    return this.downloads.get(id) || null;
  }

  /**
   * Obtiene todas las descargas
   */
  getAllDownloads() {
    return Array.from(this.downloads.values());
  }
}

module.exports = DownloadManager;
