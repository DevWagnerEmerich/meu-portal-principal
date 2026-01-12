# ============================================
# CONFIGURAR REPOSITÓRIO GIT E FAZER PUSH
# ============================================

## OPÇÃO 1: Criar Novo Repositório no GitHub

### Passo 1: Criar repositório no GitHub
1. Acesse: https://github.com/new
2. Nome do repositório: portal-educacional (ou outro nome)
3. Deixe como PRIVADO (recomendado)
4. NÃO marque "Initialize with README"
5. Clique em "Create repository"

### Passo 2: Copiar a URL do repositório
Exemplo: https://github.com/seu-usuario/portal-educacional.git

### Passo 3: Configurar o remote e fazer push
Execute os seguintes comandos (substitua a URL pela sua):

```bash
# Adicionar o repositório remoto
git remote add origin https://github.com/seu-usuario/portal-educacional.git

# Renomear a branch para main (se necessário)
git branch -M main

# Fazer push
git push -u origin main
```

## OPÇÃO 2: Usar Repositório Existente

Se você já tem um repositório, use a URL dele:

```bash
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git push -u origin main
```

## OPÇÃO 3: Deploy Direto no Vercel (Sem GitHub)

Se você não quer usar GitHub, pode fazer deploy direto via Vercel CLI:

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

## VERIFICAR CONFIGURAÇÃO ATUAL:

```bash
# Ver repositórios remotos configurados
git remote -v

# Ver status do Git
git status

# Ver histórico de commits
git log --oneline
```

## APÓS CONFIGURAR O REMOTE:

```bash
# Fazer push
git push -u origin main

# Ou, se a branch for master:
git push -u origin master
```

## TROUBLESHOOTING:

### Erro: "remote origin already exists"
```bash
# Remover o remote existente
git remote remove origin

# Adicionar novamente
git remote add origin https://github.com/seu-usuario/seu-repo.git
```

### Erro: "failed to push some refs"
```bash
# Forçar push (cuidado: sobrescreve o repositório remoto)
git push -u origin main --force
```

### Verificar qual branch você está
```bash
git branch
```

Se estiver em "master", use:
```bash
git push -u origin master
```

Se estiver em "main", use:
```bash
git push -u origin main
```
