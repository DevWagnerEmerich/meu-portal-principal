# Documentação do Projeto - Meu Portal de Jogos

Este documento resume as principais alterações, configurações e processos de deploy realizados no projeto.

## 1. Visão Geral do Projeto
Um portal de jogos educacionais com autenticação de usuário, gerenciamento de jogos e integração com serviços externos.

## 2. Plataformas de Hospedagem

*   **Aplicação Principal (Frontend & Backend Node.js/Express):** Vercel
    *   **Domínio de Produção:** `https://portaleducacional.vercel.app/` (ou seu domínio personalizado)
    *   **Domínios de Preview:** `https://[nome-do-projeto]-git-[branch]-[username]-projects.vercel.app/`
*   **Banco de Dados (PostgreSQL):** Render
    *   A string de conexão (`DATABASE_URL`) é configurada como variável de ambiente no Vercel.
*   **Jogo "Quiz Educacional":** Fly.io
    *   Hospedado em `https://quiz-educacional-copia-copia-3-copia.fly.dev`
    *   Integrado via `public/games.json`.

## 3. Principais Alterações e Correções

### 3.1. Correção do Erro de Login (Formato de Data)
*   **Problema:** Erro `date/time field value out of range` durante o login.
*   **Causa:** `Date.now()` estava sendo usado para `last_login_date`, que retorna um timestamp numérico, enquanto o PostgreSQL esperava um objeto de data.
*   **Solução:** Alterado `src/models/userModel.js` para usar `new Date()` em `updateUserLastLogin`.

### 3.2. Otimização para Deploy no Vercel
*   **Problema:** Aplicação Express não era reconhecida corretamente como função serverless no Vercel.
*   **Causa:** `app.listen()` era chamado diretamente, e a instância `app` não era exportada.
*   **Solução:**
    *   Modificado `src/server.js` para exportar a instância `app` e condicionar `app.listen()` apenas para ambiente de desenvolvimento (`process.env.NODE_ENV !== 'production'`).
    *   Criado `vercel.json` na raiz do projeto para configurar explicitamente o build, rotas e entrypoint (`src/server.js`).

### 3.3. Correção de Conexão com Banco de Dados (SSL/TLS)
*   **Problema:** Erro `SSL/TLS required` ao conectar ao PostgreSQL no Render a partir do Vercel.
*   **Causa:** A string de conexão `DATABASE_URL` não especificava o uso de SSL/TLS.
*   **Solução:** Adicionado `?sslmode=require` ao final da `DATABASE_URL` nas variáveis de ambiente do Vercel.

### 3.4. Correção de Sintaxe em `games.json`
*   **Problema:** Erro 500 ao carregar jogos mais acessados após adicionar um novo jogo.
*   **Causa:** O arquivo `public/games.json` estava com sintaxe JSON malformada (vírgula e chave de fechamento ausentes).
*   **Solução:** Corrigida a sintaxe JSON em `public/games.json`.

### 3.5. Adição do Jogo "Quiz Educacional"
*   **Detalhes:**
    *   **URL:** `https://quiz-educacional-copia-copia-3-copia.fly.dev`
    *   **Entrada em `public/games.json`:**
        ```json
        {
          "id": "quiz-educacional",
          "title": "Quiz Educacional",
          "description": "Teste seus conhecimentos com este quiz educativo e divertido!",
          "thumbnail": "/assets/imagens/quiz.webp",
          "game_url": "https://quiz-educacional-copia-copia-3-copia.fly.dev",
          "is_premium": false,
          "is_featured": false,
          "category": "Educação"
        }
        ```
    *   **Thumbnail:** `assets/imagens/quiz.webp` (arquivo local).

### 3.6. Solução de Problemas de Login com Google OAuth
*   **Problema:** Erro `Erro 400: redirect_uri_mismatch` ou "Acesso bloqueado: o pedido da app testeappp é inválido".
*   **Causa:** Incompatibilidade EXATA entre a `redirect_uri` enviada pelo aplicativo e a configurada no Google Cloud Console. O nome "testeappp" vem da "Tela de consentimento OAuth" no Google.
*   **Solução:**
    *   Garantir que a variável de ambiente `DOMAIN` no Vercel esteja definida com a URL **EXATA** do aplicativo implantado (ex: `https://portaleducacional.vercel.app`).
    *   Garantir que a "URI de redirecionamento autorizado" no Google Cloud Console esteja definida como **EXATAMENTE** `https://[SEU_DOMINIO_VERCEL]/api/auth/google/callback`.
    *   Verificar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no Vercel e no Google Cloud Console.

## 4. Variáveis de Ambiente Essenciais (Vercel)

As seguintes variáveis de ambiente devem ser configuradas no Vercel:

*   `DATABASE_URL`: String de conexão do PostgreSQL (Render), incluindo `?sslmode=require`.
*   `SESSION_SECRET`: Chave secreta para sessões.
*   `GOOGLE_CLIENT_ID`: ID do cliente OAuth do Google.
*   `GOOGLE_CLIENT_SECRET`: Segredo do cliente OAuth do Google.
*   `DOMAIN`: URL base do seu aplicativo Vercel (ex: `https://portaleducacional.vercel.app`).
*   `MERCADOPAGO_ACCESS_TOKEN`: Token de acesso do Mercado Pago.
*   `EMAIL_USER`: Usuário para envio de e-mails.
*   `EMAIL_PASS`: Senha para envio de e-mails.
*   `EMAIL_SERVICE`: Serviço de e-mail (ex: `gmail`).

## 5. Configuração do Google Cloud Console (OAuth)

*   **Credenciais:**
    *   Tipo: "Aplicativo da Web".
    *   **URIs de JavaScript autorizados:** `https://[SEU_DOMINIO_VERCEL]`
    *   **URIs de redirecionamento autorizados:** `https://[SEU_DOMINIO_VERCEL]/api/auth/google/callback`
*   **Tela de Consentimento OAuth:**
    *   Defina o "Nome do aplicativo" para o nome desejado do seu portal.

## 6. Processo de Deploy (Vercel)

1.  **Desenvolvimento Local:** Faça suas alterações e teste localmente.
2.  **Commit:** `git add .` e `git commit -m "Sua mensagem"`
3.  **Push:** `git push origin main` (ou sua branch de desenvolvimento).
4.  **Vercel Deploy:** O Vercel detectará o push e iniciará um novo deploy.
5.  **Verificação:** Monitore os logs do Vercel e teste o aplicativo após o deploy.

---
**Lembrete:** Sempre que modificar arquivos locais (como `games.json` ou adicionar imagens), certifique-se de adicioná-los ao Git (`git add`), committar e fazer o push para o GitHub.
