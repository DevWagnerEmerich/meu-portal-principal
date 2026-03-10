const express = require('express');
const router = express.Router();
const config = require('../config');
const db = require('../database.js');
const { body, validationResult } = require('express-validator');

// Importando Mercado Pago SDK v2
const { MercadoPagoConfig, Preference, Payment, PreApproval } = require('mercadopago');
const { sendPaymentFailedEmail } = require('../email');


let client;
try {
  if (config.mercadopago && config.mercadopago.accessToken) {
    client = new MercadoPagoConfig({ accessToken: config.mercadopago.accessToken });
  } else {
    console.warn("⚠️ AVISO: MP_ACCESS_TOKEN não configurado no .env. Pagamentos falharão.");
  }
} catch (err) {
  console.error("Erro crítico ao inicializar Mercado Pago SDK:", err);
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

  // --- Lógica de Preços Dinâmica (DB) ---
  const standardPrices = {};
  const discountedPrices = {};

  try {
    // Buscar configurações de preços e descontos
    const settings = await db('system_settings').whereIn('key', [
      'monthly_plan_price',
      'semiannual_plan_price',
      'annual_plan_price',
      'welcome_discount_percent'
    ]);

    const prices = {
      monthly: parseFloat(settings.find(s => s.key === 'monthly_plan_price')?.value || BusinessRules.PLANS.monthly.price),
      semiannual: parseFloat(settings.find(s => s.key === 'semiannual_plan_price')?.value || BusinessRules.PLANS.semiannual.price),
      annual: parseFloat(settings.find(s => s.key === 'annual_plan_price')?.value || BusinessRules.PLANS.annual.price)
    };

    const discountPercent = parseFloat(settings.find(s => s.key === 'welcome_discount_percent')?.value || BusinessRules.WELCOME_OFFER.DISCOUNT_PERCENTAGE);
    const discountMultiplier = 1 - discountPercent;

    Object.keys(prices).forEach(key => {
      standardPrices[key] = prices[key];
      discountedPrices[key] = parseFloat((prices[key] * discountMultiplier).toFixed(2));
    });

  } catch (err) {
    console.error('Erro ao buscar preços do DB:', err);
    return res.status(500).json({ error: 'Erro interno ao calcular preços.' });
  }

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

    // Identificar se é uma renovação (tem assinatura válida no futuro)
    const isRenewal = user.subscription_end_date && user.subscription_end_date > Date.now();
    const successUrl = isRenewal
      ? `${config.domain}/subscription/checkout/success?type=renewal`
      : `${config.domain}/subscription/checkout/success?type=new`;

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
          success: successUrl,
          failure: `${config.domain}/subscription/checkout`,
          pending: `${config.domain}/subscription/checkout`
        },
        auto_return: 'approved',
        notification_url: config.isProduction ? 'https://brincabytes.vercel.app/api/payment/webhook' : `${config.domain}/api/payment/webhook`
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

