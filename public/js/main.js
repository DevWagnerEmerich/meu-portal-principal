document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const openMenuBtn = document.getElementById('open-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const sidebarMenu = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('overlay');
    const loggedOutActions = document.getElementById('logged-out-actions');
    const loggedInActions = document.getElementById('logged-in-actions');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const gameIframe = document.getElementById('gameIframe');
    const gameLoader = document.getElementById('gameLoader');
    const gameTimerDisplay = document.getElementById('game-timer');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const mySubscriptionsLink = document.getElementById('my-subscriptions-link');

    // Instâncias de Modais Bootstrap
    const gameModalElement = document.getElementById('gameModal');
    const gameModal = gameModalElement ? new bootstrap.Modal(gameModalElement) : null;
    const userAccountModalElement = document.getElementById('userAccountModal');
    const userAccountModal = userAccountModalElement ? new bootstrap.Modal(userAccountModalElement) : null;
    const subscriptionOptionsModalElement = document.getElementById('subscriptionOptionsModal');
    const subscriptionOptionsModal = subscriptionOptionsModalElement ? new bootstrap.Modal(subscriptionOptionsModalElement) : null;
    const loginPromptModalElement = document.getElementById('loginPromptModal');
    const loginPromptModal = loginPromptModalElement ? new bootstrap.Modal(loginPromptModalElement) : null;

    // Função para exibir toasts
    function showToast(message, type = 'success') {
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            console.warn('Toast container not found. Message:', message);
            return;
        }

        const toastId = `toast-${Date.now()}`;
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        const toastEl = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastEl);
        toast.show();

        // Remover o toast do DOM após ele ser escondido
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }

    // Variáveis de estado
    let countdownInterval;
    let gameSessionStartTime = 0;

    // --- FUNÇÕES PRINCIPAIS ---

    const updateNavbarUI = async () => {
        try {
            const response = await fetch('/api/user-status');
            const data = await response.json();
            if (data.loggedIn) {
                if (loggedOutActions) loggedOutActions.style.display = 'none';
                if (loggedInActions) loggedInActions.style.display = 'flex';
                if (usernameDisplay) {
                    usernameDisplay.href = '/profile.html'; // Garante que é um link
                    usernameDisplay.textContent = `Olá, ${data.username}`;
                }
                // Exporta a função updateUsername para ser acessível globalmente
                window.updateUsername = (newUsername) => {
                    if (usernameDisplay) usernameDisplay.textContent = `Olá, ${newUsername}`;
                };
            } else {
                if (loggedOutActions) loggedOutActions.style.display = 'flex';
                if (loggedInActions) loggedInActions.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro ao verificar status de login:', error);
        }
    };

    const openSidebar = () => { if (sidebarMenu) sidebarMenu.classList.add('open'); if (overlay) overlay.classList.add('open'); };
    const closeSidebar = () => { if (sidebarMenu) sidebarMenu.classList.remove('open'); if (overlay) overlay.classList.remove('open'); };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startCountdown = (duration) => {
        let remainingTime = duration;
        if (gameTimerDisplay) { gameTimerDisplay.style.display = 'block'; gameTimerDisplay.textContent = formatTime(remainingTime); }
        countdownInterval = setInterval(() => {
            remainingTime--;
            if (gameTimerDisplay) gameTimerDisplay.textContent = formatTime(remainingTime);
            if (remainingTime <= 0) {
                clearInterval(countdownInterval);
                if (gameTimerDisplay) gameTimerDisplay.style.display = 'none';
                if (gameModal) gameModal.hide();
                if (subscriptionOptionsModal) subscriptionOptionsModal.show();
            }
        }, 1000);
    };

    const stopCountdown = () => { clearInterval(countdownInterval); if (gameTimerDisplay) gameTimerDisplay.style.display = 'none'; };

    const loadAndShowGame = (gameSrc) => {
        if (gameLoader) gameLoader.style.display = 'flex';
        if (gameIframe) gameIframe.style.visibility = 'hidden';
        let iframeLoaded = false, timerElapsed = false;
        const showGameContent = () => {
            if (iframeLoaded && timerElapsed) {
                if (gameLoader) gameLoader.style.display = 'none';
                if (gameIframe) gameIframe.style.visibility = 'visible';
            }
        };
        if (gameIframe) {
            gameIframe.addEventListener('load', () => { iframeLoaded = true; showGameContent(); }, { once: true });
            gameIframe.src = gameSrc;
        }
        setTimeout(() => { timerElapsed = true; showGameContent(); }, 1500);
        if (gameModal) gameModal.show();
    };

    async function handleGamePlay(gameSrc) {
        if (!gameSrc || gameSrc === '#') {
            if(loginPromptModal) loginPromptModal.show();
            return;
        }
        try {
            const response = await fetch('/api/game-start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameSrc }) });
            const data = await response.json();
            if (response.ok) {
                gameSessionStartTime = Date.now();
                if (data.dailyTimeLeft > 0) {
                    startCountdown(data.dailyTimeLeft);
                } else {
                    if (subscriptionOptionsModal) subscriptionOptionsModal.show();
                    return;
                }
                loadAndShowGame(gameSrc);
            } else {
                if (response.status === 401) {
                    if (loginPromptModal) loginPromptModal.show();
                } else {
                    showToast(`Erro: ${data.message || response.statusText}`, 'danger');
                    if (data.message && data.message.includes('tempo diário')) {
                        if (subscriptionOptionsModal) subscriptionOptionsModal.show();
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao verificar status de jogo:', error);
        }
    }

    async function loadGames(filterCategory = 'all') {
        try {
            // Fetch most accessed and all games concurrently
            const [mostAccessedResponse, allGamesResponse] = await Promise.all([
                fetch('/api/games/most-accessed'),
                fetch('/games.json')
            ]);

            if (!mostAccessedResponse.ok) throw new Error(`HTTP error! status: ${mostAccessedResponse.status}`);
            if (!allGamesResponse.ok) throw new Error(`HTTP error! status: ${allGamesResponse.status}`);

            const featuredGames = await mostAccessedResponse.json();
            window.allGames = await allGamesResponse.json(); // Use window.allGames for the full list

            // Group games by category (using the full list - window.allGames)
            const gamesByCategory = window.allGames.reduce((acc, game) => {
                const category = game.category || 'Outros'; // Default category if not defined
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(game);
                return acc;
            }, {});

            const sidebarAccordion = document.getElementById('sidebarAccordion');
            if (sidebarAccordion) {
                // Clear existing dynamic categories (keep "Todos os Jogos" accordion item)
                sidebarAccordion.querySelectorAll('.accordion-item:not(:first-child)').forEach(item => item.remove());

                for (const category in gamesByCategory) {
                    const categoryId = category.replace(/\s+/g, '-').toLowerCase(); // Sanitize for ID
                    const accordionItem = `
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="heading-${categoryId}">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${categoryId}" aria-expanded="false" aria-controls="collapse-${categoryId}" data-category="${category}">
                                    ${category}
                                </button>
                            </h2>
                            <div id="collapse-${categoryId}" class="accordion-collapse collapse" aria-labelledby="heading-${categoryId}" data-bs-parent="#sidebarAccordion">
                                <div class="accordion-body">
                                    <ul class="list-unstyled">
                                        ${gamesByCategory[category].map(game => `
                                            <li><a href="#" class="game-link" data-game-id="${game.id}">${game.title}</a></li>
                                        `).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
                    sidebarAccordion.innerHTML += accordionItem;
                }
            }

            // Filter games for the main grid based on filterCategory
            let gamesToDisplay = window.allGames; // Start with the full list
            if (filterCategory !== 'all') {
                gamesToDisplay = window.allGames.filter(game => game.category === filterCategory);
            }

            const allGamesGrid = document.getElementById('all-games-grid');
            const carouselInner = document.querySelector('#featured-games-carousel .carousel-inner');
            const carouselIndicators = document.querySelector('#featured-games-carousel .carousel-indicators');

            // Clear existing content
            if (allGamesGrid) allGamesGrid.innerHTML = '';
            if (carouselInner) carouselInner.innerHTML = '';
            if (carouselIndicators) carouselIndicators.innerHTML = '';

            // Populate carousel with most accessed games
            featuredGames.forEach((game, index) => {
                const isActive = index === 0;
                const btnClass = game.is_premium ? 'btn-secondary disabled' : (game.game_url && game.game_url !== '#' ? 'btn-primary' : 'btn-secondary disabled');
                let carouselItemHTML = '';

                if (game.thumbnail) {
                    carouselItemHTML = `
                        <div class="carousel-item ${isActive ? 'active' : ''}">
                            <img src="${encodeURI(game.thumbnail)}" class="d-block w-100" alt="${game.title}" ${index === 0 ? '' : 'loading="lazy"'}>
                            <div class="carousel-caption d-none d-md-block">
                                <h5>${game.title}</h5>
                                <p>${game.description}</p>
                                <a href="${game.game_url}" class="btn ${btnClass} play-game-btn" data-game-src="${game.game_url}">Jogar</a>
                            </div>
                        </div>
                    `;
                } else {
                    // Placeholder slide for games without a thumbnail
                    carouselItemHTML = `
                        <div class="carousel-item ${isActive ? 'active' : ''} d-flex align-items-center justify-content-center" style="background-color: #495057; height: 400px;">
                            <div class="carousel-caption">
                                <h5>${game.title}</h5>
                                <p>${game.description}</p>
                                <a href="${game.game_url}" class="btn ${btnClass} play-game-btn" data-game-src="${game.game_url}">Jogar</a>
                            </div>
                        </div>
                    `;
                }
                if (carouselInner) carouselInner.innerHTML += carouselItemHTML;

                const indicatorHTML = `
                    <button type="button" data-bs-target="#featured-games-carousel" data-bs-slide-to="${index}" class="${isActive ? 'active' : ''}" aria-current="${isActive ? 'true' : 'false'}" aria-label="Slide ${index + 1}"></button>
                `;
                if (carouselIndicators) carouselIndicators.innerHTML += indicatorHTML;
            });

            // Populate all games grid (using gamesToDisplay)
            gamesToDisplay.forEach(game => {
                const isPlayable = game.game_url && game.game_url !== '#';
                const btnClass = game.is_premium ? 'btn-secondary disabled' : (isPlayable ? 'btn-primary' : 'btn-secondary disabled');
                const cardStyle = game.thumbnail ? `style="background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${encodeURI(game.thumbnail)}'); background-size: cover; background-position: center;"` : '';
                const cardClass = game.thumbnail ? 'has-image' : 'no-image';

                const allGamesCardHTML = `
                    <div class="game-card ${cardClass}" id="${game.id}" ${cardStyle}>
                        <h5 class="card-title">${game.title}</h5>
                        <p class="card-text">${game.description}</p>
                        <a href="${game.game_url}" class="btn ${btnClass} mt-auto play-game-btn" data-game-src="${game.game_url}">Jogar</a>
                    </div>
                `;
                if(allGamesGrid) allGamesGrid.innerHTML += allGamesCardHTML;
            });

            initializeGameButtons();
        } catch (error) {
            console.error('Falha ao carregar a lista de jogos:', error);
        }
    }

    function initializeGameButtons() {
        document.querySelectorAll('.play-game-btn').forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', async (event) => {
                event.preventDefault();
                const gameSrc = newButton.getAttribute('data-game-src');
                handleGamePlay(gameSrc); // Call the new centralized function
            });
        });
    }

    // --- EVENT LISTENERS ---
    if (openMenuBtn) openMenuBtn.addEventListener('click', openSidebar);
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) { logoutLink.addEventListener('click', async () => { await fetch('/api/logout', { method: 'POST' }); window.location.href = '/'; }); }
    if (fullscreenBtn) { fullscreenBtn.addEventListener('click', () => { if (gameIframe && gameIframe.requestFullscreen) { if (!document.fullscreenElement) {                         gameIframe.requestFullscreen().catch(err => showToast(`Não foi possível entrar em tela cheia: ${err.message}`, 'danger')); } else { document.exitFullscreen(); } } }); }
    if (usernameDisplay) { usernameDisplay.style.cursor = 'pointer'; usernameDisplay.addEventListener('click', () => { if (userAccountModal) userAccountModal.show(); }); }
    if (mySubscriptionsLink) { mySubscriptionsLink.addEventListener('click', (event) => { event.preventDefault(); if (userAccountModal) userAccountModal.hide(); if (subscriptionOptionsModal) subscriptionOptionsModal.show(); }); }
    if (gameModalElement) { gameModalElement.addEventListener('hidden.bs.modal', () => { stopCountdown(); if (gameIframe) { const c = gameIframe.src; gameIframe.src = ''; const d = Math.floor((Date.now() - gameSessionStartTime) / 1000); fetch('/api/game-stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameSrc: c, duration: d }) }); } }); }

    // Event listeners for category links (accordion buttons and game links)
    const sidebarAccordionElement = document.getElementById('sidebarAccordion');
    if (sidebarAccordionElement) {
        sidebarAccordionElement.addEventListener('click', (event) => {
            const target = event.target;
            // Check if the clicked element is an accordion button
            if (target.tagName === 'BUTTON' && target.classList.contains('accordion-button')) {
                const selectedCategory = target.getAttribute('data-category');
            }
            // Check if the clicked element is a game link inside an accordion
            if (target.tagName === 'A' && target.classList.contains('game-link')) {
                event.preventDefault(); // Prevent default link behavior
                const gameId = target.getAttribute('data-game-id');
                // Find the game object and load it
                const gameToLoad = window.allGames.find(game => game.id === gameId);
                if (gameToLoad && gameToLoad.game_url) {
                    handleGamePlay(gameToLoad.game_url); // Call the new centralized function
                    closeSidebar();
                }
            }
        });
    }

    // --- FORM LISTENERS ---
    if (registerForm) { registerForm.addEventListener('submit', async (e) => { e.preventDefault(); const u = document.getElementById('username').value, E = document.getElementById('email').value, p = document.getElementById('password').value; const r = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, email: E, password: p }) }); const j = await r.json(); if (r.ok) { alert(j.message); window.location.href = '/login.html'; } else { alert(`Erro: ${j.message}`); } }); }
    if (loginForm) {
        // Ao carregar a página, preenche o usuário se ele estiver salvo
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
            document.getElementById('username').value = rememberedUsername;
            document.getElementById('remember-me').checked = true;
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const rememberMeCheckbox = document.getElementById('remember-me');

            const username = usernameInput.value;
            const password = passwordInput.value;

            const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
            
            if (response.ok) {
                // Se o login for bem-sucedido, salva ou remove o username do localStorage
                if (rememberMeCheckbox.checked) {
                    localStorage.setItem('rememberedUsername', username);
                } else {
                    localStorage.removeItem('rememberedUsername');
                }
                window.location.href = '/index.html';
            } else {
                const result = await response.json();
                alert(`Erro: ${result.message}`);
            }
        });
    }
    const togglePasswordIcon = document.getElementById('toggle-password');
    if (togglePasswordIcon) {
        togglePasswordIcon.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePasswordIcon.classList.add('visible');
            } else {
                passwordInput.type = 'password';
                togglePasswordIcon.classList.remove('visible');
            }
        });
    }
    if (forgotPasswordForm) { forgotPasswordForm.addEventListener('submit', async (e) => { e.preventDefault(); const E = document.getElementById('email').value; const r = await fetch('/api/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: E }) }); const j = await r.json(); if (r.ok) { alert(j.message); } else { alert(`Erro: ${j.message}`); } }); }
    if (resetPasswordForm) { resetPasswordForm.addEventListener('submit', async (e) => { e.preventDefault(); const p = document.getElementById('password').value; if (p !== document.getElementById('confirm-password').value) { alert('As senhas não coincidem.'); return; } const t = new URLSearchParams(window.location.search).get('token'); if (!t) { alert('Token não encontrado.'); return; } const r = await fetch('/api/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: t, newPassword: p }) }); const j = await r.json(); if (r.ok) { alert(j.message); window.location.href = '/login.html'; } else { alert(`Erro: ${j.message}`); } }); }

    // --- INICIALIZAÇÃO DA PÁGINA ---
    updateNavbarUI();
    loadGames();
});

// --- LÓGICA DE PAGAMENTO (Fora do DOMContentLoaded principal para organização) ---
document.addEventListener('DOMContentLoaded', () => {
    const subscribeButtons = document.querySelectorAll('.subscribe-btn');
    if (subscribeButtons.length === 0) return;
    subscribeButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const btn = event.currentTarget;
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Carregando...';
            try {
                const { id, title, price } = btn.dataset;
                const response = await fetch('/api/create_preference', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, title, price }) });
                if (!response.ok) throw new Error('Falha ao criar preferência');
                const data = await response.json();
                window.location.href = data.checkout_url;
            } catch (error) {
                console.error('Erro no processo de assinatura:', error);
                alert('Ocorreu um erro ao iniciar o pagamento.');
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    });
});

// Garante que os botões de assinatura sejam reativados ao voltar para a página
window.addEventListener('pageshow', function(event) {
    const subscribeButtons = document.querySelectorAll('.subscribe-btn');
    subscribeButtons.forEach(button => {
        if (button.disabled) {
            button.disabled = false;
            const plan = button.dataset.id;
            if (plan === 'monthly') button.textContent = 'Assinar Mensal';
            else if (plan === 'semiannual') button.textContent = 'Assinar Semestral';
            else if (plan === 'annual') button.textContent = 'Assinar Anual';
        }
    });
});
