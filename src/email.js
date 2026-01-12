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
            from: `"Educatech" <${config.email.user || 'no-reply@educatech.com'}>`,
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

module.exports = {
    setupEmail,
    sendEmail,
};