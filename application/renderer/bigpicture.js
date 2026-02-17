document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const categorySelector = document.getElementById('category-selector');
    const gridContainer = document.getElementById('grid-container');
    const gameTitle = document.getElementById('game-title');
    const background = document.getElementById('background');
    const footer = document.getElementById('footer-prompts');
    const menuOverlay = document.getElementById('bp-menu-overlay');
    const menuBackButton = document.getElementById('bp-menu-back');
    const menuChangeCategoryButton = document.getElementById('bp-menu-change-category');
    const menuExitButton = document.getElementById('bp-menu-exit');

    // State
    let currentView = 'categories'; // 'categories' or 'grid'
    let games = [];
    let gridItems = [];
    let categoryItems = [];
    let currentGridIndex = 0;
    let currentCategoryIndex = 0;
    let cols = 0;
    
    // Gamepad State
    let lastInputTime = 0;
    const DEBOUNCE_MS = 150;
    let gamepadConnected = false;
    let isMenuOpen = false;
    let menuItems = [];
    let menuCurrentIndex = 0;
    let waitingForHomeRelease = true;

    // Data
    let allStormApps = [];
    let allSteamGames = [];
    let allEpicGames = [];
    const categories = [
        { id: 'storm', name: 'StormStore', icon: '../assets/app.png', getGames: () => allStormApps },
        { id: 'steam', name: 'Steam', icon: '../assets/icons/steam.svg', getGames: () => allSteamGames },
        { id: 'epic', name: 'Epic Games', icon: '../assets/icons/epic-games.svg', getGames: () => allEpicGames },
    ];

    function updateFooter(text) {
        if (footer.innerHTML !== text) {
            footer.innerHTML = text;
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
        renderCategorySelector();
    }

    function renderCategorySelector() {
        categorySelector.innerHTML = '';
        categories.forEach((cat, index) => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.dataset.index = index;
            
            const img = document.createElement('img');
            img.src = cat.icon;
            
            const title = document.createElement('h2');
            title.textContent = cat.name;

            card.append(img, title);
            card.onclick = () => showGameGrid(cat);
            categorySelector.appendChild(card);
        });
        categoryItems = Array.from(categorySelector.children);
        updateCategorySelection(0);
        showCategorySelector();
    }

    function showCategorySelector() {
        currentView = 'categories';
        gridContainer.style.display = 'none';
        categorySelector.style.display = 'flex';
        gameTitle.textContent = 'Selecciona una categoría';
        background.style.backgroundImage = '';
        updateFooter('<span>(A)</span> Seleccionar &nbsp;&nbsp; <span>(B)</span> Salir');
        updateCategorySelection(currentCategoryIndex);
    }

    function showGameGrid(category) {
        currentView = 'grid';
        games = category.getGames();
        games.sort((a, b) => a.name.localeCompare(b.name));
        
        categorySelector.style.display = 'none';
        gridContainer.style.display = 'grid';
        
        renderGrid();
        updateFooter('<span>(A)</span> Iniciar &nbsp;&nbsp; <span>(B)</span> Atrás');
    }

    function renderGrid() {
        gridContainer.innerHTML = '';
        if (games.length === 0) {
            gameTitle.textContent = 'No hay juegos instalados';
            background.style.backgroundImage = '';
            gridItems = [];
            return;
        }

        games.forEach((game, index) => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.style.backgroundImage = `url('${game.icon}')`;
            card.dataset.index = index;
            card.dataset.id = game.id;
            const titleOverlay = document.createElement('div');
            titleOverlay.className = 'title-overlay';
            titleOverlay.textContent = game.name;
            card.appendChild(titleOverlay);
            gridContainer.appendChild(card);
        });
        gridItems = Array.from(gridContainer.children);
        updateGridSelection(0);
    }

    function updateCategorySelection(newIndex) {
        categoryItems[currentCategoryIndex]?.classList.remove('selected');
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= categoryItems.length) newIndex = categoryItems.length - 1;
        currentCategoryIndex = newIndex;
        const selectedCard = categoryItems[currentCategoryIndex];
        selectedCard?.classList.add('selected');
        gameTitle.textContent = categories[currentCategoryIndex]?.name;
    }

    function updateGridSelection(newIndex, scroll = true) {
        if (gridItems.length === 0) return;
        gridItems[currentGridIndex]?.classList.remove('selected');
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= gridItems.length) newIndex = gridItems.length - 1;
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

    function exitBigPicture() {
        window.api.openMainView();
    }

    function openMenu() {
        if (isMenuOpen) return;
        isMenuOpen = true;
        menuOverlay.classList.add('active');
        menuItems = [menuBackButton, menuChangeCategoryButton, menuExitButton];
        updateMenuSelection(0);
        updateFooter('<span>(A)</span> Seleccionar &nbsp;&nbsp; <span>(B)</span> Volver');
    }

    function closeMenu() {
        if (!isMenuOpen) return;
        isMenuOpen = false;
        menuOverlay.classList.remove('active');
        // Restore correct footer for the current view
        if (currentView === 'grid') {
            updateFooter('<span>(A)</span> Iniciar &nbsp;&nbsp; <span>(B)</span> Atrás');
        } else {
            updateFooter('<span>(A)</span> Seleccionar &nbsp;&nbsp; <span>(B)</span> Salir');
        }
    }

    function updateMenuSelection(newIndex) {
        menuItems[menuCurrentIndex]?.classList.remove('selected');
        if (newIndex < 0) newIndex = menuItems.length - 1;
        if (newIndex >= menuItems.length) newIndex = 0;
        menuCurrentIndex = newIndex;
        menuItems[menuCurrentIndex]?.classList.add('selected');
    }

    function gamepadLoop() {
        const gp = navigator.getGamepads().find(g => g !== null);
        if (gp) {
            if (!gamepadConnected) {
                gamepadConnected = true;
            }
            const now = Date.now();
            if (now - lastInputTime > DEBOUNCE_MS) {
                let actionTaken = false;
                const axisX = gp.axes[0];
                const axisY = gp.axes[1];

                if (isMenuOpen) {
                    if (gp.buttons[12]?.pressed || axisY < -0.5) { updateMenuSelection(menuCurrentIndex - 1); actionTaken = true; } 
                    else if (gp.buttons[13]?.pressed || axisY > 0.5) { updateMenuSelection(menuCurrentIndex + 1); actionTaken = true; } 
                    else if (gp.buttons[0]?.pressed) { menuItems[menuCurrentIndex].click(); actionTaken = true; } 
                    else if (gp.buttons[1]?.pressed || gp.buttons[16]?.pressed) { closeMenu(); actionTaken = true; }
                } else if (currentView === 'categories') {
                    if (gp.buttons[14]?.pressed || axisX < -0.5) { updateCategorySelection(currentCategoryIndex - 1); actionTaken = true; } 
                    else if (gp.buttons[15]?.pressed || axisX > 0.5) { updateCategorySelection(currentCategoryIndex + 1); actionTaken = true; } 
                    else if (gp.buttons[0]?.pressed) { categoryItems[currentCategoryIndex].click(); actionTaken = true; } 
                    else if (gp.buttons[1]?.pressed) { exitBigPicture(); actionTaken = true; } 
                    else if (gp.buttons[16]?.pressed && !waitingForHomeRelease) { openMenu(); actionTaken = true; }
                } else if (currentView === 'grid') {
                    if (gp.buttons[12]?.pressed || axisY < -0.5) { moveInGrid('up'); actionTaken = true; } 
                    else if (gp.buttons[13]?.pressed || axisY > 0.5) { moveInGrid('down'); actionTaken = true; } 
                    else if (gp.buttons[14]?.pressed || axisX < -0.5) { moveInGrid('left'); actionTaken = true; } 
                    else if (gp.buttons[15]?.pressed || axisX > 0.5) { moveInGrid('right'); actionTaken = true; } 
                    else if (gp.buttons[0]?.pressed) { launchGame(); actionTaken = true; } 
                    else if (gp.buttons[1]?.pressed) { showCategorySelector(); actionTaken = true; } 
                    else if (gp.buttons[16]?.pressed && !waitingForHomeRelease) { openMenu(); actionTaken = true; }
                }

                if (actionTaken) lastInputTime = now;
            }
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
    loadAllGames();
    requestAnimationFrame(gamepadLoop);

    // --- Eventos de ratón y menú ---
    menuBackButton.addEventListener('click', closeMenu);
    menuChangeCategoryButton.addEventListener('click', () => {
        closeMenu();
        showCategorySelector();
    });
    menuExitButton.addEventListener('click', exitBigPicture);
    menuOverlay.addEventListener('click', (e) => {
        if (e.target === menuOverlay) closeMenu();
    });

    window.addEventListener('resize', () => {
        cols = getGridDimensions();
    });
});