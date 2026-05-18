const appsContainer = document.getElementById("apps");
const catContainer = document.getElementById("categories");
const title = document.getElementById("current-category");
const versionElem = document.getElementById("app-version");
const searchInput = document.getElementById("search");
const refreshBtn = document.getElementById("refresh-btn");
const filterInstalled = document.getElementById("filter-installed");
const filterUpdates = document.getElementById("filter-updates");

let allApps = [];
let currentCategory = "Todas";
let currentSearch = "";
let showOnlyInstalled = false;
let showOnlyUpdates = false;
const installingApps = new Set();
const uninstallingApps = new Set();

// Discord RPC
window.api.setDiscordActivity({
  details: "Explorando aplicaciones",
  state: "Navegando",
});

function playSound(soundFile) {
  new Audio(`../assets/media/sounds/${soundFile}`).play();
}

function showToast(message, duration = 3000) {
  let toast = document.getElementById("toast-notification");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notification";
    toast.className = "toast-notification";
    document.body.appendChild(toast);
  }
  playSound("toast.mp3");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// Mostrar versión automáticamente
if (versionElem) {
  window.api.getAppVersion().then((v) => {
    versionElem.textContent = "v" + v;
  });
}

// Renderizar tarjetas vacías (Skeletons) mientras carga
function renderSkeletons() {
  appsContainer.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "card skeleton";
    skeleton.innerHTML = `
      <div class="img-container skeleton-box"></div>
      <div class="skeleton-text title"></div>
      <div class="skeleton-text body"></div>
    `;
    appsContainer.appendChild(skeleton);
  }
}

// Cargar apps y renderizar
async function load(force = false) {
  if (force && refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.classList.add("spinning");
    renderSkeletons();
  }
  try {
    // Si es una carga forzada (clic en el botón), sincronizamos con el servidor primero
    if (force) {
      await window.api.syncRemoteData();
    }

    const syncPromise = force
      ? new Promise((r) => setTimeout(r, 1000))
      : Promise.resolve();
    const [newApps, filesApps] = await Promise.all([
      window.api.getApps(),
      window.api.getFilesApps(),
      syncPromise,
    ]);

    const fileAppsById = new Map(
      (filesApps || []).map((fileApp) => [fileApp.id, fileApp]),
    );
    const mergedApps = newApps.map((app) => ({
      ...app,
      fileApp: fileAppsById.get(app.id),
    }));

    // Check for updates on installed fileApps
    const checksumChecks = mergedApps
      .filter((app) => app.fileApp && app.installed)
      .map(async (app) => {
        try {
          const result = await window.api.checkChecksum(app.id);
          app.updateAvailable = result.needsUpdate;
        } catch (e) {
          console.error("Error checking checksum for", app.id, e);
          app.updateAvailable = false;
        }
      });
    await Promise.all(checksumChecks);

    const versionChecks = mergedApps
      .filter((app) => app.fileApp && app.installed)
      .map(async (app) => {
        try {
          app.installedVersion = await window.api.getInstalledFileAppVersion(app.id);
        } catch (e) {
          console.error("Error reading installed version for", app.id, e);
          app.installedVersion = null;
        }
      });
    await Promise.all(versionChecks);

    // Show/hide update all button
    const hasUpdates = mergedApps.some((app) => app.updateAvailable);
    const updateAllBtn = document.getElementById("update-all-btn");
    if (updateAllBtn) {
      updateAllBtn.style.display = hasUpdates ? "block" : "none";
      updateAllBtn.onclick = () => {
        const ids = mergedApps
          .filter((app) => app.updateAvailable)
          .map((app) => app.id)
          .join(",");
        window.location.href = `program-updates.html?batch=true&ids=${ids}`;
      };
    }

    // Mostrar/ocultar filtro de actualizaciones
    const updatesFilterContainer = document.getElementById(
      "updates-filter-container",
    );
    if (updatesFilterContainer) {
      updatesFilterContainer.style.display = hasUpdates ? "flex" : "none";
      // Si el filtro estaba activo pero ya no hay actualizaciones, lo desactivamos
      if (!hasUpdates && showOnlyUpdates) {
        showOnlyUpdates = false;
        if (filterUpdates) filterUpdates.checked = false;
        updatesFilterContainer.classList.remove("active");
        renderApps(currentCategory);
      }
    }

    // Comprobación inteligente de cambios: Ignoramos el campo 'icon' para evitar
    // que la descarga de imágenes en segundo plano dispare la animación de la UI constantemente.
    const stripIcons = (apps) => apps.map(({ icon, ...rest }) => ({ ...rest }));
    const structuralChange =
      JSON.stringify(stripIcons(mergedApps)) !==
      JSON.stringify(stripIcons(allApps));
    const hasChanged = force || structuralChange;

    if (hasChanged) {
      allApps = mergedApps;
      renderCategories();
      if (searchInput && searchInput.value !== currentSearch)
        searchInput.value = currentSearch;
      renderApps(currentCategory);
    } else {
      // Actualizamos los datos internamente pero sin re-renderizar la UI (evita el flash/animación)
      allApps = mergedApps;
    }
  } catch (err) {
    console.error("Error loading apps:", err);
    showToast("Error cargando aplicaciones. Intenta recargar.");
    // Forzar renderizado vacío para quitar skeletons
    allApps = [];
    renderCategories();
    renderApps(currentCategory);
  } finally {
    if (force && refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.classList.remove("spinning");
    }
  }
}