// Nova Rota para Checkout Transparente via PIX
router.post('/create-pix-payment', [
  body('id', 'ID do plano inválido.').isIn(['monthly', 'semiannual', 'annual']),
  body('title', 'Título do plano é obrigatório.').notEmpty()
], async (req, res) => {
  if (!client) {
    return res.status(500).json({ error: 'Mercado Pago não está configurado no servidor.' });
  }

  if (!req.session.userId) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Erro de validação.', details: errors.array() });
  }

  const { id, title } = req.body;

  try {
    const user = await db('users').where('id', req.session.userId).select('created_at', 'email', 'username').first();
    if (!user) return res.status(500).json({ error: 'Usuário não encontrado.' });

    // Calcula Preço com/sem Desconto (Lógica espelhada da preferência)
    const settings = await db('system_settings').whereIn('key', ['monthly_plan_price', 'semiannual_plan_price', 'annual_plan_price', 'welcome_discount_percent']);
    const prices = {
      monthly: parseFloat(settings.find(s => s.key === 'monthly_plan_price')?.value || BusinessRules.PLANS.monthly.price),
      semiannual: parseFloat(settings.find(s => s.key === 'semiannual_plan_price')?.value || BusinessRules.PLANS.semiannual.price),
      annual: parseFloat(settings.find(s => s.key === 'annual_plan_price')?.value || BusinessRules.PLANS.annual.price)
    };
    const discountPercent = parseFloat(settings.find(s => s.key === 'welcome_discount_percent')?.value || BusinessRules.WELCOME_OFFER.DISCOUNT_PERCENTAGE);

    // Verifica oferta
    const offerDurationInMillis = BusinessRules.WELCOME_OFFER.DURATION_DAYS * 24 * 60 * 60 * 1000;
    const isOfferActive = Date.now() < (Number(user.created_at) + offerDurationInMillis);
    const finalPrice = isOfferActive ? parseFloat((prices[id] * (1 - discountPercent)).toFixed(2)) : prices[id];

    if (!finalPrice) return res.status(400).json({ error: 'Plano inválido.' });

    // Cria o pagamento PIX usando classe nativa `Payment`
    const payment = new Payment(client);

    // O id de idempotência previne duplicidade. (Opcional, mas boa prática). Usaremos um UUID ou timestamp
    const idempotencyKey = `pix_${req.session.userId}_${Date.now()}`;
    const webhookUrl = config.isProduction ? 'https://brincabytes.vercel.app/api/payment/webhook' : `${config.domain}/api/payment/webhook`;

    const result = await payment.create({
      body: {
        transaction_amount: finalPrice,
        description: `BrincaBytes - ${title}`,
        payment_method_id: 'pix',
        payer: {
          email: user.email,
          first_name: user.username
        },
        external_reference: JSON.stringify({
          userId: req.session.userId,
          planId: id,
          planTitle: title
        }),
        notification_url: webhookUrl
      },
      requestOptions: { idempotencyKey }
    });

    if (result.point_of_interaction?.transaction_data) {
      const pixData = result.point_of_interaction.transaction_data;
      res.json({
        success: true,
        qr_code: pixData.qr_code,
        qr_code_base64: pixData.qr_code_base64,
        payment_id: result.id
      });
    } else {
      throw new Error(`Mercado Pago não retornou os dados do PIX: ${JSON.stringify(result)}`);
    }

  } catch (error) {
    console.error('Erro ao criar PIX transparente:', error);
    res.status(500).json({ error: error.message || 'Erro interno ao gerar PIX.' });
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
          try {
            await db('processed_payments').insert({
              payment_id: id.toString(),
              user_id: metadata.userId.toString(),
              plan_id: metadata.planId,
              processed_at: Date.now()
            });
            // O insert funcinou. Pagamento é inédito!
            await activateUserPlan(metadata.userId, metadata.planId, metadata.planTitle);
            console.log(`✅ Pagamento ${id} aprovado para User ${metadata.userId} (Plano: ${metadata.planId})`);
          } catch (insertErr) {
            // Se der erro de Unique Constraint (SQLITE_CONSTRAINT ou 23505 no Postgres) significa que o webhook bateu repetido
            if (insertErr.code === 'SQLITE_CONSTRAINT' || insertErr.code === '23505') {
              console.log(`❕ Webhook Duplicado Ignorado: O pagamento ${id} já foi processado anteriormente.`);
            } else {
              console.error(`Erro ao registrar idempotência do pagamento ${id}:`, insertErr);
            }
          }
        } else {
          console.warn(`⚠️ Pagamento aprovado sem external_reference válida: ${id}`);
        }
      }

    } else if (topic === 'preapproval') {
      // ===== NOVO HANDLER — Assinaturas Recorrentes =====
      if (!id) return res.sendStatus(200);

      const preapprovalClient = new PreApproval(client);
      const preapproval = await preapprovalClient.get({ id: id });

      if (!preapproval) return res.sendStatus(200);

      const user = await db('users').where('mp_preapproval_id', id.toString()).first();
      if (!user) {
        console.warn(`⚠️ Webhook Preapproval: nenhum usuário encontrado para preapproval_id=${id}`);
        return res.sendStatus(200);
      }

      console.log(`🔄 Preapproval ${id} status: ${preapproval.status} → User ${user.id}`);

      if (preapproval.status === 'authorized') {
        // Cobrança recorrente bem-sucedida: renova mais 30 dias
        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + 30);
        await db('users').where('id', user.id).update({
          subscription_type: 'monthly',
          subscription_end_date: newEndDate.getTime(),
          subscription_status: 'active',
          grace_period_ends_at: null
        });
        console.log(`✅ Preapproval renovado para User ${user.id}. Expira: ${newEndDate.toISOString()}`);

      } else if (preapproval.status === 'paused') {
        // Falha de cobrança: carência de 3 dias + e-mail de alerta
        const gracePeriodEndsAt = Date.now() + (3 * 24 * 60 * 60 * 1000);
        await db('users').where('id', user.id).update({
          subscription_status: 'past_due',
          grace_period_ends_at: gracePeriodEndsAt
        });
        console.log(`⚠️ Preapproval pausado para User ${user.id}. Carência até: ${new Date(gracePeriodEndsAt).toISOString()}`);

        // Email de aviso sem bloquear o response
        sendPaymentFailedEmail(user.email, user.username, gracePeriodEndsAt).catch(err => {
          console.error('Erro ao enviar e-mail de falha de pagamento:', err);
        });

      } else if (preapproval.status === 'cancelled') {
        // Cancelada: reverte para gratuito
        await db('users').where('id', user.id).update({
          subscription_type: 'none',
          subscription_end_date: null,
          subscription_status: 'canceled',
          mp_preapproval_id: null,
          grace_period_ends_at: null
        });
        console.log(`❌ Preapproval cancelado para User ${user.id}.`);
      }
    }

    // Sempre responder 200 para o MP não ficar reenviando
    res.sendStatus(200);

  } catch (error) {
    console.error('Erro no Webhook MP:', error);
    res.sendStatus(500);
  }
});

