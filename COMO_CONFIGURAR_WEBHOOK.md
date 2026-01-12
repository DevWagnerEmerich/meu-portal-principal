# ============================================
# GUIA: CONFIGURAR WEBHOOK DO MERCADOPAGO
# ============================================

## PROBLEMA ATUAL:
O MercadoPago não consegue acessar seu servidor local (localhost:3001)
porque ele está rodando apenas na sua máquina.

## SOLUÇÃO: Usar ngrok para criar um túnel público

### PASSO 1: Baixar e Instalar o ngrok
1. Acesse: https://ngrok.com/download
2. Baixe a versão para Windows
3. Extraia o arquivo ngrok.exe para uma pasta (ex: C:\ngrok)
4. (Opcional) Crie uma conta grátis em https://ngrok.com para ter um domínio fixo

### PASSO 2: Executar o ngrok
Abra um novo terminal (PowerShell ou CMD) e execute:

```bash
cd C:\ngrok  # ou o caminho onde você extraiu
ngrok http 3001
```

### PASSO 3: Copiar a URL Gerada
O ngrok vai mostrar algo assim:

```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:3001
```

Copie a URL HTTPS (ex: https://abc123.ngrok-free.app)

### PASSO 4: Configurar no MercadoPago
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em "Webhooks" ou "Notificações"
3. Cole a URL do ngrok + /api/payment/webhook:
   
   https://abc123.ngrok-free.app/api/payment/webhook

4. Marque os eventos:
   ✅ Pagamentos
   ✅ Envios (Mercado Pago)

5. Salve e copie o Webhook Secret gerado

### PASSO 5: Adicionar o Secret no .env
Abra o arquivo .env e adicione:

```env
MERCADOPAGO_WEBHOOK_SECRET=o_secret_copiado_aqui
```

### PASSO 6: Reiniciar o Servidor
No terminal onde está rodando o backend, pressione Ctrl+C e execute:

```bash
npm start
```

### PASSO 7: Testar o Webhook
No painel do MercadoPago, clique em "Testar" para verificar se está funcionando.

Você deve ver no console do servidor:
```
Webhook recebido: payment
```

## ALTERNATIVA: Usar a URL de Produção

Se você já tem o site publicado (ex: Vercel), use a URL de produção:

```
https://portaleducacional.vercel.app/api/payment/webhook
```

Nesse caso, não precisa do ngrok, mas o webhook só funcionará em produção.

## IMPORTANTE:
- O ngrok gera uma URL diferente cada vez que você reinicia (versão grátis)
- Se você reiniciar o ngrok, precisa atualizar a URL no MercadoPago
- Para ter uma URL fixa, crie uma conta no ngrok e use o authtoken

## DÚVIDAS?
- ngrok não inicia: Verifique se extraiu o arquivo corretamente
- URL muda sempre: Crie uma conta grátis no ngrok para ter URL fixa
- Webhook não recebe: Verifique se o servidor está rodando na porta 3001
