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
  state: "Navegando"
});

function playSound(soundFile) {
  new Audio(`../assets/media/sounds/${soundFile}`).play();
}

function showToast(message) {
  let toast = document.getElementById("toast-notification");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notification";
    toast.className = "toast-notification";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Mostrar versión automáticamente
if (versionElem) {
  window.api.getAppVersion().then((v) => {
    versionElem.textContent = "v" + v;
  });
}

// Cargar apps y renderizar
async function load(force = false) {
  if (force && refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.classList.add("spinning");
  }
  try {
    const [newApps] = await Promise.all([
      window.api.getApps(),
      force ? new Promise((r) => setTimeout(r, 1000)) : Promise.resolve(),
    ]);

    // Solo actualizamos si forzamos (botón) o si los datos han cambiado (ej. instalación detectada en disco)
    const hasChanged = force || JSON.stringify(newApps) !== JSON.stringify(allApps);

    if (hasChanged) {
      allApps = newApps;
      renderCategories();
      if (searchInput && searchInput.value !== currentSearch) searchInput.value = currentSearch;
      renderApps(currentCategory);
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
    li.onclick = () => renderApps(cat);
    catContainer.appendChild(li);
  });
}

// Renderizar apps
function renderApps(category) {
  if (category) currentCategory = category;
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
    .forEach((app, index) => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.animationDelay = `${index * 50}ms`; // Staggered animation

      if (app.wifi === "si") {
        card.classList.add("requires-wifi");
      }

      const imgContainer = document.createElement("div");
      imgContainer.className = "img-container";
      imgContainer.style.cursor = "pointer";
      imgContainer.onclick = () => {
        window.location.href = `app.html?id=${app.id}`;
      };

      const icon = document.createElement("img");
      icon.src = app.icon;
      icon.className = "app-icon";
      imgContainer.appendChild(icon);

      // --- Badges de Requisitos ---
      if (app.steam === "si") {
        const steamBadge = document.createElement("div");
        steamBadge.className = "req-badge steam-req-badge";
        
        const steamIcon = document.createElement("img");
        steamIcon.src = "../assets/icons/steam.svg";
        
        const steamText = document.createElement("span");
        steamText.textContent = "Steam";
        
        steamBadge.append(steamIcon, steamText);
        imgContainer.appendChild(steamBadge);
      }

      if (app.wifi === "si") {
        const wifiBadge = document.createElement("div");
        wifiBadge.className = "req-badge wifi-req-badge";
        
        const wifiIcon = document.createElement("img");
        wifiIcon.src = "../assets/icons/wifi.svg";
        
        const wifiText = document.createElement("span");
        wifiText.textContent = "WiFi";
        
        wifiBadge.append(wifiIcon, wifiText);
        imgContainer.appendChild(wifiBadge);
      }

      const wifiBadge = document.createElement("img");
      wifiBadge.src = "../assets/icons/sin-wifi.svg";
      wifiBadge.className = "wifi-badge";
      imgContainer.appendChild(wifiBadge);

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
        let shareBtn = null;

        const topRow = document.createElement("div");
        topRow.style.display = "flex";
        topRow.style.gap = "8px";
        topRow.style.width = "100%";

        // ABRIR
        const openBtn = document.createElement("button");
        openBtn.textContent = "Abrir";
        openBtn.className = "md-btn md-btn-filled";
        openBtn.style.flex = "1";
        openBtn.onclick = () => window.api.openApp(app.paths[0], app.steam === "si");
        if (isUninstalling) openBtn.style.display = "none";
        topRow.appendChild(openBtn);

        // DESINSTALAR
        if (app.uninstall) {
          const uninstallBtn = document.createElement("button");
          uninstallBtn.className = "md-btn md-btn-danger";
          uninstallBtn.style.flex = "1";

          if (isUninstalling) {
            uninstallBtn.disabled = true;
            uninstallBtn.innerHTML = `
            <span class="button-loading">
              <img src="../assets/icons/loading-new.svg">
              Desinstalando...
            </span>
          `;
          } else {
            uninstallBtn.textContent = "Desinstalar";
            uninstallBtn.onclick = async (e) => {
              e.stopPropagation();
              showToast("Desinstalando aplicación...");
              uninstallingApps.add(app.id);

              uninstallBtn.disabled = true;
              openBtn.style.display = "none";
              locBtn.style.display = "none";
              if (shareBtn) shareBtn.style.display = "none";
              uninstallBtn.innerHTML = `
            <span class="button-loading">
              <img src="../assets/icons/loading-new.svg">
              Desinstalando...
            </span>
          `;

              try {
                await window.api.uninstallApp(app.uninstall);
                playSound("finish.mp3");
              } catch (error) {
                console.error("Error desinstalando:", error);
              } finally {
                uninstallingApps.delete(app.id);
                await load();
              }
            };
          }

          topRow.appendChild(uninstallBtn);
        }

        actions.appendChild(topRow);

        // UBICACIÓN + SHARE
        const bottomRow = document.createElement("div");
        bottomRow.style.display = "flex";
        bottomRow.style.gap = "8px";
        bottomRow.style.width = "100%";

        const locBtn = document.createElement("button");
        locBtn.textContent = "Ubicación";
        locBtn.className = "md-btn md-btn-blue";
        locBtn.style.flex = "1";
        locBtn.onclick = () => {
          playSound("others.mp3");
          window.api.openAppLocation(app.installPath || app.paths[0]);
          showToast("Abriendo ubicación...");
        };
        if (isUninstalling) locBtn.style.display = "none";
        bottomRow.appendChild(locBtn);

        if (app["share-compatibility"] === "si") {
          shareBtn = document.createElement("button");
          shareBtn.className = "md-btn md-btn-tonal";
          shareBtn.innerHTML = '<img src="../assets/icons/share.svg" alt="Share" style="width: 20px; height: 20px;">';
          shareBtn.onclick = (e) => {
            e.stopPropagation();
            playSound("others.mp3");
            navigator.clipboard.writeText(`Juega conmigo a https://stormgamesstudios.vercel.app/juegos/juegos-url/${app.id}/play`);
            showToast("Enlace copiado al portapapeles");
          };
          if (isUninstalling) shareBtn.style.display = "none";
          bottomRow.appendChild(shareBtn);
        }

        actions.appendChild(bottomRow);
      } else {
        // INSTALAR + SHARE
        const installRow = document.createElement("div");
        installRow.style.display = "flex";
        installRow.style.gap = "8px";
        installRow.style.width = "100%";

        const installBtn = document.createElement("button");
        installBtn.className = "md-btn md-btn-filled";
        installBtn.style.flex = "1";

        if (installingApps.has(app.id)) {
          installBtn.disabled = true;
          installBtn.innerHTML = `
            <span class="button-loading">
              <img src="../assets/icons/loading-new.svg">
              Instalando...
            </span>
          `;
        } else {
          installBtn.textContent = "Instalar";
          installBtn.onclick = async () => {
            playSound("others.mp3");
            showToast("Iniciando instalación...");
            installingApps.add(app.id);
            // Actualizar botón visualmente
            installBtn.disabled = true;
            installBtn.innerHTML = `
            <span class="button-loading">
              <img src="../assets/icons/loading-new.svg">
              Instalando...
            </span>
          `;

            try {
              await window.api.installApp(app);
              playSound("finish.mp3");
              installingApps.delete(app.id);
              await load();
            } catch (error) {
              console.error("Instalación cancelada o fallida:", error);
              installingApps.delete(app.id);
              // Revertir estado del botón
              installBtn.disabled = false;
              installBtn.textContent = "Instalar";
            }
          };
        };

        installRow.appendChild(installBtn);

        if (app["share-compatibility"] === "si") {
          const shareBtn = document.createElement("button");
          shareBtn.className = "md-btn md-btn-tonal";
          shareBtn.innerHTML = '<img src="../assets/icons/share.svg" alt="Share" style="width: 20px; height: 20px;">';
          shareBtn.onclick = (e) => {
            e.stopPropagation();
            playSound("others.mp3");
            navigator.clipboard.writeText(`Juega conmigo a https://stormgamesstudios.vercel.app/juegos/juegos-url/${app.id}/play`);
            showToast("Enlace copiado al portapapeles");
          };
          installRow.appendChild(shareBtn);
        }

        actions.appendChild(installRow);
      }

      card.append(imgContainer, name, desc, actions);
      appsContainer.appendChild(card);
    });
}

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
document.getElementById("min-btn")?.addEventListener("click", () => window.api.minimizeWindow());
document.getElementById("close-btn")?.addEventListener("click", () => window.api.closeWindow());

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
