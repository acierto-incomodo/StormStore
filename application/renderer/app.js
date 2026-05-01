const appsContainer = document.getElementById("apps");
const catContainer = document.getElementById("categories");
const title = document.getElementById("current-category");
const versionElem = document.getElementById("app-version");
const searchInput = document.getElementById("search");
const refreshBtn = document.getElementById("refresh-btn");

let allApps = [];
let currentCategory = "Todas";
let currentSearch = "";
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
  }

  const showSkeleton = allApps.length === 0;
  if (showSkeleton) {
    renderSkeletons();
  } else {
    renderCategories();
    renderApps(currentCategory);
  }

  try {
    // Si es una carga forzada (clic en el botón), sincronizamos con el servidor en segundo plano.
    // No bloqueamos la UI ni dejamos el botón girando demasiado tiempo.
    if (force) {
      window.api
        .syncRemoteData()
        .then(() => {
          load(false);
        })
        .catch((syncError) => {
          console.warn("syncRemoteData failed, using local cache:", syncError);
          showToast("No se pudo actualizar. Cargando catálogo local…", 4000);
        });
    }

    // Sincronizar descargas activas desde el backend
    const activeDownloads = await window.api.getAllDownloads();
    installingApps.clear();
    activeDownloads.forEach((d) => {
      if (d.status !== "completed" && d.status !== "error")
        installingApps.add(d.id);
    });

    const newApps = await window.api.getApps();

    // Comprobación inteligente de cambios: Ignoramos el campo 'icon' para evitar
    // que la descarga de imágenes en segundo plano dispare la animación de la UI constantemente.
    const stripIcons = (apps) => apps.map(({ icon, ...rest }) => ({ ...rest }));
    const structuralChange =
      JSON.stringify(stripIcons(newApps)) !==
      JSON.stringify(stripIcons(allApps));
    const hasChanged = force || structuralChange;

    if (hasChanged) {
      allApps = newApps;
      renderCategories();
      if (searchInput && searchInput.value !== currentSearch)
        searchInput.value = currentSearch;
      renderApps(currentCategory);
    } else {
      // Actualizamos los datos internamente pero sin re-renderizar la UI (evita el flash/animación)
      allApps = newApps;
    }
  } catch (error) {
    console.error("Error loading apps:", error);
    // Si hay error, intentar renderizar con datos anteriores o mostrar mensaje
    if (allApps.length > 0) {
      renderCategories();
      renderApps(currentCategory);
    } else {
      // Mostrar mensaje de error
      appsContainer.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #fff;">
          <h2>Error al cargar aplicaciones</h2>
          <p>Revisa tu conexión a internet e intenta de nuevo.</p>
          <button class="md-btn md-btn-filled" onclick="load(true)">Reintentar</button>
        </div>
      `;
    }
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

  const name = document.createElement("h3");
  name.textContent = app.name;

  const desc = document.createElement("p");
  desc.textContent = app.description;

  const actions = document.createElement("div");
  actions.className = "card-actions";

  if (app.installed) {
    const isUninstalling = uninstallingApps.has(app.id);
    const isInstalling = installingApps.has(app.id);
    const topRow = document.createElement("div");
    topRow.style.display = "flex";
    topRow.style.gap = "8px";
    topRow.style.width = "100%";

    const openBtn = document.createElement("button");
    // PRIORIDAD: Si hay actualización disponible, mostrar botón Actualizar
    openBtn.textContent = app.updateAvailable ? "Actualizar" : "Abrir";
    openBtn.className = app.updateAvailable
      ? "md-btn md-btn-filled highlight-update"
      : "md-btn md-btn-filled";
    openBtn.style.flex = "1";

    if (app.updateAvailable) {
      if (isInstalling) {
        openBtn.disabled = true;
        openBtn.innerHTML = `<span class="button-loading"><img src="../assets/icons/loading-new.svg"> Actualizando...</span>`;
      } else {
        openBtn.onclick = async (e) => {
          e.stopPropagation();
          installingApps.add(app.id);
          playSound("others.mp3");
          showToast(`Actualizando ${app.name}…`);
          renderApps(currentCategory);
          try {
            await window.api.installApp(app);
            playSound("finish.mp3");
          } catch (e) {
            console.error(e);
          } finally {
            installingApps.delete(app.id);
            renderApps(currentCategory);
            await load();
          }
        };
      }
    } else {
      openBtn.onclick = () =>
        window.api.openApp(
          app.executablePath || app.paths[0],
          app.steam === "si",
        );
    }

    if (isUninstalling) openBtn.style.display = "none";
    topRow.appendChild(openBtn);

    const uninstallBtn = document.createElement("button");
    uninstallBtn.className = "md-btn md-btn-danger";
    uninstallBtn.style.flex = "1";

    if (isUninstalling) {
      uninstallBtn.disabled = true;
      uninstallBtn.innerHTML = `<span class="button-loading"><img src="../assets/icons/loading-new.svg"> Eliminando...</span>`;
    } else {
      const hasUninstaller = app.uninstall && app.uninstallExists;
      uninstallBtn.textContent = hasUninstaller ? "Desinstalar" : "Eliminar";
      uninstallBtn.onclick = async (e) => {
        e.stopPropagation();
        if (!hasUninstaller && !confirm("¿Eliminar carpeta de la aplicación?"))
          return;

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
          renderApps(currentCategory); // Actualizar UI inmediatamente
          await load();
        }
      };
    }
    topRow.appendChild(uninstallBtn);
    actions.appendChild(topRow);

    // Botones secundarios
    const middleRow = document.createElement("div");
    middleRow.style.display = "flex";
    middleRow.style.gap = "8px";
    middleRow.style.width = "100%";

    if (app["share-compatibility"] === "si") {
      const shareBtn = createIconButton("../assets/icons/share.svg", () => {
        playSound("others.mp3");
        navigator.clipboard.writeText(
          `Juega conmigo a https://stormstore.vercel.app/app/${app.id}/run`,
        );
        showToast("Enlace copiado");
      });
      if (isUninstalling) shareBtn.style.display = "none";
      middleRow.appendChild(shareBtn);
    }

    const webBtn = createIconButton("../assets/icons/web.svg", () =>
      window.open(`https://stormstore.vercel.app/app/${app.id}`),
    );
    if (isUninstalling) webBtn.style.display = "none";
    middleRow.appendChild(webBtn);
    actions.appendChild(middleRow);

    const locBtn = document.createElement("button");
    locBtn.textContent = "Ubicación";
    locBtn.className = "md-btn md-btn-blue";
    locBtn.style.width = "100%";
    locBtn.onclick = () => {
      playSound("others.mp3");
      window.api.openAppLocation(
        app.installPath || app.executablePath || app.paths[0],
      );
      showToast("Abriendo ubicación...");
    };
    if (isUninstalling) locBtn.style.display = "none";
    actions.appendChild(locBtn);
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

    if (app["share-compatibility"] === "si") {
      installRow.appendChild(
        createIconButton("../assets/icons/share.svg", () => {
          navigator.clipboard.writeText(
            `https://stormstore.vercel.app/app/${app.id}/run`,
          );
          showToast("Enlace copiado");
        }),
      );
    }
    installRow.appendChild(
      createIconButton("../assets/icons/web.svg", () =>
        window.open(`https://stormstore.vercel.app/app/${app.id}`),
      ),
    );
    actions.appendChild(installRow);
  }

  card.append(imgContainer, name, desc, actions);
  return card;
}

// Funciones auxiliares de creación de UI
function createBadge(text, iconSrc, className) {
  const badge = document.createElement("div");
  badge.className = `req-badge ${className}`;
  badge.innerHTML = `<img src="${iconSrc}"><span>${text}</span>`;
  return badge;
}

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
load(true); // Al entrar a index.html siempre cargamos como si fuera el inicio del programa

if (refreshBtn) {
  refreshBtn.addEventListener("click", () => load(true));
}

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    load(true);
  }
});

// Filtrado desde la barra de búsqueda
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value || "";
    renderApps(currentCategory);
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

// Controles de ventana
document
  .getElementById("min-btn")
  ?.addEventListener("click", () => window.api.minimizeWindow());
document
  .getElementById("close-btn")
  ?.addEventListener("click", () => window.api.closeWindow());

const maxBtn = document.getElementById("max-btn");
if (maxBtn) {
  maxBtn.addEventListener("click", () => window.api.maximizeWindow());

  // Estado inicial
  window.api.isMaximized().then((isMax) => {
    if (isMax) maxBtn.textContent = "❐";
  });

  window.api.onWindowMaximized(() => (maxBtn.textContent = "❐"));
  window.api.onWindowRestored(() => (maxBtn.textContent = "◻"));
}
