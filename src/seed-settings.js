const db = require('./database');

async function seedSettings() {
    const settings = [
        { key: 'free_plays_limit', value: '5', type: 'number', description: 'Número de jogadas grátis por dia' },
        { key: 'maintenance_mode', value: 'false', type: 'boolean', description: 'Ativar modo de manutenção' },
        { key: 'welcome_discount_percent', value: '0.25', type: 'number', description: 'Percentual de desconto de boas-vindas (0.0 a 1.0)' },
        { key: 'monthly_plan_price', value: '19.90', type: 'number', description: 'Preço do plano mensal' }
    ];

    for (const setting of settings) {
        const exists = await db('system_settings').where({ key: setting.key }).first();
        if (!exists) {
            await db('system_settings').insert(setting);
            console.log(`Inserted setting: ${setting.key}`);
        } else {
            // Opcional: Atualizar se necessário, mas melhor respeitar o valor atual do banco
        }
    }
    console.log('Setup settings finished.');
    process.exit(0);
}

seedSettings();
