const appsContainer = document.getElementById("apps");
const versionElem = document.getElementById("app-version");
const searchInput = document.getElementById("search");
const refreshBtn = document.getElementById("refresh-btn");

let allApps = [];
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
    refreshBtn.classList.add("spinning");
  }
  try {
    const newApps = await window.api.getSteamGames();
    allApps = newApps;
    renderApps();
  } catch (e) {
    console.error(e);
    appsContainer.innerHTML = "<p>Error cargando juegos de Steam.</p>";
  } finally {
    if (force && refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.classList.remove("spinning");
    }
  }
}

// Renderizar apps
function renderApps() {
  appsContainer.innerHTML = "";

  const filtered = allApps.filter((a) => {
    if (!currentSearch) return true;
    const q = currentSearch.toLowerCase();
    const name = (a.name || "").toLowerCase();
    return name.includes(q);
  });

  if (filtered.length === 0) {
    appsContainer.innerHTML = "<p>No se encontraron juegos de Steam instalados.</p>";
    return;
  }

  filtered.forEach((app, index) => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.animationDelay = `${index * 50}ms`;

      const imgContainer = document.createElement("div");
      imgContainer.className = "img-container";
      imgContainer.style.cursor = "pointer";
      imgContainer.onclick = () => {
        window.location.href = `app.html?id=${app.id}`;
      };

      const icon = document.createElement("img");
      icon.src = app.icon;
      icon.className = "app-icon";
      // Fallback si la imagen no carga
      icon.onerror = () => { icon.src = "../assets/icons/steam.svg"; icon.style.padding = "20px"; icon.style.background = "#171a21"; };
      imgContainer.appendChild(icon);

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

      const openBtn = document.createElement("button");
      openBtn.textContent = "Jugar";
      openBtn.className = "md-btn md-btn-filled";
      openBtn.style.width = "100%";
      openBtn.onclick = () => window.api.openApp(app.paths[0], false);
      
      actions.appendChild(openBtn);

      card.append(imgContainer, name, desc, actions);
      appsContainer.appendChild(card);
    });
}

// Inicializar
load(true);

if (refreshBtn) {
  refreshBtn.addEventListener("click", () => load(true));
}

// Filtrado desde la barra de búsqueda
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value || "";
    renderApps();
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