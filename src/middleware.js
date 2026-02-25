
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

const checkMaintenanceMode = async (req, res, next) => {
    // Rotas permitidas mesmo em manutenção
    const allowedPaths = ['/login', '/admin', '/api/admin', '/api/auth/login', '/assets', '/js', '/css'];
    if (allowedPaths.some(path => req.path.startsWith(path))) {
        return next();
    }

    try {
        const setting = await db('system_settings').where('key', 'maintenance_mode').first();
        if (setting && setting.value === 'true') {
            // Se for admin logado, pode passar
            if (req.session.userId) {
                const user = await db('users').where('id', req.session.userId).select('role').first();
                if (user && user.role === 'admin') {
                    return next();
                }
            }
            return res.status(503).send('<h1>Sistema em Manutenção</h1><p>Voltamos logo!</p>');
        }
        next();
    } catch (err) {
        console.error('Erro ao verificar modo manutenção:', err);
        next(); // Em caso de erro, deixa passar pra não travar o sistema
    }
};

const isAdmin = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized: Not logged in.' });
    }

    db('users').where('id', req.session.userId).select('role').first()
        .then(user => {
            if (!user || user.role !== 'admin') {
                return res.status(403).json({ message: 'Proibido: Você não tem privilégios de administrador.' });
            }
            next(); // Usuário é um administrador, prossiga
        })
        .catch(err => {
            console.error('Erro ao buscar função do usuário:', err.message);
            return res.status(500).json({ message: 'Erro do servidor ao verificar função.' });
        });
};

module.exports = { checkGameAccess, isAdmin, checkMaintenanceMode };
