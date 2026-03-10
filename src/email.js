const nodemailer = require('nodemailer');
const config = require('./config');

let transporter;

async function setupEmail() {
    // Se as variáveis de ambiente para o Gmail estiverem definidas, use o Gmail.
    if (config.email.user && config.email.pass) {
        try {
            transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true, // a porta 465 usa SSL
                auth: {
                    user: config.email.user,
                    pass: config.email.pass, // Use a "senha de aplicativo" do Gmail aqui
                },
                debug: true, // Ativa o log de depuração
                logger: true // Envia o log para o console
            });
            await transporter.verify(); // Verifica se a conexão e as credenciais são válidas
            console.log('Serviço de e-mail (Gmail) configurado com sucesso.');
        } catch (error) {
            console.error('Erro ao configurar o serviço de e-mail com o Gmail:', error);
            console.log('Dica: Verifique se o EMAIL_USER e EMAIL_PASS no arquivo .env estão corretos e se a "senha de aplicativo" foi gerada.');
        }
    } else {
        // Caso contrário, volte para o Ethereal para testes locais.
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log('Serviço de e-mail (Ethereal) configurado para testes.');
            console.log(`Visualize os e-mails de teste em: ${nodemailer.getTestMessageUrl(testAccount)}`);
        } catch (error) {
            console.error('Erro ao configurar o serviço de e-mail de teste (Ethereal):', error);
        }
    }
}

async function sendEmail({ to, subject, text, html }) {
    if (!transporter) {
        const errorMessage = 'O transportador de e-mail não está configurado. A função setupEmail() foi chamada?';
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    try {
        const info = await transporter.sendMail({
            from: `"BrincaBytes" <${config.email.user || 'no-reply@brincabytes.com'}>`,
            to: to,
            subject: subject,
            text: text,
            html: html,
        });

        console.log('E-mail enviado: %s', info.messageId);

        // Se estiver usando Ethereal, mostre o link de visualização
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log('Link para o e-mail no Ethereal: %s', previewUrl);
            return { messageId: info.messageId, previewUrl };
        }

        return { messageId: info.messageId };

    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        throw error;
    }
}

async function sendPaymentFailedEmail(to, username, gracePeriodDate) {
    const graceDateStr = new Date(gracePeriodDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return sendEmail({
        to,
        subject: '⚠️ BrincaBytes — Problema com o pagamento da sua assinatura',
        text: `Olá, ${username}!\n\nHouve uma falha ao cobrar sua assinatura mensal do BrincaBytes.\n\nSeu acesso continuará ativo até ${graceDateStr} (período de carência de 3 dias). Após essa data, se o pagamento não for regularizado, sua conta voltará ao plano gratuito.\n\nAtualize seus dados de pagamento em: https://brincabytes.vercel.app/profile\n\nEquipe BrincaBytes`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #f59e0b; font-size: 28px; margin: 0;">⚠️ Problema no Pagamento</h1>
                </div>
                <p style="font-size: 16px;">Olá, <strong>${username}</strong>!</p>
                <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">
                    Houve uma falha ao processar o pagamento da sua assinatura mensal do <strong style="color: #fff;">BrincaBytes</strong>.
                </p>
                <div style="background: #1e293b; border: 1px solid #f59e0b44; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0; font-size: 15px;">
                        🕐 Seu acesso premium permanece ativo até <strong style="color: #f59e0b;">${graceDateStr}</strong>.
                    </p>
                    <p style="margin: 8px 0 0; font-size: 13px; color: #64748b;">
                        Após essa data, sua conta retornará automaticamente ao plano gratuito.
                    </p>
                </div>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="https://brincabytes.vercel.app/profile"
                       style="background: #f59e0b; color: #000; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
                        Atualizar Dados de Pagamento
                    </a>
                </div>
                <hr style="border: none; border-top: 1px solid #1e293b; margin: 32px 0;" />
                <p style="font-size: 12px; color: #475569; text-align: center; margin: 0;">
                    Equipe BrincaBytes • Este é um e-mail automático, não responda a esta mensagem.
                </p>
            </div>
        `
    });
}

module.exports = {
    setupEmail,
    sendEmail,
    sendPaymentFailedEmail,
};