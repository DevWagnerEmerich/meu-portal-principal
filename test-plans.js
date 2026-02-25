require('dotenv').config();
const db = require('./src/database.js');
const BusinessRules = require('./src/business-rules.js');

async function testPlans() {
    const standardPrices = {};
    const discountedPrices = {};

    try {
        const settings = await db('system_settings').whereIn('key', [
            'monthly_plan_price', 'semiannual_plan_price', 'annual_plan_price', 'welcome_discount_percent'
        ]);

        const prices = {
            monthly: parseFloat(settings.find(s => s.key === 'monthly_plan_price')?.value || BusinessRules.PLANS.monthly.price),
            semiannual: parseFloat(settings.find(s => s.key === 'semiannual_plan_price')?.value || BusinessRules.PLANS.semiannual.price),
            annual: parseFloat(settings.find(s => s.key === 'annual_plan_price')?.value || BusinessRules.PLANS.annual.price)
        };

        const discountPercent = parseFloat(settings.find(s => s.key === 'welcome_discount_percent')?.value || BusinessRules.WELCOME_OFFER.DISCOUNT_PERCENTAGE);
        const discountMultiplier = 1 - discountPercent;

        // Montar objetos de estrutura
        standardPrices.monthly = { ...BusinessRules.PLANS.monthly, price: prices.monthly, features: ['Acesso a todos os jogos', 'Suporte por e-mail'] };
        standardPrices.semiannual = { ...BusinessRules.PLANS.semiannual, price: prices.semiannual, features: ['Acesso a todos os jogos', 'Suporte prioritário', 'Acesso antecipado a novos jogos'] };
        standardPrices.annual = { ...BusinessRules.PLANS.annual, price: prices.annual, features: ['Todos os benefícios do plano semestral', 'Desconto de 15% em comparação com o plano mensal'] };

        Object.keys(standardPrices).forEach(key => {
            discountedPrices[key] = {
                ...standardPrices[key],
                price: parseFloat((prices[key] * discountMultiplier).toFixed(2)),
                original_price: standardPrices[key].price
            };
        });

        console.log("Discounted Prices Payload:", JSON.stringify(discountedPrices, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
testPlans();
