const express = require('express');
const router = express.Router();
const { sendEmail } = require('../email.js');
const config = require('../config');
const { body, validationResult } = require('express-validator');

// Rota para receber o formulário de contato
router.post('/contact', [
    body('name', 'Nome é obrigatório.').notEmpty().trim().escape(),
    body('email', 'E-mail inválido.').isEmail().normalizeEmail(),
    body('message', 'Mensagem é obrigatória.').notEmpty().trim().escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Erro de validação.', errors: errors.array() });
    }

    const { name, email, message } = req.body;

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

// Endpoint para Pedido de Orçamento Escolar (Lead Generation)
router.post('/contact/school-quote', [
    body('schoolName', 'Nome da escola é obrigatório').notEmpty().trim().escape(),
    body('contactName', 'Nome de contato é obrigatório').notEmpty().trim().escape(),
    body('contactEmail', 'E-mail inválido').isEmail().normalizeEmail(),
    body('contactPhone', 'Telefone de contato é obrigatório').notEmpty().trim().escape(),
    body('teacherCount', 'Quantidade de professores é obrigatória').isInt({ min: 1 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Erro de validação.', errors: errors.array() });
    }

    const { schoolName, contactName, contactEmail, contactPhone, teacherCount } = req.body;

    try {
        await sendEmail({
            to: config.adminEmail,
            from: `"BrincaBytes Escolas" <${config.email.user || 'no-reply@brincabytes.com'}>`,
            replyTo: contactEmail,
            subject: `🚨 LEAD ESCOLAR: Solicitação de ${schoolName}`,
            text: `Novo Lead Educacional!\n\nEscola: ${schoolName}\nContato: ${contactName}\nE-mail: ${contactEmail}\nTelefone/Whatsapp: ${contactPhone}\nQuantidade de Professores: ${teacherCount}\n\nEntre em contato o mais rápido possível!`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                        <h2 style="color: #38bdf8; margin: 0;">Novo Lead B2B Escolar 🚀</h2>
                    </div>
                    <div style="padding: 30px; background-color: #ffffff;">
                        <p style="font-size: 16px; color: #334155;">Olá Administrador,</p>
                        <p style="font-size: 16px; color: #334155;">Uma nova escola acaba de preencher o formulário solicitando um plano VIP na plataforma.</p>
                        
                        <div style="background-color: #f8fafc; border-left: 4px solid #38bdf8; padding: 15px; margin: 25px 0;">
                            <p style="margin: 5px 0;"><strong>🏢 Escola:</strong> ${schoolName}</p>
                            <p style="margin: 5px 0;"><strong>👤 Responsável:</strong> ${contactName}</p>
                            <p style="margin: 5px 0;"><strong>📧 E-mail:</strong> <a href="mailto:${contactEmail}">${contactEmail}</a></p>
                            <p style="margin: 5px 0;"><strong>📱 Telefone/WhatsApp:</strong> ${contactPhone}</p>
                            <p style="margin: 5px 0;"><strong>👥 Professores Atendidos:</strong> ${teacherCount}</p>
                        </div>
                        
                        <p style="font-size: 14px; color: #64748b;"><em>Dica: Entre em contato o mais rápido possível para negociar o fechamento do plano!</em></p>
                    </div>
                </div>
            `
        });

        res.status(200).json({ message: 'Solicitação enviada com sucesso!' });
    } catch (error) {
        console.error('Erro ao processar cotação escolar (lead):', error);
        res.status(500).json({ message: 'Não foi possível enviar a solicitação. Tente novamente mais tarde.' });
    }
});

module.exports = router;
