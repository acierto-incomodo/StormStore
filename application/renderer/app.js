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
    refreshBtn.style.opacity = "0.5";
    const icon = refreshBtn.querySelector("svg");
    if (icon) icon.style.animation = "spin 1s linear infinite";
  }
  try {
    const newApps = await window.api.getApps();

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
      refreshBtn.style.opacity = "1";
      const icon = refreshBtn.querySelector("svg");
      if (icon) icon.style.animation = "none";
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
    .forEach((app) => {
      const card = document.createElement("div");
      card.className = "card";

      const icon = document.createElement("img");
      icon.src = app.icon;

      const name = document.createElement("h3");
      name.textContent = app.name;

      const desc = document.createElement("p");
      desc.textContent = app.description;

      const actions = document.createElement("div");
      actions.className = "card-actions";

      if (app.installed) {
        const isUninstalling = uninstallingApps.has(app.id);

        actions.style.flexDirection = "column";

        const topRow = document.createElement("div");
        topRow.style.display = "flex";
        topRow.style.gap = "8px";
        topRow.style.width = "100%";

        // ABRIR
        const openBtn = document.createElement("button");
        openBtn.textContent = "Abrir";
        openBtn.style.flex = "1";
        openBtn.onclick = () => window.api.openApp(app.paths[0]);
        if (isUninstalling) openBtn.disabled = true;
        topRow.appendChild(openBtn);

        // UBICACIÓN
        const locBtn = document.createElement("button");
        locBtn.textContent = "Ubicación";
        locBtn.style.background = "#2196F3";
        locBtn.style.color = "#fff";
        locBtn.style.width = "100%";
        locBtn.onclick = () => window.api.openAppLocation(app.paths[0]);
        if (isUninstalling) locBtn.disabled = true;

        // DESINSTALAR
        if (app.uninstall) {
          const uninstallBtn = document.createElement("button");
          uninstallBtn.style.background = "#d9534f";
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
              uninstallingApps.add(app.id);

              uninstallBtn.disabled = true;
              openBtn.disabled = true;
              locBtn.disabled = true;
              uninstallBtn.innerHTML = `
            <span class="button-loading">
              <img src="../assets/icons/loading-new.svg">
              Desinstalando...
            </span>
          `;

              try {
                await window.api.uninstallApp(app.uninstall);
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
        actions.appendChild(locBtn);
      } else {
        // INSTALAR
        const installBtn = document.createElement("button");
        installBtn.style.width = "100%";

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

        actions.appendChild(installBtn);
      }

      card.append(icon, name, desc, actions);
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
    .then(() => (overlay.style.display = "none"))
    .catch(() => (overlay.style.display = "flex"));
}

updateInternetStatus();
setInterval(updateInternetStatus, 5000);

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
