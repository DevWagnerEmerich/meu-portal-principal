const express = require('express');
const router = express.Router();
const { sendEmail } = require('../email.js');
const config = require('../config');

// Rota para receber o formulário de contato
router.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    // Validação simples
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }

    try {
        // Prepara o e-mail para o administrador
        await sendEmail({
            to: config.adminEmail, // Certifique-se de que esta variável existe no seu config.js
            from: `"Formulário de Contato" <${config.email.user}>`, // E-mail de "origem" que você configurou
            replyTo: email, // O e-mail do usuário que preencheu o formulário
            subject: `Nova Mensagem de Contato de ${name}`,
            text: `Você recebeu uma nova mensagem de ${name} (${email}):\n\n${message}`,
            html: `<p>Você recebeu uma nova mensagem de <strong>${name}</strong> (${email}):</p><p>${message}</p>`
        });

        res.status(200).json({ message: 'Mensagem enviada com sucesso! Obrigado pelo seu contato.' });

    } catch (error) {
        console.error('Erro ao enviar e-mail de contato:', error);
        res.status(500).json({ message: 'Ocorreu um erro ao tentar enviar sua mensagem. Tente novamente mais tarde.' });
    }
});

module.exports = router;
