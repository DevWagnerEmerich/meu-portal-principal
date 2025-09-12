
const db = require('./database.js');

// Middleware to check user access for games
const checkGameAccess = (req, res, next) => {
    const gamePath = req.path;
    // Aplica o middleware apenas aos arquivos HTML dentro das pastas de jogos
    const isGameRoute = gamePath.match(/\/games\/([a-zA-Z0-9_-]+)\/index\.html/);

    if (!isGameRoute) {
        return next();
    }

    // Apenas verifica se o usuário está logado. A contagem de jogadas será feita no game-start.
    if (!req.session.userId) {
        return res.redirect('/login.html?reason=login_required');
    }

    // Se estiver logado, permite o carregamento da página do jogo.
    // A decisão de "gastar" a jogada ou não será no clique do botão "jogar".
    next();
};

const isAdmin = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized: Not logged in.' });
    }

    db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err) {
            console.error('Erro ao buscar função do usuário:', err.message);
            return res.status(500).json({ message: 'Erro do servidor ao verificar função.' });
        }
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Proibido: Você não tem privilégios de administrador.' });
        }
        next(); // Usuário é um administrador, prossiga
    });
};

module.exports = { checkGameAccess, isAdmin };
