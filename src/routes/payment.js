const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const config = require('../config');
const { sendEmail } = require('../email.js');
const db = require('../database.js');

// Rota para enviar a Public Key para o frontend
router.get('/config', (req, res) => {
  res.json({ publicKey: config.mercadoPago.publicKey });
});

// Importa o SDK do Mercado Pago
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Configura o cliente do Mercado Pago com o Access Token
const client = new MercadoPagoConfig({ accessToken: config.mercadoPago.accessToken });
const preference = new Preference(client);

// Rota para criar a preferência de pagamento
router.post('/create_preference', (req, res) => {
  // Garante que o usuário está logado para criar uma preferência
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Usuário não autenticado. Por favor, faça login para continuar.' });
  }

  const { id, title } = req.body; // O preço não é mais confiado do cliente

  if (!id || !title) {
    return res.status(400).json({ error: 'Dados do plano incompletos.' });
  }

  // --- Lógica de validação de preço e oferta do lado do servidor ---
  const standardPrices = {
    monthly: 19,
    semiannual: 99,
    annual: 179
  };

  const discountedPrices = {
    monthly: parseFloat((19 * 0.75).toFixed(2)),    // 14.25
    semiannual: parseFloat((99 * 0.75).toFixed(2)), // 74.25
    annual: parseFloat((179 * 0.75).toFixed(2))     // 134.25
  };

  const sql = 'SELECT created_at FROM users WHERE id = ?';
  db.get(sql, [req.session.userId], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ error: 'Erro ao verificar elegibilidade do usuário.' });
    }

    const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
    const offerEndDate = user.created_at + sevenDaysInMillis;
    const isOfferActive = Date.now() < offerEndDate;

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
        success: `${config.domain}/index.html?status=success`,
        failure: `${config.domain}/index.html?status=failure`,
        pending: `${config.domain}/index.html?status=pending`,
      },
      external_reference: String(req.session.userId) // Associa o pagamento ao ID do usuário
    };

    if (config.isProduction) {
      preferenceData.auto_return = 'approved';
    }

    // --- Cria a Preferência do Mercado Pago ---
    preference.create({ body: preferenceData })
    .then(response => {
      res.json({ checkout_url: response.init_point });
    })
    .catch(error => {
      console.error('Erro ao criar preferência:', error);
      res.status(500).json({ error: 'Falha ao criar preferência de pagamento.' });
    });
  });
});

// Rota para buscar os planos e preços
router.get('/plans', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const standardPrices = {
        monthly: { title: 'Plano Mensal', price: 19, features: ['Acesso a todos os jogos', 'Suporte por e-mail'] },
        semiannual: { title: 'Plano Semestral', price: 99, features: ['Acesso a todos os jogos', 'Suporte prioritário', 'Acesso antecipado a novos jogos'] },
        annual: { title: 'Plano Anual', price: 179, features: ['Todos os benefícios do plano semestral', 'Desconto de 15% em comparação com o plano mensal'] }
    };

    const discountedPrices = {
        monthly: { ...standardPrices.monthly, price: parseFloat((19 * 0.75).toFixed(2)) },
        semiannual: { ...standardPrices.semiannual, price: parseFloat((99 * 0.75).toFixed(2)) },
        annual: { ...standardPrices.annual, price: parseFloat((179 * 0.75).toFixed(2)) }
    };

    const sql = 'SELECT created_at FROM users WHERE id = ?';
    db.get(sql, [req.session.userId], (err, user) => {
        if (err || !user) {
            // Se não encontrar o usuário, retorna os preços padrão
            return res.json({ plans: standardPrices, isOfferActive: false });
        }

        const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
        const offerEndDate = user.created_at + sevenDaysInMillis;
        const isOfferActive = Date.now() < offerEndDate;

        const plans = isOfferActive ? discountedPrices : standardPrices;
        res.json({ plans, isOfferActive });
    });
});

module.exports = router;

// Rota para receber webhooks do Mercado Pago
router.post('/webhook', async (req, res) => {
  const notification = req.body;
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];

  if (!xSignature || !xRequestId) {
    return res.status(401).send('Assinatura inválida.');
  }

  console.log('----------\nWebhook Recebido:\n', JSON.stringify(notification, null, 2), '\n----------');

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

      console.log('Detalhes do Pagamento:', JSON.stringify(paymentDetails, null, 2));

      if (paymentDetails.status === 'approved') {
        const userId = paymentDetails.external_reference;
        const plan = paymentDetails.additional_info.items[0];

        if (!userId) {
          console.error('Erro: external_reference (ID do usuário) não encontrado no pagamento.');
          return res.status(400).send('external_reference não encontrada.');
        }

        let subscriptionDays = 30; // Padrão de 30 dias
        const planTitle = plan.title.toLowerCase();

        if (planTitle.includes('anual')) {
          subscriptionDays = 365;
        } else if (planTitle.includes('semestral')) {
          subscriptionDays = 180;
        }

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + subscriptionDays);

        const sql = `UPDATE users SET subscription_type = ?, subscription_expires_at = ? WHERE id = ?`;
        db.run(sql, [plan.title, expirationDate.toISOString(), userId], async function(err) {
          if (err) {
            console.error('Erro ao atualizar usuário no banco de dados:', err.message);
            return;
          }
          console.log(`Usuário ${userId} atualizado para o plano ${plan.title} com expiração em ${expirationDate.toLocaleDateString('pt-BR')}.`);

          db.get('SELECT email, username FROM users WHERE id = ?', [userId], async (err, user) => {
            if (err || !user) {
              console.error('Erro ao buscar e-mail do usuário para notificação.');
              return;
            }

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
          });
        });
      }
    }
    res.status(200).send('Webhook recebido com sucesso.');
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).send('Erro interno no processamento do webhook.');
  }
});
