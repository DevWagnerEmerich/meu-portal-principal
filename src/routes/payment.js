const express = require('express');
const router = express.Router();
const config = require('../config');
const db = require('../database.js');
const { body, validationResult } = require('express-validator');

// Importando Mercado Pago SDK v2
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

let client;
if (config.mercadopago.accessToken) {
  client = new MercadoPagoConfig({ accessToken: config.mercadopago.accessToken });
} else {
  console.warn("⚠️ AVISO: MP_ACCESS_TOKEN não configurado. Pagamentos falharão.");
}

const BusinessRules = require('../business-rules');

// Rota para criar a Preferência de Pagamento (Checkout)
router.post('/create-checkout-session', [
  body('id', 'ID do plano inválido.').isIn(['monthly', 'semiannual', 'annual']),
  body('title', 'Título do plano é obrigatório.').notEmpty()
], async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Erro de validação.', details: errors.array() });
  }

  const { id, title } = req.body;

  // --- Lógica de Preços (Reutilizada) ---
  const standardPrices = {};
  Object.values(BusinessRules.PLANS).forEach(plan => standardPrices[plan.id] = plan.price);

  const discountedPrices = {};
  Object.values(BusinessRules.PLANS).forEach(plan => {
    discountedPrices[plan.id] = parseFloat((plan.price * BusinessRules.WELCOME_OFFER.DISCOUNT_MULTIPLIER).toFixed(2));
  });

  try {
    const user = await db('users').where('id', req.session.userId).select('created_at', 'email', 'username').first();

    if (!user) {
      return res.status(500).json({ error: 'Usuário não encontrado.' });
    }

    // Verifica oferta
    const offerDurationInMillis = BusinessRules.WELCOME_OFFER.DURATION_DAYS * 24 * 60 * 60 * 1000;
    const offerEndDate = Number(user.created_at) + offerDurationInMillis;
    const isOfferActive = Date.now() < offerEndDate;

    const priceMap = isOfferActive ? discountedPrices : standardPrices;
    const finalPrice = priceMap[id];

    if (!finalPrice) {
      return res.status(400).json({ error: 'Plano inválido.' });
    }

    // --- Criação da Preferência no Mercado Pago ---
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: id,
            title: title,
            quantity: 1,
            unit_price: finalPrice,
            currency_id: 'BRL',
            description: id === 'monthly' ? 'Assinatura Mensal' : `Acesso por ${BusinessRules.PLANS[id].duration_days} dias`
          }
        ],
        payer: {
          name: user.username,
          email: user.email
        },
        // External Reference é CRUCIAL: Usamos para saber QUEM pagou no Webhook
        external_reference: JSON.stringify({
          userId: req.session.userId,
          planId: id,
          planTitle: title
        }),
        back_urls: {
          success: `${config.domain}/subscription/checkout/success`,
          failure: `${config.domain}/subscription/checkout`,
          pending: `${config.domain}/subscription/checkout`
        },
        auto_return: 'approved',
        notification_url: `${config.domain}/api/payment/webhook`
        // Em localhost, webhook não funciona sem túnel (ngrok).
        // Recomendo usar ngrok http 3001 e colocar a URL no .env DOMAIN
      }
    });

    // Retorna a URL de redirecionamento (init_point = Checkout Pro)
    res.json({ url: result.init_point });

  } catch (error) {
    console.error('Erro ao criar preferência do Mercado Pago:', error);
    res.status(500).json({ error: error.message || 'Erro interno ao processar pagamento.' });
  }
});

// Webhook do Mercado Pago
router.post('/webhook', async (req, res) => {
  // O MP manda query params (data.id ou id) e type ou topic
  const { type, data } = req.body;
  const query = req.query;

  const id = data?.id || query.id || query['data.id'];
  const topic = type || query.topic || query.type;

  console.log(`🔔 Webhook recebido: Topic=${topic}, ID=${id}`);

  try {
    if (topic === 'payment' || topic === 'collection') { // collection é legacy, payment é novo
      if (!id) return res.sendStatus(200);

      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: id });

      if (payment && payment.status === 'approved') {
        const metadata = payment.external_reference ? JSON.parse(payment.external_reference) : null;

        if (metadata && metadata.userId) {
          await activateUserPlan(metadata.userId, metadata.planId, metadata.planTitle);
          console.log(`✅ Pagamento ${id} aprovado para User ${metadata.userId} (Plano: ${metadata.planId})`);
        } else {
          console.warn(`⚠️ Pagamento aprovado sem external_reference válida: ${id}`);
        }
      }
    }
    // Sempre responder 200/201 para o MP não ficar reenviando
    res.sendStatus(200);

  } catch (error) {
    console.error('Erro no Webhook MP:', error);
    res.sendStatus(500);
  }
});


// Funções Auxiliares de Ativação (Reutilizada e simplificada)
async function activateUserPlan(userId, planId, planTitle) {
  if (!userId || !planId) return;

  let durationDays = 30;
  if (BusinessRules.PLANS[planId]) {
    durationDays = BusinessRules.PLANS[planId].duration_days;
  }

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + durationDays);

  try {
    await db('users')
      .where('id', userId)
      .update({
        subscription_type: planTitle || planId,
        subscription_end_date: expirationDate.getTime()
      });
  } catch (err) {
    console.error('Erro ao salvar plano no banco:', err);
  }
}

// Rota de Informações dos Planos (para o Frontend desenhar os cards)
// Mantém exatamente a mesma interface do frontend
router.get('/plans', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  const standardPrices = {
    monthly: { ...BusinessRules.PLANS.monthly, features: ['Acesso a todos os jogos', 'Suporte por e-mail'] },
    semiannual: { ...BusinessRules.PLANS.semiannual, features: ['Acesso a todos os jogos', 'Suporte prioritário', 'Acesso antecipado a novos jogos'] },
    annual: { ...BusinessRules.PLANS.annual, features: ['Todos os benefícios do plano semestral', 'Desconto de 15% em comparação com o plano mensal'] }
  };

  const discountedPrices = {};
  Object.keys(standardPrices).forEach(key => {
    discountedPrices[key] = {
      ...standardPrices[key],
      price: parseFloat((standardPrices[key].price * BusinessRules.WELCOME_OFFER.DISCOUNT_MULTIPLIER).toFixed(2))
    };
  });

  try {
    const user = await db('users').where('id', req.session.userId).select('created_at').first();

    if (!user) {
      return res.json({ plans: standardPrices, isOfferActive: false });
    }

    const offerDurationInMillis = BusinessRules.WELCOME_OFFER.DURATION_DAYS * 24 * 60 * 60 * 1000;
    const offerEndDate = user.created_at + offerDurationInMillis;
    const isOfferActive = Date.now() < offerEndDate;

    const plans = isOfferActive ? discountedPrices : standardPrices;
    res.json({ plans, isOfferActive });
  } catch (err) {
    console.error('Erro ao buscar planos', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
