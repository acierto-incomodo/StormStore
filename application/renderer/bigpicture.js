document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const gridContainer = document.getElementById('grid-container');
    const gameTitle = document.getElementById('game-title');
    const background = document.getElementById('background');
    const footer = document.getElementById('footer-prompts');
    const menuOverlay = document.getElementById('bp-menu-overlay');
    const menuBackButton = document.getElementById('bp-menu-back');
    const menuExitButton = document.getElementById('bp-menu-exit');
    const menuUpdatesButton = document.getElementById('bp-menu-updates');
    const menuQuitAppButton = document.getElementById('bp-menu-quit-app');
    const menuTutorialButton = document.getElementById('bp-menu-tutorial');

    // State
    let currentView = 'grid';
    let games = [];
    let gridItems = [];
    let currentGridIndex = 0;
    let currentCategory = null;
    let cols = 0;
    
    // Gamepad State
    let lastInputTime = 0;
    const DEBOUNCE_MS = 150;
    let gamepadConnected = false;
    let controllerType = 'xbox'; // 'xbox' or 'playstation'
    let isMenuOpen = false;
    let menuItems = [];
    let menuCurrentIndex = 0;
    let waitingForHomeRelease = true;
    // New state for single button press
    let prevButtons = [];
    let firstInputPoll = true;

    // Icon Mapping
    const iconMap = {
        xbox: {
            'A': 'XboxA.svg',
            'B': 'XboxB.svg',
            'SHARE': 'Xbox_Share_button.svg',
            'HOME': 'Xbox_Logo.svg'
        },
        playstation: {
            'A': 'PlayStation_button_X.svg',
            'B': 'PlayStation_button_C.svg',
            'SHARE': 'PlayStation_4_Share_button.svg',
            'HOME': 'PlayStation_button_Home.svg'
        }
    };

    // Data
    let allStormApps = [];
    let allSteamGames = [];
    let allEpicGames = [];
    const categories = [
        { id: 'storm', name: 'StormStore', icon: '../assets/app.png', getGames: () => allStormApps },
        { id: 'steam', name: 'Steam', icon: '../assets/icons/steam.svg', getGames: () => allSteamGames },
        // { id: 'epic', name: 'Epic Games', icon: '../assets/icons/epic-games.svg', getGames: () => allEpicGames },
    ];

    function detectControllerType(gp) {
        const id = gp.id.toLowerCase();
        if (id.includes('playstation') || id.includes('wireless controller')) {
            return 'playstation';
        }
        // Default to xbox for 'xbox', 'xinput', or anything else
        return 'xbox';
    }

    function updateFooter(prompts) {
        let newHTML;
        if (typeof prompts === 'string') {
            newHTML = prompts; // Fallback for text like "Conecta un mando..."
        } else if (Array.isArray(prompts)) {
            newHTML = prompts.map(p => {
                const iconName = iconMap[controllerType]?.[p.button];
                if (!iconName) return `<span>(${p.button}) ${p.action}</span>`; // Fallback if icon is missing
                
                const iconPath = `../assets/gamepad/${controllerType}/${iconName}`;
                return `<span><img src="${iconPath}" class="prompt-icon" alt="${p.button}"> ${p.action}</span>`;
            }).join('&nbsp;&nbsp;&nbsp;');
        } else {
            newHTML = '';
        }

        if (footer.innerHTML !== newHTML) {
            footer.innerHTML = newHTML;
        }
    }

    async function loadAllGames() {
        const apps = await window.api.getApps();
        allStormApps = apps.filter(app => {
            if (!app.installed) return false;
            const cats = Array.isArray(app.category) ? app.category : [app.category];
            return cats.includes("Juegos");
        });
        allSteamGames = await window.api.getSteamGames();
        allEpicGames = await window.api.getEpicGames();
        // Show first category by default
        currentCategory = categories[0];
        showGameGrid(currentCategory);
    }

    function showGameGrid(category) {
        currentView = 'grid';
        currentCategory = category;
        games = category.getGames();
        games.sort((a, b) => a.name.localeCompare(b.name));
        
        gridContainer.style.display = 'grid';
        
        renderGrid();
        updateFooter([
            { button: 'A', action: 'Iniciar' },
            { button: 'B', action: 'Menú' },
            { button: 'SHARE', action: 'Ayuda' }
        ]);
    }

    function renderGrid() {
        gridContainer.innerHTML = '';
        if (games.length === 0) {
            gameTitle.textContent = 'No hay juegos instalados';
            background.style.backgroundImage = '';
            currentGridIndex = 0;
            gridItems = [];
            return;
        }

        games.forEach((game, index) => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.style.backgroundImage = `url('${game.icon}')`;
            card.dataset.index = index;
            card.dataset.id = game.id;

            // --- Badges de Requisitos ---
            if (game.steam === 'si') {
                const steamBadge = document.createElement('div');
                steamBadge.className = 'bp-req-badge steam-req';
                
                const steamIcon = document.createElement('img');
                steamIcon.src = '../assets/icons/steam.svg';
                
                const steamText = document.createElement('span');
                steamText.textContent = 'Steam';
                
                steamBadge.append(steamIcon, steamText);
                card.appendChild(steamBadge);
            }

            if (game.wifi === 'si') {
                const wifiBadge = document.createElement('div');
                wifiBadge.className = 'bp-req-badge wifi-req';
                
                const wifiIcon = document.createElement('img');
                wifiIcon.src = '../assets/icons/wifi.svg';
                
                const wifiText = document.createElement('span');
                wifiText.textContent = 'WiFi';
                
                wifiBadge.append(wifiIcon, wifiText);
                card.appendChild(wifiBadge);
            }

            const titleOverlay = document.createElement('div');
            titleOverlay.className = 'title-overlay';
            titleOverlay.textContent = game.name;
            card.appendChild(titleOverlay);
            gridContainer.appendChild(card);
        });
        gridItems = Array.from(gridContainer.children);
        updateGridSelection(0);
    }

    function updateGridSelection(newIndex, scroll = true) {
        if (gridItems.length === 0) {
            gameTitle.textContent = currentCategory?.name || 'No hay juegos';
            background.style.backgroundImage = '';
            return;
        }
        gridItems[currentGridIndex]?.classList.remove('selected');
        newIndex = Math.max(0, Math.min(newIndex, gridItems.length - 1));
        currentGridIndex = newIndex;
        const selectedCard = gridItems[currentGridIndex];
        selectedCard.classList.add('selected');
        const game = games[currentGridIndex];
        gameTitle.textContent = game.name;
        background.style.backgroundImage = `url('${game.icon}')`;
        if (scroll) {
            selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function getGridDimensions() {
        if (gridItems.length === 0) return 0;
        const gridStyles = window.getComputedStyle(gridContainer);
        const gridWidth = gridContainer.clientWidth - parseFloat(gridStyles.paddingLeft) - parseFloat(gridStyles.paddingRight);
        const cardWidth = gridItems[0].offsetWidth;
        const gap = parseFloat(gridStyles.gap);
        return Math.floor(gridWidth / (cardWidth + gap));
    }

    function moveInGrid(direction) {
        cols = getGridDimensions();
        let newIndex = currentGridIndex;
        switch (direction) {
            case 'up': newIndex -= cols; break;
            case 'down': newIndex += cols; break;
            case 'left': newIndex -= 1; break;
            case 'right': newIndex += 1; break;
        }
        if (newIndex >= 0 && newIndex < gridItems.length) {
            updateGridSelection(newIndex);
        }
    }

    function launchGame() {
        const game = games[currentGridIndex];
        if (game) {
            window.api.openApp(game.paths[0], game.steam === 'si');
        }
    }

    function openTutorial() {
        window.location.href = 'bigpicture-controller-tutorial.html';
    }

    function exitBigPicture() {
        window.api.openMainView();
    }

    function openUpdates() {
        // Add source for big picture styling
        window.location.href = "updates.html?source=bigpicture";
    }

    function quitApp() {
        window.api.quitApp();
    }

    function openMenu() {
        if (isMenuOpen) return;
        isMenuOpen = true;
        menuOverlay.classList.add('active');
        const modalActions = menuBackButton.parentElement;

        // Remove previously created category buttons to avoid duplication
        modalActions.querySelectorAll('.category-menu-button').forEach(btn => btn.remove());

        // Dynamically create category buttons
        const referenceElement = document.getElementById('bp-menu-separator');
        const categoryButtons = categories.map(cat => {
            const button = document.createElement('button');
            button.textContent = cat.name;
            button.classList.add('category-menu-button');
            button.onclick = () => {
                showGameGrid(cat);
                closeMenu();
            };
            modalActions.insertBefore(button, referenceElement);
            return button;
        });

        menuItems = [menuBackButton, ...categoryButtons, menuTutorialButton, menuUpdatesButton, menuExitButton, menuQuitAppButton];
        updateMenuSelection(0);
        updateFooter([
            { button: 'A', action: 'Seleccionar' },
            { button: 'B', action: 'Volver' },
            { button: 'SHARE', action: 'Ayuda' }
        ]);
    }

    function closeMenu() {
        if (!isMenuOpen) return;
        isMenuOpen = false;
        menuOverlay.classList.remove('active');
        // Restore footer for grid view
        updateFooter([
            { button: 'A', action: 'Iniciar' },
            { button: 'B', action: 'Menú' },
            { button: 'SHARE', action: 'Ayuda' }
        ]);
    }

    function updateMenuSelection(newIndex) {
        menuItems[menuCurrentIndex]?.classList.remove('selected');
        if (newIndex < 0) newIndex = menuItems.length - 1;
        if (newIndex >= menuItems.length) newIndex = 0;
        menuCurrentIndex = newIndex;
        menuItems[menuCurrentIndex]?.classList.add('selected');
    }

    // --- Keyboard Support ---
    function handleKeyboardInput(e) {
        if (isMenuOpen) {
            switch(e.key) {
                case 'ArrowUp':
                    updateMenuSelection(menuCurrentIndex - 1);
                    break;
                case 'ArrowDown':
                    updateMenuSelection(menuCurrentIndex + 1);
                    break;
                case 'Enter':
                    menuItems[menuCurrentIndex].click();
                    break;
                case 'Escape':
                    closeMenu();
                    break;
            }
        } else { // Grid view
            switch(e.key) {
                case 'ArrowUp':
                    moveInGrid('up');
                    break;
                case 'ArrowDown':
                    moveInGrid('down');
                    break;
                case 'ArrowLeft':
                    moveInGrid('left');
                    break;
                case 'ArrowRight':
                    moveInGrid('right');
                    break;
                case 'Enter':
                    launchGame();
                    break;
                case 'Escape':
                    openMenu();
                    break;
            }
        }
        // Prevent default browser actions for these keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(e.key)) {
            e.preventDefault();
        }
    }

    function gamepadLoop() {
        const gp = navigator.getGamepads().find(g => g !== null);
        if (gp) {
            if (firstInputPoll) {
                prevButtons = gp.buttons.map(b => b.pressed);
                firstInputPoll = false;
            }

            if (!gamepadConnected) {
                gamepadConnected = true;
                controllerType = detectControllerType(gp);
                // Re-render footer with correct icons for the current view
                if (isMenuOpen) {
                    updateFooter([
                        { button: 'A', action: 'Seleccionar' },
                        { button: 'B', action: 'Volver' },
                        { button: 'SHARE', action: 'Ayuda' }
                    ]);
                } else {
                    updateFooter([
                        { button: 'A', action: 'Iniciar' },
                        { button: 'B', action: 'Menú' },
                        { button: 'SHARE', action: 'Ayuda' }
                    ]);
                }
            }
            // Function to check for a new button press
            const isNewPress = (buttonIndex) => {
                return gp.buttons[buttonIndex]?.pressed && !prevButtons[buttonIndex];
            };

            const now = Date.now();
            let actionTaken = false;

            // Axis (joystick) and D-Pad input - keep debouncing for smooth but not-too-fast navigation
            if (now - lastInputTime > DEBOUNCE_MS) {
                const axisX = gp.axes[0];
                const axisY = gp.axes[1];

                if (isMenuOpen) {
                    if (gp.buttons[12]?.pressed || axisY < -0.5) { updateMenuSelection(menuCurrentIndex - 1); actionTaken = true; } 
                    else if (gp.buttons[13]?.pressed || axisY > 0.5) { updateMenuSelection(menuCurrentIndex + 1); actionTaken = true; }
                } else { // Always in 'grid' view
                    if (gp.buttons[12]?.pressed || axisY < -0.5) { moveInGrid('up'); actionTaken = true; } 
                    else if (gp.buttons[13]?.pressed || axisY > 0.5) { moveInGrid('down'); actionTaken = true; } 
                    else if (gp.buttons[14]?.pressed || axisX < -0.5) { moveInGrid('left'); actionTaken = true; } 
                    else if (gp.buttons[15]?.pressed || axisX > 0.5) { moveInGrid('right'); actionTaken = true; }
                }
                if (actionTaken) lastInputTime = now;
            }

            // Button presses - check for single press
            if (isMenuOpen) {
                if (isNewPress(0)) { menuItems[menuCurrentIndex].click(); actionTaken = true; } // A
                else if (isNewPress(1) || isNewPress(16) || isNewPress(9)) { closeMenu(); actionTaken = true; } // B or Home or Options
            } else { // Grid view
                if (isNewPress(0)) { launchGame(); actionTaken = true; } // A
                else if (isNewPress(1)) { openMenu(); actionTaken = true; } // B
                else if ((isNewPress(16) && !waitingForHomeRelease) || isNewPress(9)) { openMenu(); actionTaken = true; } // Home or Options
            }

            // Tutorial button (Share/View)
            // PS Share/Create is 8, Xbox View is 6. Newer Xbox Share is 18.
            if (isNewPress(6) || isNewPress(8) || isNewPress(18)) {
                window.location.href = 'bigpicture-controller-tutorial.html';
                actionTaken = true;
            }

            // Update previous button state
            prevButtons = gp.buttons.map(b => b.pressed);

            if (!gp.buttons[16]?.pressed) waitingForHomeRelease = false;
        } else {
            if (gamepadConnected) {
                gamepadConnected = false;
                updateFooter('Conecta un mando para navegar.');
            }
        }
        requestAnimationFrame(gamepadLoop);
    }

    // --- Inicialización ---
    if (!localStorage.getItem('hasSeenBPTutorial')) {
        // Add a query param to handle setting the flag on the tutorial page
        window.location.href = 'bigpicture-controller-tutorial.html?firstTime=true';
    } else {
        loadAllGames();
        requestAnimationFrame(gamepadLoop);
    }

    // --- Eventos de ratón, teclado y menú ---
    window.addEventListener('keydown', handleKeyboardInput);
    menuBackButton.addEventListener('click', closeMenu);
    menuTutorialButton.addEventListener('click', openTutorial);
    menuUpdatesButton.addEventListener('click', openUpdates);
    menuExitButton.addEventListener('click', exitBigPicture);
    menuQuitAppButton.addEventListener('click', quitApp);
    menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay) closeMenu();
    });

    window.addEventListener('resize', () => {
        cols = getGridDimensions();
    });
});