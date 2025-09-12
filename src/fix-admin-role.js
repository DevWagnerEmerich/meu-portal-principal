const db = require('./database.js');

const adminUsername = 'admin';

function fixAdminRole() {
    console.log(`Iniciando correção da role para o usuário '${adminUsername}'...`);
    
    // Também define is_confirmed=1 para garantir
    const sql = `UPDATE users SET role = 'admin', is_confirmed = 1 WHERE username = ?`;

    db.run(sql, [adminUsername], function(err) {
        if (err) {
            console.error('Erro ao corrigir a role do administrador:', err.message);
        } else if (this.changes === 0) {
            console.log(`Usuário administrador '${adminUsername}' não encontrado.`);
        } else {
            console.log(`Role do usuário '${adminUsername}' foi corrigida para 'admin'.`);
        }
        db.close((err) => {
            if (err) {
                console.error('Erro ao fechar a conexão com o banco de dados:', err.message);
            }
        });
    });
}

fixAdminRole();
