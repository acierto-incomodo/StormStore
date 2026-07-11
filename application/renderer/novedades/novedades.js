const RELEASES_URL =
  "https://api.github.com/repos/acierto-incomodo/StormStore/releases";

const statusEl = document.getElementById("status");
const releasesListEl = document.getElementById("releases-list");
const reloadBtn = document.getElementById("reload-btn");

function escapeHtml(text = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function formatInline(text = "") {
  let result = escapeHtml(text);
  result = result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
  result = result.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return result;
}

function renderReleaseBody(body = "") {
  const lines = body.split(/\r?\n/);
  const html = [];
  let inList = false;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${formatInline(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
      return;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      const level = trimmed.match(/^#+/)[0].length;
      html.push(`<h${level}>${formatInline(trimmed.replace(/^#{1,6}\s+/, ""))}</h${level}>`);
      return;
    }

    html.push(`<p>${formatInline(trimmed)}</p>`);
  });

  if (inList) {
    html.push("</ul>");
  }

  return html.join("");
}

function renderReleases(releases) {
  if (!releases.length) {
    releasesListEl.innerHTML = '<div class="release-item">No se encontraron releases publicadas.</div>';
    return;
  }

  releasesListEl.innerHTML = releases
    .map((release) => {
      const title = release.name || release.tag_name || "Versión sin nombre";
      const publishedAt = release.published_at
        ? new Date(release.published_at).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Fecha no disponible";
      const body = renderReleaseBody(release.body || "No hay notas de lanzamiento disponibles.");

      return `
        <article class="release-item">
          <h3>${escapeHtml(title)}</h3>
          <div class="release-meta">${escapeHtml(publishedAt)} · ${escapeHtml(release.tag_name || "")}</div>
          <div class="release-body">${body}</div>
          <a class="release-link" href="${release.html_url}" target="_blank" rel="noopener noreferrer">
            Ver en GitHub
          </a>
        </article>
      `;
    })
    .join("");
}

async function loadReleases() {
  statusEl.textContent = "Cargando release notes…";
  releasesListEl.innerHTML = "";

  try {
    const response = await fetch(RELEASES_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "StormStore-App",
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    const releases = await response.json();
    renderReleases(releases);
    statusEl.textContent = `Mostrando ${releases.length} release${releases.length === 1 ? "" : "s"} recientes.`;
  } catch (error) {
    console.error("No se pudieron cargar los releases:", error);
    statusEl.textContent = "No se pudieron cargar las notas de la versión. Comprueba tu conexión o inténtalo de nuevo.";
    releasesListEl.innerHTML = '<div class="release-item">No se pudieron cargar los release notes.</div>';
  }
}

reloadBtn.addEventListener("click", loadReleases);
document.addEventListener("DOMContentLoaded", async () => {
  const version = await window.api.getAppVersion();
  const versionElem = document.getElementById("app-version");
  if (versionElem) {
    versionElem.textContent = `v${version}`;
  }

  window.api.setDiscordActivity({
    details: "Novedades",
    state: "Historial",
  });

  document.getElementById("back-to-apps")?.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "../index.html";
    }
  });

  document.getElementById("open-updates")?.addEventListener("click", () => {
    window.location.href = "../updates.html";
  });

  document.getElementById("open-licenses")?.addEventListener("click", () => {
    window.location.href = "../licencias.html";
  });

  document.getElementById("open-info")?.addEventListener("click", () => {
    window.location.href = "../info.html";
  });

  document.getElementById("open-support")?.addEventListener("click", () => {
    window.location.href = "../soporte/soporte.html";
  });

  document.getElementById("open-news")?.classList.add("active");

  document.getElementById("open-big-picture")?.addEventListener("click", () => {
    window.api.openBigPicture();
  });

  document.getElementById("open-settings-header")?.addEventListener("click", () => {
    window.location.href = "../settings.html";
  });

  document.getElementById("min-btn")?.addEventListener("click", () => {
    window.api.minimizeWindow();
  });

  document.getElementById("close-btn")?.addEventListener("click", () => {
    window.api.closeWindow();
  });

  const maxBtn = document.getElementById("max-btn");
  if (maxBtn) {
    maxBtn.addEventListener("click", () => window.api.maximizeWindow());

    window.api.isMaximized().then((isMax) => {
      if (isMax) maxBtn.textContent = "❐";
    });

    window.api.onWindowMaximized(() => (maxBtn.textContent = "❐"));
    window.api.onWindowRestored(() => (maxBtn.textContent = "◻"));
  }

  loadReleases();
});
