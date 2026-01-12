# ============================================
# ARQUIVOS E PASTAS PARA REMOVER
# ============================================
# Este é o plano de limpeza do projeto antes do deploy

## ARQUIVOS HTML ANTIGOS (pasta /public) - REMOVER TUDO
# A nova versão usa Next.js (pasta /client), então os HTMLs antigos não são mais necessários

REMOVER:
- public/index.html
- public/login.html
- public/register.html
- public/games.html
- public/profile.html
- public/subscription.html
- public/admin.html
- public/contact.html
- public/forgot_password.html
- public/reset_password.html
- public/admin-partials/ (pasta inteira)
- public/css/ (pasta inteira)
- public/js/ (pasta inteira)
- public/games.json

## MANTER NA PASTA PUBLIC:
- public/games/ (pasta com os jogos em HTML5)
- public/logo.webp
- public/downloads/ (se houver arquivos importantes)

## ARQUIVOS DE BANCO DE DADOS LOCAL - REMOVER
REMOVER:
- portal_jogos.db (SQLite local - não usado em produção)
- portal_jogos_v2.db (SQLite local - não usado em produção)

## ARQUIVOS DE TESTE - REMOVER
REMOVER:
- test-db-connection.js
- test-pg.js
- tests/ (pasta inteira, se não tiver testes importantes)
- src/check-mp-config.js (script de diagnóstico temporário)

## ARQUIVOS DE CONFIGURAÇÃO - MANTER
MANTER:
- .env.example
- .gitignore
- package.json
- package-lock.json

## ARQUIVOS DE DOCUMENTAÇÃO - OPCIONAL
MANTER (úteis para referência):
- COMO_CONFIGURAR_WEBHOOK.md
- WEBHOOK_SETUP_GUIDE.txt

REMOVER (se quiser):
- client_secret_*.json (credencial do Google - deve estar no .env)

## PASTAS ESSENCIAIS - MANTER
MANTER:
- /src (backend Node.js/Express)
- /client (frontend Next.js)
- /migrations (migrações do banco de dados)
- /node_modules (dependências)
- /logs (logs do sistema)
- /assets (se houver arquivos importantes)

## RESUMO DE AÇÕES:

### 1. REMOVER ARQUIVOS HTML ANTIGOS:
```bash
rm public/index.html
rm public/login.html
rm public/register.html
rm public/games.html
rm public/profile.html
rm public/subscription.html
rm public/admin.html
rm public/contact.html
rm public/forgot_password.html
rm public/reset_password.html
rm public/games.json
rm -r public/admin-partials
rm -r public/css
rm -r public/js
```

### 2. REMOVER BANCOS DE DADOS LOCAIS:
```bash
rm portal_jogos.db
rm portal_jogos_v2.db
```

### 3. REMOVER ARQUIVOS DE TESTE:
```bash
rm test-db-connection.js
rm test-pg.js
rm src/check-mp-config.js
rm -r tests
```

### 4. REMOVER CREDENCIAIS LOCAIS (OPCIONAL):
```bash
rm client_secret_*.json
```

## ESTRUTURA FINAL DO PROJETO:

```
meu-portal-de-jogos/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── COMO_CONFIGURAR_WEBHOOK.md
├── WEBHOOK_SETUP_GUIDE.txt
├── assets/
├── client/                    # Frontend Next.js (PRINCIPAL)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   ├── public/
│   ├── package.json
│   └── next.config.js
├── src/                       # Backend Express (PRINCIPAL)
│   ├── routes/
│   ├── server.js
│   ├── config.js
│   ├── database.js
│   └── ...
├── migrations/                # Migrações do banco
├── logs/                      # Logs do sistema
└── public/
    ├── games/                 # Jogos HTML5 (MANTER)
    └── logo.webp              # Logo (MANTER)
```

## IMPORTANTE ANTES DE REMOVER:
1. Faça backup do projeto inteiro
2. Verifique se não há nada importante nos arquivos a serem removidos
3. Teste o projeto após a limpeza
4. Commit as mudanças no Git antes de fazer deploy
