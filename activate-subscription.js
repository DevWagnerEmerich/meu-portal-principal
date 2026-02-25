require('dotenv').config();
const db = require('./src/database.js');

async function manuallyActivateLastUser() {
    try {
        console.log("Conectando ao banco de dados...");
        const client = db.client.config.client;
        console.log(`Cliente DB (producao expected = pg):`, client);

        // Pega o usuário mais recente criado ou o administrador (assumindo que o Dev testou recentemente)
        // O ideal é buscar o usuário que estava logado
        // Ordena por created_at descrecente
        const user = await db('users').orderBy('created_at', 'desc').first();

        if (!user) {
            console.error("Nenhum usuário encontrado no banco de dados.");
            process.exit(1);
        }

        console.log(`Encontrado usuário recente: ${user.username} (${user.email})`);

        // Dá 1 mês de VIP pra ele já que ele pagou agorinha!
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);

        console.log("Ativando Plano Mensal...");
        const count = await db('users')
            .where('id', user.id)
            .update({
                subscription_type: 'monthly',
                subscription_end_date: expirationDate.getTime()
            });

        console.log(`Status de atualização: ${count} linha(s) modificada(s).`);
        console.log(`🚀 Sucesso! A conta do ${user.username} (ID: ${user.id}) agora é VIP MENSAL!`);

    } catch (err) {
        console.error("Erro na operação:", err);
    } finally {
        process.exit(0);
    }
}

manuallyActivateLastUser();
