const bcrypt = require('bcrypt');
const db = require('./database.js');

const saltRounds = 10;
const adminUsername = 'admin';
const newPassword = 'adminpassword'; // A senha que estamos definindo

async function resetAdminPassword() {
    console.log(`Iniciando redefinição de senha para o usuário '${adminUsername}'...`);
    try {
        const hash = await bcrypt.hash(newPassword, saltRounds);
        const sql = 'UPDATE users SET password = ? WHERE username = ?';

        db.run(sql, [hash, adminUsername], function(err) {
            if (err) {
                console.error('Erro ao redefinir a senha do administrador:', err.message);
            } else if (this.changes === 0) {
                console.log(`Usuário administrador '${adminUsername}' não encontrado. Execute o script 'create-admin.js' primeiro.`);
            } else {
                console.log(`Senha do usuário '${adminUsername}' foi redefinida com sucesso.`);
                console.log(`A nova senha é: ${newPassword}`);
            }
            db.close((err) => {
                if (err) {
                    console.error('Erro ao fechar a conexão com o banco de dados:', err.message);
                }
            });
        });
    } catch (error) {
        console.error('Erro no processo de redefinição de senha:', error);
        db.close();
    }
}

resetAdminPassword();