// Renderizar categorías
function renderCategories() {
  catContainer.innerHTML = "";
  const allCats = allApps.flatMap((a) =>
    Array.isArray(a.category) ? a.category : [a.category],
  );
  const cats = ["Todas", ...new Set(allCats)];
  cats.forEach((cat) => {
    const li = document.createElement("li");
    li.textContent = cat;
    if (cat === currentCategory) li.classList.add("active");
    li.onclick = () => renderApps(cat);
    catContainer.appendChild(li);
  });
}

// Renderizar apps
function renderApps(category) {
  const updateDOM = () => {
    if (category) currentCategory = category;
    renderCategories();
    title.textContent = currentCategory;
    appsContainer.innerHTML = "";

    allApps
      .filter((a) => {
        // Filtrado por categoría
        if (currentCategory !== "Todas") {
          if (Array.isArray(a.category)) {
            if (!a.category.includes(currentCategory)) return false;
          } else if (a.category !== currentCategory) return false;
        }

        // Filtrado por instaladas
        if (showOnlyInstalled && !a.installed) return false;

        // Filtrado por actualizaciones
        if (showOnlyUpdates && !a.updateAvailable) return false;

        // Filtrado por búsqueda
        if (!currentSearch) return true;
        const q = currentSearch.toLowerCase();
        const name = (a.name || "").toLowerCase();
        const desc = (a.description || "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      })
      .forEach((app, index) =>
        appsContainer.appendChild(createAppCard(app, index)),
      );
  };

  if (
    category &&
    category !== currentCategory &&
    document.startViewTransition
  ) {
    document.startViewTransition(updateDOM);
  } else {
    updateDOM();
  }
}

// Función auxiliar para crear la tarjeta de una app (Lógica extraída)
function createAppCard(app, index) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.animationDelay = `${index * 50}ms`;

  if (app.wifi === "si") card.classList.add("requires-wifi");

  const imgContainer = document.createElement("div");
  imgContainer.className = "img-container";
  imgContainer.style.cursor = "pointer";
  imgContainer.onclick = () => (window.location.href = `app.html?id=${app.id}`);

  const icon = document.createElement("img");
  icon.src = app.icon;
  icon.className = "app-icon";
  icon.onerror = () => (icon.src = "../assets/icons/not-found.svg");
  imgContainer.appendChild(icon);

  // Badges
  if (app.verified === "true")
    imgContainer.appendChild(
      createBadge(
        "Verificado",
        "../assets/icons/verified.svg",
        "verified-req-badge",
      ),
    );
  if (app.steam === "si")
    imgContainer.appendChild(
      createBadge("Steam", "../assets/icons/steam.svg", "steam-req-badge"),
    );
  if (app.wifi === "si")
    imgContainer.appendChild(
      createBadge("WiFi", "../assets/icons/wifi.svg", "wifi-req-badge"),
    );
  if (app["virus-alert"] === "alert")
    imgContainer.appendChild(
      createBadge("Virus", "../assets/icons/virus.svg", "virus-req-badge"),
    );

  const sinWifi = document.createElement("img");
  sinWifi.src = "../assets/icons/sin-wifi.svg";
  sinWifi.className = "wifi-badge";
  imgContainer.appendChild(sinWifi);

  const infoBadge = document.createElement("img");
  infoBadge.src = "../assets/icons/info.svg";
  infoBadge.className = "info-badge";
  imgContainer.appendChild(infoBadge);

  // Botones de acción rápidos en la parte superior derecha (Web y Compartir)
  const rightActions = [];
  rightActions.push({
    icon: "../assets/icons/web.svg",
    text: "Web",
    onClick: () => window.open(`https://stormstore.vercel.app/app/${app.id}`),
  });
  if (app["share-compatibility"] === "si") {
    rightActions.push({
      icon: "../assets/icons/share.svg",
      text: "Compartir",
      onClick: () => {
        playSound("others.mp3");
        navigator.clipboard.writeText(
          `Juega conmigo a https://stormstore.vercel.app/app/${app.id}/run`,
        );
        showToast("Enlace copiado");
      },
    });
  }

  rightActions.forEach((action, i) => {
    const btn = createBadge(action.text, action.icon, "action-btn-badge");
    btn.style.left = "auto";
    btn.style.right = "8px";
    btn.style.top = `${8 + i * 36}px`; // Apilados verticalmente con 4px de gap
    btn.style.cursor = "pointer";
    const icon = btn.querySelector("img");
    if (icon) icon.style.filter = "invert(1)"; // Asegurar que iconos negros se vean blancos
    btn.onclick = (e) => {
      e.stopPropagation();
      action.onClick();
    };
    imgContainer.appendChild(btn);
  });

  const name = document.createElement("h3");
  name.textContent = app.name;

  let installedVersionElement = null;
  if (app.installedVersion) {
    installedVersionElement = document.createElement("p");
    installedVersionElement.className = "version installed-version";
    installedVersionElement.textContent = `Versión instalada: ${app.installedVersion}`;
  }

  const desc = document.createElement("p");
  desc.textContent = app.description;

  const actions = document.createElement("div");
  actions.className = "card-actions";

  if (app.installed) {
    const isUninstalling = uninstallingApps.has(app.id);
    const hasUninstaller = app.uninstall && app.uninstallExists;
    const isGame =
      (Array.isArray(app.category)
        ? app.category.includes("Juegos")
        : app.category === "Juegos") ||
      app.id.startsWith("steam-") ||
      app.id.startsWith("epic-");

    if (isUninstalling) {
      const loadingBtn = document.createElement("button");
      loadingBtn.className = "md-btn md-btn-danger";
      loadingBtn.style.width = "100%";
      loadingBtn.disabled = true;
      const label = hasUninstaller ? "Desinstalando..." : "Eliminando...";
      loadingBtn.innerHTML = `<span class="button-loading"><img src="../assets/icons/loading-new.svg"> ${label}</span>`;
      actions.appendChild(loadingBtn);
    } else {
      // Fila 1: [Abrir/Jugar] [Ubicación]
      const row1 = document.createElement("div");
      row1.style.display = "flex";
      row1.style.gap = "8px";
      row1.style.width = "100%";

      const openBtn = document.createElement("button");
      openBtn.textContent = isGame ? "Jugar" : "Abrir";
      openBtn.className = "md-btn md-btn-filled";
      openBtn.style.flex = "1";
      openBtn.onclick = () =>
        window.api.openApp(
          app.fileApp?.executablePath || app.executablePath || app.paths[0],
          app.steam === "si",
        );
      row1.appendChild(openBtn);

      const locBtn = document.createElement("button");
      locBtn.textContent = "Ubicación";
      locBtn.className = "md-btn md-btn-blue";
      locBtn.style.flex = "1";
      locBtn.onclick = () => {
        playSound("others.mp3");
        window.api.openAppLocation(
          app.fileApp?.executablePath ||
            app.installPath ||
            app.executablePath ||
            app.paths[0],
        );
        showToast("Abriendo ubicación...");
      };
      row1.appendChild(locBtn);
      actions.appendChild(row1);

      // Fila 2: [Eliminar/Desinstalar] [Actualizar/Reinstalar]
      const row2 = document.createElement("div");
      row2.style.display = "flex";
      row2.style.gap = "8px";
      row2.style.width = "100%";

      const uninstallBtn = document.createElement("button");
      uninstallBtn.className = "md-btn md-btn-danger";
      uninstallBtn.style.flex = "1";
      uninstallBtn.textContent = hasUninstaller ? "Desinstalar" : "Eliminar";
      uninstallBtn.onclick = async (e) => {
        e.stopPropagation();

        const confirmed = await showDeleteConfirm(app, hasUninstaller);
        if (!confirmed) return;

        uninstallingApps.add(app.id);
        playSound("others.mp3");
        showToast(
          hasUninstaller
            ? `Desinstalando ${app.name}…`
            : `Eliminando archivos de ${app.name}…`,
        );
        renderApps(currentCategory);
        try {
          if (hasUninstaller) await window.api.uninstallApp(app.uninstall);
          else await window.api.deleteAppFolder(app.paths[0]);
          playSound("finish.mp3");
        } catch (error) {
          if (!error.message.includes("INSTALL_CANCELLED"))
            console.error(error);
        } finally {
          uninstallingApps.delete(app.id);
          renderApps(currentCategory);
          await load();
        }
      };
      row2.appendChild(uninstallBtn);

      const updateBtn = document.createElement("button");
      updateBtn.textContent = app.updateAvailable ? "Actualizar" : "Reinstalar";
      updateBtn.style.flex = "1";
      if (app.updateAvailable) {
        updateBtn.className = "md-btn";
        updateBtn.style.backgroundColor = "#4caf50"; // Verde
        updateBtn.style.color = "#000";
      } else {
        updateBtn.className = "md-btn md-btn-danger"; // Rojo
      }

      updateBtn.onclick = async () => {
        if (app.fileApp) {
          if (app["virus-alert"] === "alert") {
            const confirmed = await showVirusConfirm(app.name);
            if (!confirmed) return;
          }
          window.location.href = `program-updates.html?id=${encodeURIComponent(app.id)}`;
          return;
        }
        installingApps.add(app.id);
        playSound("others.mp3");
        showToast(
          `${app.updateAvailable ? "Actualizando" : "Reinstalando"} ${app.name}…`,
        );
        renderApps(currentCategory);
        try {
          await window.api.installApp(app);
          playSound("finish.mp3");
        } catch (e) {
          if (!e.message.includes("INSTALL_CANCELLED")) console.error(e);
        } finally {
          installingApps.delete(app.id);
          renderApps(currentCategory);
          await load();
        }
      };
      if (installingApps.has(app.id)) {
        updateBtn.disabled = true;
        updateBtn.innerHTML = `<span class="button-loading"><img src="../assets/icons/loading-new.svg"></span>`;
      }
      row2.appendChild(updateBtn);
      actions.appendChild(row2);
    }
  } else {
    // Modo No Instalado
    const installRow = document.createElement("div");
    installRow.style.display = "flex";
    installRow.style.gap = "8px";
    installRow.style.width = "100%";

    const installBtn = document.createElement("button");
    installBtn.className = "md-btn md-btn-filled";
    installBtn.style.flex = "1";

    if (installingApps.has(app.id)) {
      installBtn.disabled = true;
      installBtn.innerHTML = `<span class="button-loading"><img src="../assets/icons/loading-new.svg"> Instalando...</span>`;
    } else {
      installBtn.textContent = "Instalar";
      installBtn.onclick = async () => {
        if (app.fileApp) {
          if (app["virus-alert"] === "alert") {
            const confirmed = await showVirusConfirm(app.name);
            if (!confirmed) return;
          }
          showToast(`Abriendo gestor de descargas para ${app.name}…`);
          window.location.href = `program-updates.html?id=${encodeURIComponent(app.id)}`;
          return;
        }

        installingApps.add(app.id);
        playSound("others.mp3");
        showToast(`Iniciando descarga e instalación de ${app.name}…`);
        renderApps(currentCategory);
        try {
          await window.api.installApp(app);
          playSound("finish.mp3");
        } catch (e) {
          if (!e.message.includes("INSTALL_CANCELLED")) console.error(e);
        } finally {
          installingApps.delete(app.id);
          renderApps(currentCategory); // Actualizar UI inmediatamente
          await load();
        }
      };
    }
    installRow.appendChild(installBtn);

    actions.appendChild(installRow);
  }

  card.append(imgContainer, name);
  if (installedVersionElement) card.append(installedVersionElement);
  card.append(desc, actions);
  return card;
}

// Funciones auxiliares de creación de UI
function createBadge(text, iconSrc, className) {
  const badge = document.createElement("div");
  badge.className = `req-badge ${className}`;
  badge.innerHTML = `<img src="${iconSrc}"><span>${text}</span>`;
  return badge;
}

async function showDeleteConfirm(app, hasUninstaller) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("delete-confirm-overlay");
    const confirmBtn = document.getElementById("confirm-delete-btn");
    const cancelBtn = document.getElementById("cancel-delete-btn");
    const text = document.getElementById("delete-confirm-text");
    const title = overlay.querySelector("h2");

    if (hasUninstaller) {
      title.textContent = "¿Desinstalar aplicación?";
      text.innerHTML = `¿Estás seguro de que quieres desinstalar <strong>${app.name}</strong>? Se abrirá el desinstalador oficial del programa.`;
      confirmBtn.textContent = "Desinstalar";
    } else {
      title.textContent = "¿Eliminar aplicación?";
      text.innerHTML = `¿Estás seguro de que quieres eliminar completamente <strong>${app.name}</strong>?<br><br>Esta acción borrará la carpeta de instalación de forma permanente.`;
      confirmBtn.textContent = "Eliminar";
    }

    overlay.classList.add("active");

    const cleanup = () => {
      overlay.classList.remove("active");
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      overlay.onclick = null;
    };

    confirmBtn.onclick = () => {
      cleanup();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    };
  });
}

