const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const config = require('../config');
const { sendEmail } = require('../email.js');
const db = require('../database.js');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

// Rota para enviar a Public Key para o frontend
router.get('/config', (req, res) => {
  res.json({ publicKey: config.mercadoPago.publicKey });
});

// Configura o cliente do Mercado Pago com o Access Token
const client = new MercadoPagoConfig({ accessToken: config.mercadoPago.accessToken });
const preference = new Preference(client);
const payment = new Payment(client);

// Rota para criar a preferência de pagamento
router.post('/create_preference', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  const { id, title } = req.body;
  if (!id || !title) {
    return res.status(400).json({ error: 'Dados do plano incompletos.' });
  }

  try {
    const standardPrices = { monthly: 19, semiannual: 99, annual: 179 };
    const discountedPrices = { monthly: 14.25, semiannual: 74.25, annual: 134.25 };

    const { rows } = await db.query('SELECT created_at FROM users WHERE id = $1', [req.session.userId]);
    const user = rows[0];

    if (!user) {
      return res.status(500).json({ error: 'Erro ao verificar elegibilidade do usuário.' });
    }

    const userCreationDate = new Date(user.created_at);
    const offerEndDate = new Date(userCreationDate.getTime() + (7 * 24 * 60 * 60 * 1000));
    const isOfferActive = new Date() < offerEndDate;

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
  }
});

// Rota para receber webhooks do Mercado Pago
router.post('/webhook', async (req, res) => {
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

      if (paymentDetails.status === 'approved') {
        const userId = paymentDetails.external_reference;
        const plan = paymentDetails.additional_info.items[0];

        if (!userId) {
          console.error('Erro de Webhook: external_reference (ID do usuário) não encontrado no pagamento.');
          return res.status(400).send('external_reference não encontrada.');
        }

        let subscriptionDays = 30;
        if (plan.id === 'annual') subscriptionDays = 365;
        if (plan.id === 'semiannual') subscriptionDays = 180;

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + subscriptionDays);

        await db.query('UPDATE users SET subscription_type = $1, subscription_end_date = $2 WHERE id = $3', [plan.id, expirationDate, userId]);
        console.log(`Usuário ${userId} atualizado para o plano ${plan.id} com expiração em ${expirationDate.toLocaleDateString('pt-BR')}.`);

        const { rows } = await db.query('SELECT email, username FROM users WHERE id = $1', [userId]);
        const user = rows[0];

        if (user) {
          try {
            await sendEmail({
              to: user.email,
              subject: 'Confirmação de Assinatura - Educatech',
              text: `Olá ${user.username}, sua assinatura do plano ${plan.title} foi confirmada! Sua assinatura é válida até ${expirationDate.toLocaleDateString('pt-BR')}.`,
              html: `<p>Olá ${user.username},</p><p>Sua assinatura do plano <strong>${plan.title}</strong> foi confirmada com sucesso!</p><p>Aproveite todos os benefícios até <strong>${expirationDate.toLocaleDateString('pt-BR')}</strong>.</p><p>Obrigado por fazer parte do Educatech!</p>`
            });
            console.log(`E-mail de confirmação de assinatura enviado para ${user.email}`);
          } catch (emailError) {
            console.error('Falha ao enviar e-mail de confirmação de assinatura:', emailError);
          }
        }
      }
    }
    res.status(200).send('Webhook recebido.');
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).send('Erro interno no processamento do webhook.');
  }
});

module.exports = router;