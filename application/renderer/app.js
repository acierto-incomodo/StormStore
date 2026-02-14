const appsContainer = document.getElementById("apps");
const catContainer = document.getElementById("categories");
const title = document.getElementById("current-category");
const versionElem = document.getElementById("app-version");
const searchInput = document.getElementById("search");
const refreshBtn = document.getElementById("refresh-btn");

let allApps = [];
let currentCategory = "Todas";
let currentSearch = "";

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
        // ABRIR
        const openBtn = document.createElement("button");
        openBtn.textContent = "Abrir";
        openBtn.onclick = () => window.api.openApp(app.paths[0]);
        actions.appendChild(openBtn);

        // DESINSTALAR
        if (app.uninstall) {
          const uninstallBtn = document.createElement("button");
          uninstallBtn.textContent = "Desinstalar";
          uninstallBtn.style.background = "#d9534f";

          uninstallBtn.onclick = async (e) => {
            e.stopPropagation(); // 🔥 CLAVE
            const overlay = document.getElementById("install-overlay");
            overlay.style.display = "flex";

            await window.api.uninstallApp(app.uninstall);

            overlay.style.display = "none";
            await load();
          };

          actions.appendChild(uninstallBtn);
        }

        // ACTUALIZAR (Verificación asíncrona)
        if (app.download && app.download.includes("github.com")) {
          const updateContainer = document.createElement("div");
          // Lo añadimos oculto o vacío inicialmente
          actions.appendChild(updateContainer);

          window.api.checkAppUpdate(app.id, app.download).then((result) => {
            if (result && result.hasUpdate) {
              const updateBtn = document.createElement("button");
              updateBtn.textContent = "Actualizar";
              updateBtn.style.background = "#f0ad4e"; // Color naranja para diferenciar
              updateBtn.title = `Versión actual: ${result.localVersion || "?"} -> Nueva: ${result.remoteVersion}`;
              
              // Desactivado temporalmente
              updateBtn.disabled = true;
              updateBtn.style.opacity = "0.5";
              updateBtn.style.cursor = "not-allowed";

              updateBtn.onclick = async () => {
                const overlay = document.getElementById("install-overlay");
                updateBtn.disabled = true;
                overlay.style.display = "flex";
                // Reutilizamos la lógica de instalar, ya que descarga el último instalador
                await window.api.installApp(app);
                overlay.style.display = "none";
                await load();
              };

              updateContainer.appendChild(updateBtn);
            }
          });
        }
      } else {
        // INSTALAR
        const installBtn = document.createElement("button");
        installBtn.textContent = "Instalar";

        installBtn.onclick = async () => {
          const overlay = document.getElementById("install-overlay");
          installBtn.disabled = true;
          overlay.style.display = "flex";

          installBtn.innerHTML = `
            <span class="button-loading">
              <img src="../assets/icons/loading-new.svg">
              Instalando...
            </span>
          `;

          await window.api.installApp(app);

          overlay.style.display = "none";
          await load();
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
