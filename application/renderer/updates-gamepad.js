document.addEventListener('DOMContentLoaded', () => {
    let interactiveElements = [];
    let currentIndex = -1;
    let lastInputTime = 0;
    const DEBOUNCE_MS = 150;
    // New state for single button press
    let prevButtons = [];

    function getVisibleInteractiveElements() {
        const selectors = [
            '#check-updates-btn', // Prioridad al botón de buscar actualizaciones
            '#download-btn',
            '#install-btn',
            '#retry-btn',
            '#back-to-apps'
        ];
        const elements = [];
        selectors.forEach(selector => {
            const el = document.querySelector(selector);
            // Check if element exists and is visible (its offsetParent is not null)
            if (el && el.offsetParent !== null) {
                elements.push(el);
            }
        });
        return elements;
    }

    function updateSelection(newIndex) {
        interactiveElements[currentIndex]?.classList.remove('selected');
        
        if (newIndex < 0) newIndex = interactiveElements.length - 1;
        if (newIndex >= interactiveElements.length) newIndex = 0;

        currentIndex = newIndex;
        const selectedEl = interactiveElements[currentIndex];
        selectedEl?.classList.add('selected');
        selectedEl?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }

    function gamepadLoop() {
        const gp = navigator.getGamepads().find(g => g !== null);

        if (gp) {
            // Function to check for a new button press
            const isNewPress = (buttonIndex) => {
                return gp.buttons[buttonIndex]?.pressed && !prevButtons[buttonIndex];
            };

            const now = Date.now();
            if (now - lastInputTime > DEBOUNCE_MS) {
                let actionTaken = false;

                const currentElements = getVisibleInteractiveElements();
                if (currentElements.map(e => e.id).join() !== interactiveElements.map(e => e.id).join()) {
                    interactiveElements = currentElements;
                    updateSelection(0);
                }

                if (interactiveElements.length === 0) {
                    requestAnimationFrame(gamepadLoop);
                    return;
                }

                const axisY = gp.axes[1];

                if (gp.buttons[12]?.pressed || axisY < -0.5) { // D-Pad Up
                    updateSelection(currentIndex - 1);
                    actionTaken = true;
                } else if (gp.buttons[13]?.pressed || axisY > 0.5) { // D-Pad Down
                    updateSelection(currentIndex + 1);
                    actionTaken = true;
                }

                if (actionTaken) lastInputTime = now;
            }

            // Button presses - check for single press
            if (isNewPress(0)) { // A button
                interactiveElements[currentIndex]?.click();
            } else if (isNewPress(1) || isNewPress(16) || isNewPress(9)) { // B button, Home, Options
                window.location.href = "bigpicture.html?openMenu=true";
            }

            // Update previous button state
            prevButtons = gp.buttons.map(b => b.pressed);
        }
        requestAnimationFrame(gamepadLoop);
    }
    requestAnimationFrame(gamepadLoop);
});