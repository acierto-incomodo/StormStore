document.addEventListener("DOMContentLoaded", async () => {
  const version = await window.api.getAppVersion();
  const versionElem = document.getElementById("app-version");
  if (versionElem) {
    versionElem.textContent = `v${version}`;
  }

  window.api.setDiscordActivity({
    details: "Soporte",
    state: "Sistema",
  });

  document.getElementById("back-to-apps")?.addEventListener("click", () => {
    window.history.back();
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

  document.getElementById("open-support")?.classList.add("active");

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
});
