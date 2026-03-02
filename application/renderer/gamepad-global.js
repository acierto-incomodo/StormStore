// Detectar botón Home (Guide) para abrir Big Picture desde cualquier vista normal
(function () {
  let isEntering = false;
  let lastHomeState = false;

  function checkGamepad() {
    const gamepads = navigator.getGamepads();
    for (const gp of gamepads) {
      if (!gp) continue;

      // Botón 16 es el estándar para el botón Home/Guide (Xbox, PS, etc.)
      if (gp.buttons.length > 16) {
        const homeBtn = gp.buttons[16];

        if (homeBtn && homeBtn.pressed) {
          if (!lastHomeState && !isEntering) {
            isEntering = true;
            window.api.openBigPicture();
          }
          lastHomeState = true;
        } else {
          lastHomeState = false;
        }
      }
    }
    requestAnimationFrame(checkGamepad);
  }

  // Iniciar bucle
  requestAnimationFrame(checkGamepad);
})();
