const express = require('express');
const router = express.Router();

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
          unit_price: Number(price), // Garante que o preço é um número
          currency_id: 'BRL',
        },
      ],
      back_urls: {
        success: 'http://localhost:3000/index.html?status=success',
        failure: 'http://localhost:3000/index.html?status=failure',
        pending: 'http://localhost:3000/index.html?status=pending',
      },
      
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
router.post('/webhook', (req, res) => {
  const notification = req.body;

  console.log('----------\nWebhook Recebido:\n', JSON.stringify(notification, null, 2), '\n----------');

  // TODO: Adicionar lógica para verificar a assinatura do webhook para segurança.

  // TODO: Adicionar lógica de negócio aqui. Por exemplo:
  // if (notification.type === 'payment' && notification.action === 'payment.updated') {
  //   const paymentId = notification.data.id;
  //   // Busca o pagamento no Mercado Pago para obter o status
  //   // Encontra o usuário/pedido no seu banco de dados
  //   // Atualiza o status da assinatura do usuário se o pagamento foi aprovado
  // }

  // Responde ao Mercado Pago para confirmar o recebimento
  res.status(200).send('Webhook recebido com sucesso.');
});
