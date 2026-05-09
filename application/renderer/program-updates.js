document.addEventListener("DOMContentLoaded", async () => {
  const titleText = document.getElementById("title-text");
  const statusText = document.getElementById("status-text");
  const progressFill = document.getElementById("progress-fill");
  const downloadedText = document.getElementById("downloaded-text");
  const totalText = document.getElementById("total-text");
  const speedText = document.getElementById("speed-text");
  const backBtn = document.getElementById("back-to-apps");

  const params = new URLSearchParams(window.location.search);
  const requestedProgramId = params.get("id");

  let selectedId = requestedProgramId;
  let isInstalling = false;
  let totalSize = 0;
  let currentAppName = "";

  const isBatch = params.get("batch") === "true";
  const batchIds = isBatch ? params.get("ids").split(",") : [];
  let currentBatchIndex = 0;
  let queueNames = {};

  const playSound = (soundFile) => {
    new Audio(`../assets/media/sounds/${soundFile}`).play();
  };

  const showVirusConfirm = async (appName) => {
    return new Promise((resolve) => {
      const overlay = document.getElementById("virus-alert-overlay");
      const text = document.getElementById("virus-alert-text");
      const cancelBtn = document.getElementById("virus-cancel-btn");
      const continueBtn = document.getElementById("virus-continue-btn");

      playSound("error.mp3");
      text.innerHTML = `La aplicación <strong>${appName}</strong> ha sido marcada con una alerta de seguridad.<br><br>Es posible que sea un virus. ¿Deseas continuar?`;
      overlay.classList.add("active");

      const cleanup = () => {
        overlay.classList.remove("active");
        cancelBtn.onclick = null;
        continueBtn.onclick = null;
      };

      cancelBtn.onclick = () => {
        playSound("back.mp3");
        cleanup();
        resolve(false);
      };
      continueBtn.onclick = () => {
        cleanup();
        resolve(true);
      };
    });
  };

  const updateQueueUI = () => {
    const queueList = document.getElementById("update-queue");
    if (!queueList) return;
    queueList.innerHTML = "";

    const idsToRender = isBatch ? batchIds : selectedId ? [selectedId] : [];

    idsToRender.forEach((id, index) => {
      const li = document.createElement("li");
      const name = queueNames[id] || id;
      li.textContent = name;
      li.style.padding = "6px 10px";
      li.style.borderRadius = "8px";

      if (index === currentBatchIndex) {
        li.style.background = "rgba(253, 216, 53, 0.15)";
        li.style.color = "#fdd835";
        li.style.fontWeight = "bold";
      } else if (index < currentBatchIndex) {
        li.style.opacity = "0.4";
        li.style.textDecoration = "line-through";
      }
      queueList.appendChild(li);
    });
  };

  if (isBatch && batchIds.length > 0) {
    selectedId = batchIds[0];
    document.title = "Actualizando programas - StormStore";
  }

  const navButtons = [
    backBtn,
    document.getElementById("open-updates"),
    document.getElementById("open-licenses"),
    document.getElementById("open-info"),
    document.getElementById("open-settings-header"),
    document.getElementById("open-big-picture"),
  ].filter(Boolean);

  const disableNavigation = (disable) => {
    navButtons.forEach((btn) => {
      btn.disabled = disable;
      btn.style.pointerEvents = disable ? "none" : "auto";
      if (disable) {
        btn.classList.add("disabled");
      } else {
        btn.classList.remove("disabled");
      }
    });

    if (disable) {
      window.onbeforeunload = (event) => {
        event.preventDefault();
        event.returnValue =
          "La instalación está en curso. Debes esperar a que termine.";
      };
    } else {
      window.onbeforeunload = null;
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === null || bytes === undefined || isNaN(bytes)) return "-";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    let value = bytes;
    while (value >= 1024 && i < sizes.length - 1) {
      value /= 1024;
      i += 1;
    }
    return `${value.toFixed(1)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond || isNaN(bytesPerSecond)) return "0 B/s";
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  const setStatus = (message) => {
    statusText.textContent = message;
  };

  const updateProgressUI = (progress) => {
    if (selectedId !== progress.id) return;
    const percent = progress.percent || 0;
    window.api.setProgressBar(percent);

    if (titleText) {
      if (progress.phase === "extract") {
        titleText.textContent = `${currentAppName} - Descomprimiendo...`;
      } else if (progress.phase === "download") {
        titleText.textContent = `${currentAppName} - Descargando...`;
      }
    }

    progressFill.style.width = `${Math.min(100, Math.max(0, percent * 100))}%`;
    downloadedText.textContent = formatBytes(progress.downloaded || 0);
    totalText.textContent =
      totalSize > 0
        ? formatBytes(totalSize)
        : progress.total
          ? formatBytes(progress.total)
          : "--";
    speedText.textContent = formatSpeed(progress.speed);
    setStatus(progress.message || "Procesando...");
  };

  const loadQueueData = async () => {
    try {
      const [apps, files] = await Promise.all([
        window.api.getApps(),
        window.api.getFilesApps(),
      ]);
      const all = [...apps, ...(files || [])];
      const ids = isBatch ? batchIds : [selectedId];
      ids.filter(Boolean).forEach((id) => {
        const found = all.find((a) => a.id === id);
        if (found) queueNames[id] = found.name;
      });
      updateQueueUI();
    } catch (e) {
      console.error("Error loading queue names:", e);
    }
  };

  const getFileSize = async (url) => {
    const response = await fetch(url, { method: "HEAD" });
    const contentLength = response.headers.get("content-length");
    return contentLength ? parseInt(contentLength, 10) : 0;
  };

  const fetchProgramInfo = async () => {
    try {
      const files = await window.api.getFilesApps();
      const fileApp = files.find((f) => f.id === selectedId);
      currentAppName = fileApp ? fileApp.name : selectedId;
      if (fileApp && fileApp.files && Array.isArray(fileApp.files)) {
        totalSize = 0;
        for (const file of fileApp.files) {
          try {
            const size = await getFileSize(fileApp.downloadUrl + file);
            totalSize += size;
          } catch (e) {
            console.error("Error getting size for", file, e);
          }
        }
      }

      if (isBatch) {
        const total = batchIds.length;
        const current = currentBatchIndex + 1;
        if (titleText)
          titleText.textContent = `${currentAppName} - Descargando...`;
        setStatus(`Actualizando ${current} de ${total}: ${currentAppName}`);
      } else {
        if (titleText)
          titleText.textContent = `${currentAppName} - Descargando...`;
        setStatus("Iniciando descarga...");
      }
      updateProgressUI({
        downloaded: 0,
        total: totalSize,
        percent: 0,
        speed: 0,
      });
    } catch (err) {
      console.error("Error fetching program info:", err);
    }
  };

  const startInstall = async () => {
    if (!selectedId || isInstalling) return;

    isInstalling = true;
    disableNavigation(true);
    setStatus("Iniciando descarga...");
    progressFill.style.width = "0%";

    try {
      await window.api.installProgramById(selectedId);
      setStatus("Instalación finalizada correctamente.");
      if (titleText) titleText.textContent = `${currentAppName} - Completado`;
      progressFill.style.width = "100%";
      window.api.setProgressBar(-1);
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message || "Falló la instalación"}`);
      window.api.setProgressBar(-1);
    } finally {
      isInstalling = false;
      disableNavigation(false);
    }
  };

  window.api.onInstallProgress((_event, progress) => {
    updateProgressUI(progress);
  });

  window.api.onInstallError((_event, error) => {
    if (error?.id !== selectedId) return;
    setStatus(error.message || "Error durante la instalación.");
    window.api.setProgressBar(-1);
    if (isBatch) {
      disableNavigation(false);
    }
  });

  window.api.onInstallComplete((_event, info, legacyId) => {
    // Normalizar argumentos para soportar objeto unificado o argumentos posicionales antiguos
    const success = typeof info === "boolean" ? info : info?.success !== false;
    const id = typeof info === "boolean" ? legacyId : info?.id;
    const message =
      typeof info === "object" ? info.message : "Instalación completada.";

    if (id !== selectedId) return;

    setStatus(message);
    if (titleText) titleText.textContent = `${currentAppName} - Completado`;
    progressFill.style.width = "100%";
    window.api.setProgressBar(-1);

    if (success) {
      currentBatchIndex++;
      updateQueueUI();

      if (isBatch) {
        if (currentBatchIndex < batchIds.length) {
          selectedId = batchIds[currentBatchIndex];
          fetchProgramInfo().then(() => {
            setTimeout(() => startInstall(), 1000);
          });
        } else {
          setStatus("Todas las actualizaciones completadas.");
          disableNavigation(false);
        }
      } else {
        disableNavigation(false);
      }
    } else {
      setStatus("Error en la instalación");
      disableNavigation(false);
    }
  });

  window.api.onShowVirusAlert(async (_event, appName) => {
    const result = await showVirusConfirm(appName);
    window.api.sendVirusAlertResponse(result);
  });

  const versionElem = document.getElementById("app-version");
  if (versionElem) {
    window.api.getAppVersion().then((v) => (versionElem.textContent = "v" + v));
  }

  window.api.setDiscordActivity({
    details: "Descargando programa",
    state: "Instalación en curso",
  });

  backBtn.addEventListener("click", () => {
    if (!isInstalling) {
      window.location.href = "index.html";
    }
  });

  document.getElementById("open-updates")?.addEventListener("click", () => {
    if (!isInstalling) window.location.href = "updates.html";
  });
  document.getElementById("open-licenses")?.addEventListener("click", () => {
    if (!isInstalling) window.location.href = "licencias.html";
  });
  document.getElementById("open-info")?.addEventListener("click", () => {
    if (!isInstalling) window.location.href = "info.html";
  });
  document
    .getElementById("open-settings-header")
    ?.addEventListener("click", () => {
      if (!isInstalling) window.location.href = "settings.html";
    });
  document.getElementById("open-big-picture")?.addEventListener("click", () => {
    if (!isInstalling) window.api.openBigPicture();
  });

  // Auto-start installation if ID is provided
  if (selectedId) {
    await loadQueueData();
    await fetchProgramInfo();
    startInstall();
  } else {
    setStatus("No se especificó programa a descargar.");
  }
});
