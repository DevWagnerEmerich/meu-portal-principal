document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');

    // Sidebar elements
    const openMenuBtn = document.getElementById('open-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const sidebarMenu = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('overlay');

    // Navbar action elements
    const loggedOutActions = document.getElementById('logged-out-actions');
    const loggedInActions = document.getElementById('logged-in-actions');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');

    // Function to update navbar UI based on login status
    const updateNavbarUI = async () => {
        console.log('updateNavbarUI called');
        try {
            const response = await fetch('/api/user-status');
            const data = await response.json();
            console.log('API user-status response:', data);

            if (data.loggedIn) {
                console.log('User is logged in');
                if (loggedOutActions) loggedOutActions.style.display = 'none';
                if (loggedInActions) loggedInActions.style.display = 'flex';
                if (usernameDisplay) usernameDisplay.textContent = `Olá, ${data.username}`;
            } else {
                console.log('User is NOT logged in');
                if (loggedOutActions) loggedOutActions.style.display = 'flex';
                if (loggedInActions) loggedInActions.style.display = 'none';
            }
        } catch (error) {
            console.error('Erro ao verificar status de login:', error);
            // Default to logged out state on error
            if (loggedOutActions) loggedOutActions.style.display = 'flex';
            if (loggedInActions) loggedInActions.style.display = 'none';
        }
    };

    // Function to open sidebar
    const openSidebar = () => {
        sidebarMenu.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden'; // Prevent scrolling body
    };

    // Function to close sidebar
    const closeSidebar = () => {
        sidebarMenu.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = ''; // Restore scrolling
    };

    // Event listeners for sidebar
    if (openMenuBtn) {
        openMenuBtn.addEventListener('click', openSidebar);
    }
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeSidebar);
    }
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/logout', {
                    method: 'POST',
                });
                const result = await response.json();
                if (response.ok) {
                    window.location.href = '/'; // Redirect to homepage after logout
                } else {
                    alert(`Erro ao fazer logout: ${result.message}`); // Keep error alert for now
                }
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                alert('Erro de rede ao tentar fazer logout.');
            }
        });
    }

    // Form submission logic
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                window.location.href = '/login.html'; // Redireciona para a página de login
            } else {
                alert(`Erro: ${result.message}`);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (response.ok) {
                window.location.href = '/index.html'; // Redireciona para a página principal
            } else {
                // Optionally, display a more subtle error message on the page
                // console.error(`Erro de login: ${result.message}`);
            }
        });
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;

            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
            } else {
                alert(`Erro: ${result.message}`);
            }
        });
    }

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                alert('As senhas não coincidem.');
                return;
            }

            // Get token from URL
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            if (!token) {
                alert('Token de redefinição de senha não encontrado na URL.');
                return;
            }

            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                window.location.href = '/login.html'; // Redireciona para a página de login
            } else {
                alert(`Erro: ${result.message}`);
            }
        });
    }

    // Call updateNavbarUI on page load
    updateNavbarUI();

    // Handle game modal iframe source
    // Ensure modal is closed on page load (useful for browser back button)
    const gameModalElement = document.getElementById('gameModal');
    if (gameModalElement) {
        const modalInstance = bootstrap.Modal.getInstance(gameModalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    }

    const gameModal = document.getElementById('gameModal');
    const gameIframe = gameModal ? gameModal.querySelector('#gameIframe') : null;
    const gameLoader = gameModal ? gameModal.querySelector('#gameLoader') : null;

    // Function to handle game loading and display
    const loadAndShowGame = (gameSrc) => {
        if (gameLoader) gameLoader.style.display = 'flex';
        if (gameIframe) gameIframe.style.visibility = 'hidden';

        let iframeLoaded = false;
        let timerElapsed = false;

        const showGameContent = () => {
            if (iframeLoaded && timerElapsed) {
                if (gameLoader) {
                    gameLoader.style.display = 'none';
                    gameLoader.style.visibility = 'hidden';
                }
                if (gameIframe) gameIframe.style.visibility = 'visible';
            }
        };

        if (gameIframe) {
            gameIframe.addEventListener('load', () => {
                iframeLoaded = true;
                showGameContent();
            }, { once: true });

            gameIframe.src = gameSrc;
        }

        setTimeout(() => {
            timerElapsed = true;
            showGameContent();
        }, 2000);

        // Manually show the modal
        const bsGameModal = new bootstrap.Modal(gameModal);
        bsGameModal.show();
    };

    // Event listener for all "Jogar" buttons
    document.querySelectorAll('.play-game-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default Bootstrap modal behavior

            const gameSrc = button.getAttribute('data-game-src');

            try {
                const response = await fetch('/api/user-status');
                const data = await response.json();

                if (data.loggedIn) {
                    loadAndShowGame(gameSrc);
                } else {
                    const loginPromptModal = new bootstrap.Modal(document.getElementById('loginPromptModal'));
                    loginPromptModal.show();
                }
            } catch (error) {
                console.error('Erro ao verificar status de login:', error);
                alert('Ocorreu um erro ao verificar seu status de login. Tente novamente.');
            }
        });
    });

    // Handle game modal closing
    if (gameModal) {
        gameModal.addEventListener('hidden.bs.modal', event => {
            if (gameIframe) gameIframe.src = ''; // Clear src to stop game

            // Send game stop signal to backend
            fetch('/api/game-stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameSrc: gameIframe.src }) // Send game identifier
            }).then(response => {
                if (!response.ok) console.error('Failed to send game stop signal');
            }).catch(error => console.error('Error sending game stop signal:', error));
        });
    }

    // Fullscreen functionality for game iframe
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            const gameIframe = document.getElementById('gameIframe');
            if (gameIframe) {
                if (!document.fullscreenElement) {
                    gameIframe.requestFullscreen().catch(err => {
                        console.error(`Erro ao tentar entrar em tela cheia: ${err.message} (${err.name})`);
                        alert('Seu navegador não permite tela cheia para este elemento ou a permissão foi negada.');
                    });
                } else {
                    document.exitFullscreen();
                }
            }
        });
    }
});