async function showVirusConfirm(appName) {
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
}

window.api.onShowVirusAlert(async (_event, appName) => {
  const result = await showVirusConfirm(appName);
  window.api.sendVirusAlertResponse(result);
});

function createIconButton(iconSrc, onClick) {
  const btn = document.createElement("button");
  btn.className = "md-btn md-btn-tonal";
  btn.style.flex = "1";
  btn.style.padding = "10px 12px";
  btn.innerHTML = `<img src="${iconSrc}" style="width: 20px; height: 20px; filter: invert(1);">`;
  btn.onclick = (e) => {
    e.stopPropagation();
    onClick();
  };
  return btn;
}

window.api.onShowToast((_event, message, duration) => {
  showToast(message, duration);
});

// Inicializar
load(true); // Carga inicial forzada
setInterval(() => load(false), 3000); // Comprobación silenciosa cada 3s

if (refreshBtn) {
  refreshBtn.addEventListener("click", () => load(true));
}

// Filtrado desde la barra de búsqueda
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value || "";
    renderApps(currentCategory);
  });
}

// Filtrado por apps instaladas
if (filterInstalled) {
  filterInstalled.addEventListener("change", (e) => {
    showOnlyInstalled = e.target.checked;
    filterInstalled
      .closest(".sidebar-filter-item")
      .classList.toggle("active", showOnlyInstalled);
    renderApps(currentCategory);
  });
  // Permitir clic en todo el contenedor
  filterInstalled
    .closest(".sidebar-filter-item")
    .addEventListener("click", (e) => {
      if (e.target !== filterInstalled && e.target.tagName !== "LABEL") {
        filterInstalled.click();
      }
    });
}

// Filtrado por apps con actualizaciones
if (filterUpdates) {
  filterUpdates.addEventListener("change", (e) => {
    showOnlyUpdates = e.target.checked;
    filterUpdates
      .closest(".sidebar-filter-item")
      .classList.toggle("active", showOnlyUpdates);
    renderApps(currentCategory);
  });
  filterUpdates
    .closest(".sidebar-filter-item")
    .addEventListener("click", (e) => {
      if (e.target !== filterUpdates && e.target.tagName !== "LABEL") {
        filterUpdates.click();
      }
    });
}

// Footer links
document
  .querySelectorAll(".sidebar-footer button[data-link]")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-link");
      window.open(url);
    });
  });

// Overlay internet
function updateInternetStatus() {
  const overlay = document.getElementById("no-internet-overlay");
  fetch("https://www.google.com", { mode: "no-cors" })
    .then(() => {
      if (overlay) overlay.style.display = "none";
      document.body.classList.remove("offline");
    })
    .catch(() => {
      if (overlay) overlay.style.display = "none"; // Ocultamos el overlay completo para mostrar los iconos oscuros
      document.body.classList.add("offline");
    });
}

updateInternetStatus();
setInterval(updateInternetStatus, 1000);
