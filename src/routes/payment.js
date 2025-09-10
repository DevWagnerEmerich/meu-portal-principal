const express = require('express');
const router = express.Router();

const { sendEmail } = require('../email.js');
const db = require('../database.js');

// Rota para enviar a Public Key para o frontend
router.get('/config', (req, res) => {
  res.json({ publicKey: process.env.MERCADOPAGO_PUBLIC_KEY });
});

// Importa o SDK do Mercado Pago
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Garante que as variáveis de ambiente foram carregadas.
// O ideal é carregar no arquivo principal do servidor (server.js), mas garantimos aqui também.
require('dotenv').config();

// Configura o cliente do Mercado Pago com o Access Token
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
const preference = new Preference(client);

// Rota para criar a preferência de pagamento
// Rota para criar a preferência de pagamento
router.post('/create_preference', (req, res) => {
  // Garante que o usuário está logado para criar uma preferência
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Usuário não autenticado. Por favor, faça login para continuar.' });
  }

  const { id, title, price } = req.body;

  if (!id || !title || !price) {
    return res.status(400).json({ error: 'Dados do plano incompletos.' });
  }

  preference.create({
    body: {
      items: [
        {
          id: id,
          title: title,
          quantity: 1,
          unit_price: Number(price),
          currency_id: 'BRL',
        },
      ],
      back_urls: {
        success: 'http://localhost:3000/index.html?status=success',
        failure: 'http://localhost:3000/index.html?status=failure',
        pending: 'http://localhost:3000/index.html?status=pending',
      },
      external_reference: String(req.session.userId) // Associa o pagamento ao ID do usuário
    },
  })
  .then(response => {
    // Envia a URL de checkout de volta para o frontend
    res.json({ checkout_url: response.init_point });
  })
  .catch(error => {
    console.error('Erro ao criar preferência:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Falha ao criar preferência de pagamento.' });
  });
});

module.exports = router;

// Rota para receber webhooks do Mercado Pago
router.post('/webhook', async (req, res) => {
  const notification = req.body;

  console.log('----------\nWebhook Recebido:\n', JSON.stringify(notification, null, 2), '\n----------');

  try {
    if (notification.type === 'payment') {
      const paymentId = notification.data.id;
      
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
