const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const config = require('../config');
const { sendEmail } = require('../email.js');
const db = require('../database.js');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const BusinessRules = require('../business-rules');

// Rota para enviar a Public Key para o frontend
router.get('/config', (req, res) => {
  res.json({ publicKey: config.mercadoPago.publicKey });
});

<<<<<<< HEAD
// Importa o SDK do Mercado Pago
const { MercadoPagoConfig, Preference } = require('mercadopago');

=======
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
// Configura o cliente do Mercado Pago com o Access Token
const client = new MercadoPagoConfig({ accessToken: config.mercadoPago.accessToken });
const preference = new Preference(client);
const payment = new Payment(client);

// Rota para criar a preferência de pagamento
router.post('/create_preference', async (req, res) => {
<<<<<<< HEAD
  // Garante que o usuário está logado para criar uma preferência
=======
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  const { id, title } = req.body;
  if (!id || !title) {
    return res.status(400).json({ error: 'Dados do plano incompletos.' });
  }

<<<<<<< HEAD
  // --- Lógica de validação de preço e oferta do lado do servidor ---
  // Obter preços base das regras de negócio
  const standardPrices = {};
  Object.values(BusinessRules.PLANS).forEach(plan => {
    standardPrices[plan.id] = plan.price;
  });

  // Calcular preços com desconto
  const discountedPrices = {};
  Object.values(BusinessRules.PLANS).forEach(plan => {
    discountedPrices[plan.id] = parseFloat((plan.price * BusinessRules.WELCOME_OFFER.DISCOUNT_MULTIPLIER).toFixed(2));
  });

  try {
    const user = await db('users').where('id', req.session.userId).select('created_at').first();

=======
  try {
    const standardPrices = { monthly: 19, semiannual: 99, annual: 179 };
    const discountedPrices = { monthly: 14.25, semiannual: 74.25, annual: 134.25 };

    const { rows } = await db.query('SELECT created_at FROM users WHERE id = $1', [req.session.userId]);
    const user = rows[0];

>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
    if (!user) {
      return res.status(500).json({ error: 'Erro ao verificar elegibilidade do usuário.' });
    }

<<<<<<< HEAD
    const offerDurationInMillis = BusinessRules.WELCOME_OFFER.DURATION_DAYS * 24 * 60 * 60 * 1000;
    const offerEndDate = user.created_at + offerDurationInMillis;
    const isOfferActive = Date.now() < offerEndDate;
=======
    const userCreationDate = new Date(user.created_at);
    const offerEndDate = new Date(userCreationDate.getTime() + (7 * 24 * 60 * 60 * 1000));
    const isOfferActive = new Date() < offerEndDate;
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec

    const priceMap = isOfferActive ? discountedPrices : standardPrices;
    const finalPrice = priceMap[id];

    if (!finalPrice) {
      return res.status(400).json({ error: 'Plano inválido selecionado.' });
    }

    const preferenceData = {
      items: [{
        id: id,
        title: title,
        quantity: 1,
        unit_price: finalPrice,
        currency_id: 'BRL',
      }],
<<<<<<< HEAD
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 12, // Permite parcelamento em até 12x
      },
      back_urls: {
        success: `${config.domain}/index.html?status=success`,
        failure: `${config.domain}/index.html?status=failure`,
        pending: `${config.domain}/index.html?status=pending`,
      },
      external_reference: String(req.session.userId), // Associa o pagamento ao ID do usuário
      statement_descriptor: 'EDUCATECH', // Nome que aparece na fatura do cartão
    };

    if (config.isProduction) {
      preferenceData.auto_return = 'approved';
    }

    // --- Cria a Preferência do Mercado Pago ---
    const response = await preference.create({ body: preferenceData });
    res.json({ checkout_url: response.init_point });

  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    res.status(500).json({ error: 'Falha ao criar preferência de pagamento.' });
  }
});

// Rota para buscar os planos e preços
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
      // Se não encontrar o usuário, retorna os preços padrão
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
=======
      back_urls: {
        success: `${config.domain}/subscription.html?status=success`,
        failure: `${config.domain}/subscription.html?status=failure`,
        pending: `${config.domain}/subscription.html?status=pending`,
      },
      auto_return: 'approved', // Lembrete: Descomentar ou remover para desenvolvimento local se necessário
      external_reference: String(req.session.userId)
    };

    const response = await preference.create({ body: preferenceData });
    res.json({ checkout_url: response.init_point });

  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    res.status(500).json({ error: 'Falha ao criar preferência de pagamento.' });
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
  }
});

