const bcrypt = require('bcrypt');
const db = require('./database.js');

const saltRounds = 10;
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@brincabytes.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';

async function createAdmin() {
    try {
        console.log('Verificando usuário admin...');

        // Verifica se o admin já existe
        const existingUser = await db('users')
            .where('username', adminUsername)
            .orWhere('email', adminEmail)
            .first();

        if (existingUser) {
            console.log('Usuário administrador já existe.');
            process.exit(0);
        }

        console.log('Criando novo administrador...');
        const hash = await bcrypt.hash(adminPassword, saltRounds);
        const now = Date.now();

        await db('users').insert({
            username: adminUsername,
            email: adminEmail,
            password: hash,
            role: 'admin',
            is_confirmed: 1,
            subscription_type: 'premium',
            last_login_date: now,
            created_at: now
        });

        console.log(`Usuário administrador '${adminUsername}' criado com sucesso!`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Senha: ${adminPassword}`);
        console.log('Por favor, altere a senha após o primeiro login.');

        process.exit(0);
    } catch (error) {
        console.error('Erro ao processar a criação do administrador:', error);
        process.exit(1);
    }
}

createAdmin();