// Nova Rota para Checar Status do Pagamento (Polling do PIX)
router.get('/status/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  const paymentId = req.params.id;

  if (!paymentId) {
    return res.status(400).json({ error: 'ID do pagamento não fornecido.' });
  }

  try {
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    if (payment) {
      res.json({ status: payment.status });
    } else {
      res.status(404).json({ error: 'Pagamento não encontrado.' });
    }
  } catch (error) {
    console.error(`Erro ao checar status do pagamento ${paymentId}:`, error);
    res.status(500).json({ error: 'Erro ao conectar com Mercado Pago.' });
  }
});


// Funções Auxiliares de Ativação (Reutilizada e simplificada)
async function activateUserPlan(userId, planId, planTitle) {
  if (!userId || !planId) return;

  let durationDays = 30;
  if (BusinessRules.PLANS[planId]) {
    durationDays = BusinessRules.PLANS[planId].duration_days;
  }

  try {
    // Busca o usuário atual para ver se ele já tem dias de saldo
    const user = await db('users').where('id', userId).select('subscription_end_date').first();

    let baseDate = new Date();

    // Se o usuário tem uma assinatura ativa, adicionamos os novos dias à data de expiração existente (Empilhar)
    if (user && user.subscription_end_date && user.subscription_end_date > Date.now()) {
      baseDate = new Date(Number(user.subscription_end_date));
    }

    baseDate.setDate(baseDate.getDate() + durationDays);

    await db('users')
      .where('id', userId)
      .update({
        subscription_type: planTitle || planId,
        subscription_end_date: baseDate.getTime()
      });

    console.log(`✅ Plano Ativado: User ${userId} ganhou +${durationDays} dias. Expira em: ${baseDate.toISOString()}`);
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

  // --- Lógica de Preços Dinâmica (DB) ---
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

  } catch (err) {
    console.error('Erro ao buscar preços (GET):', err);
    // Fallback para hardcoded se falhar DB
    const prices = { monthly: 19.00, semiannual: 99.00, annual: 179.00 }; // Backup
    // ... (simplificado para não duplicar código de erro)
    return res.status(500).json({ error: 'Erro interno ao buscar planos.' });
  }

  try {
    const user = await db('users').where('id', req.session.userId).select('created_at').first();

    if (!user) {
      return res.json({ plans: standardPrices, isOfferActive: false });
    }

    const offerDurationInMillis = BusinessRules.WELCOME_OFFER.DURATION_DAYS * 24 * 60 * 60 * 1000;
    const offerEndDate = Number(user.created_at) + offerDurationInMillis;
    const isOfferActive = Date.now() < offerEndDate;

    const plans = isOfferActive ? discountedPrices : standardPrices;
    res.json({ plans, isOfferActive });
  } catch (err) {
    console.error('Erro ao buscar planos', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// Rota para criar Assinatura Recorrente com 1 mês de Trial (Cartão de Crédito)
router.post('/create-subscription', [
  body('cardToken', 'Card token é obrigatório.').notEmpty(),
  body('payerEmail', 'E-mail do pagador é obrigatório.').isEmail()
], async (req, res) => {
  if (!client) return res.status(500).json({ error: 'Mercado Pago não está configurado.' });
  if (!req.session.userId) return res.status(401).json({ error: 'Usuário não autenticado.' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Dados inválidos.', details: errors.array() });

  const { cardToken, payerEmail, payerFirstName, payerLastName } = req.body;

  try {
    const user = await db('users').where('id', req.session.userId).first();
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    if (user.mp_preapproval_id) {
      return res.status(409).json({ error: 'Usuário já possui uma assinatura recorrente ativa.' });
    }

    // Busca preço mensal do banco (respeita configuração do Admin)
    const settings = await db('system_settings').whereIn('key', ['monthly_plan_price', 'welcome_discount_percent']);
    const basePrice = parseFloat(settings.find(s => s.key === 'monthly_plan_price')?.value || BusinessRules.PLANS.monthly.price);
    const discountPercent = parseFloat(settings.find(s => s.key === 'welcome_discount_percent')?.value || BusinessRules.WELCOME_OFFER.DISCOUNT_PERCENTAGE);

    const offerDurationInMillis = BusinessRules.WELCOME_OFFER.DURATION_DAYS * 24 * 60 * 60 * 1000;
    const isOfferActive = Date.now() < (Number(user.created_at) + offerDurationInMillis);
    const finalPrice = isOfferActive
      ? parseFloat((basePrice * (1 - discountPercent)).toFixed(2))
      : basePrice;

    const preapproval = new PreApproval(client);
    const webhookUrl = config.isProduction
      ? 'https://brincabytes.vercel.app/api/payment/webhook'
      : `${config.domain}/api/payment/webhook`;

    const result = await preapproval.create({
      body: {
        reason: 'BrincaBytes — Plano Mensal',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: finalPrice,
          currency_id: 'BRL',
          free_trial: {
            frequency: 1,
            frequency_type: 'months'
          }
        },
        back_url: `${config.domain}/profile`,
        payer_email: payerEmail,
        card_token_id: cardToken,
        status: 'authorized',
        notification_url: webhookUrl
      }
    });

    // Salva no banco: trial ativo por 30 dias
    const trialEndsAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
    await db('users').where('id', req.session.userId).update({
      mp_preapproval_id: result.id,
      subscription_type: 'monthly',
      subscription_status: 'trial',
      subscription_end_date: trialEndsAt,
      grace_period_ends_at: null
    });

    console.log(`✅ Preapproval criado: ${result.id} para User ${req.session.userId}. Trial até: ${new Date(trialEndsAt).toISOString()}`);
    res.json({ success: true, preapproval_id: result.id });

  } catch (error) {
    console.error('Erro ao criar Preapproval:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar assinatura.' });
  }
});

// Rota para Cancelar Assinatura Recorrente
router.post('/cancel-subscription', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Usuário não autenticado.' });

  try {
    const user = await db('users').where('id', req.session.userId).select('mp_preapproval_id').first();

    if (!user || !user.mp_preapproval_id) {
      return res.status(400).json({ error: 'Nenhuma assinatura recorrente encontrada para este usuário.' });
    }

    const preapproval = new PreApproval(client);
    await preapproval.update({
      id: user.mp_preapproval_id,
      body: { status: 'cancelled' }
    });

    // Reverte usuário para plano gratuito
    await db('users').where('id', req.session.userId).update({
      subscription_type: 'none',
      subscription_end_date: null,
      subscription_status: 'canceled',
      mp_preapproval_id: null,
      grace_period_ends_at: null
    });

    console.log(`❌ Assinatura cancelada pelo User ${req.session.userId}`);
    res.json({ success: true, message: 'Assinatura cancelada com sucesso.' });

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: error.message || 'Erro ao cancelar assinatura.' });
  }
});

module.exports = router;
