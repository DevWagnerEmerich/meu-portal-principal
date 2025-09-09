document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const togglePasswordIcon = document.getElementById('toggle-password');

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
});