// Rota para receber webhooks do Mercado Pago
router.post('/webhook', async (req, res) => {
<<<<<<< HEAD
  const notification = req.body;
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];

  if (!xSignature || !xRequestId) {
    return res.status(401).send('Assinatura inválida.');
  }

  console.log('Webhook recebido:', notification.type);

  try {
    if (notification.type === 'payment') {
      const paymentId = notification.data.id;

      // Verifica a assinatura
      const parts = xSignature.split(",");
      let ts;
      let hash;

      parts.forEach((part) => {
        const [key, value] = part.split("=");
        if (key && value) {
          const trimmedKey = key.trim();
          const trimmedValue = value.trim();
          if (trimmedKey === "ts") {
            ts = trimmedValue;
          } else if (trimmedKey === "v1") {
            hash = trimmedValue;
          }
        }
      });

      if (!ts || !hash) {
        return res.status(401).send('Assinatura inválida.');
      }

      const secret = config.mercadoPago.webhookSecret;
      if (!secret) {
        console.error("Segredo do webhook do Mercado Pago não configurado.");
        return res.status(500).send('Erro interno do servidor.');
      }

      const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
      const cyphedSignature = crypto
        .createHmac("sha256", secret)
        .update(manifest)
        .digest("hex");

      if (cyphedSignature !== hash) {
        console.error(`Falha na verificação da assinatura para o pagamento ${paymentId}.`);
        return res.status(401).send('Assinatura inválida.');
      }

      const { Payment } = require('mercadopago');
      const payment = new Payment(client);
      const paymentDetails = await payment.get({ id: paymentId });

      console.log(`Pagamento ${paymentId} - Status: ${paymentDetails.status}`);
=======
  try {
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    const payload = JSON.stringify(req.body);

    if (!signature || !requestId || !config.mercadoPago.webhookSecret) {
      console.warn('Webhook: Cabeçalhos de assinatura ou segredo não fornecidos.');
      return res.status(400).send('Assinatura ou segredo do webhook ausente.');
    }

    // Extrai o timestamp e a assinatura da string de assinatura
    const parts = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key.trim()] = value.trim();
      return acc;
    }, {});

    const ts = parts.ts;
    const hash = parts.v1;

    if (!ts || !hash) {
      console.warn('Webhook: Formato de assinatura inválido.');
      return res.status(400).send('Formato de assinatura inválido.');
    }

    // Cria a string para o HMAC
    const manifest = `id:${req.body.data.id};request-id:${requestId};ts:${ts};`;

    // Gera o HMAC
    const hmac = crypto.createHmac('sha256', config.mercadoPago.webhookSecret);
    hmac.update(manifest);
    const expectedSignature = hmac.digest('hex');

    // Compara as assinaturas
    if (crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(hash, 'hex'))) {
      console.log('Webhook: Assinatura válida.');
    } else {
      console.warn('Webhook: Assinatura inválida.');
      return res.status(403).send('Assinatura inválida.');
    }

    const notification = req.body;
    if (notification.type === 'payment') {
      const paymentDetails = await payment.get({ id: notification.data.id });
      console.log('Detalhes do Pagamento via Webhook:', JSON.stringify(paymentDetails, null, 2));
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec

      if (paymentDetails.status === 'approved') {
        const userId = paymentDetails.external_reference;
        const plan = paymentDetails.additional_info.items[0];

        if (!userId) {
          console.error('Erro de Webhook: external_reference (ID do usuário) não encontrado no pagamento.');
          return res.status(400).send('external_reference não encontrada.');
        }

<<<<<<< HEAD
        let subscriptionDays = 30; // Fallback
        const planTitleLower = plan.title.toLowerCase();

        // Tenta encontrar o plano correspondente pelo título definido nas regras de negócio
        const foundPlanKey = Object.keys(BusinessRules.PLANS).find(key =>
          BusinessRules.PLANS[key].title.toLowerCase() === planTitleLower
        );

        if (foundPlanKey) {
          subscriptionDays = BusinessRules.PLANS[foundPlanKey].duration_days;
        } else {
          // Fallback baseado em palavras-chave se o título exato não bater
          if (planTitleLower.includes('anual')) {
            subscriptionDays = BusinessRules.PLANS.annual.duration_days;
          } else if (planTitleLower.includes('semestral')) {
            subscriptionDays = BusinessRules.PLANS.semiannual.duration_days;
          }
        }
=======
        let subscriptionDays = 30;
        if (plan.id === 'annual') subscriptionDays = 365;
        if (plan.id === 'semiannual') subscriptionDays = 180;
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + subscriptionDays);

<<<<<<< HEAD
        try {
          await db('users')
            .where('id', userId)
            .update({
              subscription_type: plan.title,
              subscription_end_date: expirationDate.getTime() // Knex salva como bigint (ms)
            });

          console.log(`✅ Usuário ${userId} atualizado para o plano ${plan.title} com expiração em ${expirationDate.toLocaleDateString('pt-BR')}.`);

          const user = await db('users').where('id', userId).select('email', 'username').first();

          if (user) {
=======
        await db.query('UPDATE users SET subscription_type = $1, subscription_end_date = $2 WHERE id = $3', [plan.id, expirationDate, userId]);
        console.log(`Usuário ${userId} atualizado para o plano ${plan.id} com expiração em ${expirationDate.toLocaleDateString('pt-BR')}.`);

        const { rows } = await db.query('SELECT email, username FROM users WHERE id = $1', [userId]);
        const user = rows[0];

        if (user) {
          try {
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
            await sendEmail({
              to: user.email,
              subject: 'Confirmação de Assinatura - Educatech',
              text: `Olá ${user.username}, sua assinatura do plano ${plan.title} foi confirmada! Sua assinatura é válida até ${expirationDate.toLocaleDateString('pt-BR')}.`,
              html: `<p>Olá ${user.username},</p><p>Sua assinatura do plano <strong>${plan.title}</strong> foi confirmada com sucesso!</p><p>Aproveite todos os benefícios até <strong>${expirationDate.toLocaleDateString('pt-BR')}</strong>.</p><p>Obrigado por fazer parte do Educatech!</p>`
            });
<<<<<<< HEAD
            console.log(`📧 E-mail de confirmação enviado para ${user.email}`);
          }

        } catch (dbErr) {
          console.error('Erro ao atualizar usuário no banco de dados ou enviar email:', dbErr);
=======
            console.log(`E-mail de confirmação de assinatura enviado para ${user.email}`);
          } catch (emailError) {
            console.error('Falha ao enviar e-mail de confirmação de assinatura:', emailError);
          }
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
        }
      }
    }
    res.status(200).send('Webhook recebido.');
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).send('Erro interno no processamento do webhook.');
  }
});

<<<<<<< HEAD
module.exports = router;
=======
module.exports = router;
>>>>>>> 42f82f97a2b7771496a03a2d0bb1e7cdec306fec
