# Migração para Hostinger VPS

Este guia move o **Preço de Banana** do Render para uma VPS na Hostinger.

## Requisitos

- VPS Hostinger com Ubuntu 22.04 ou 24.04.
- Acesso root (ou sudo).
- Domínio apontado para o IP da VPS (registros A e AAAA, se usar IPv6).
- Portas 22 (SSH), 80 (HTTP) e 443 (HTTPS) abertas no firewall.

## 1. Aponte o domínio

No painel da Hostinger (ou onde gerencia o DNS), crie:

```
Tipo A     @    187.127.22.100
Tipo CNAME www  precobanana.com.br

> Se ja existir um CNAME `www` apontando para o dominio raiz, mantenha ele.
```

Aguarde a propagação (pode levar minutos a horas). Confira com:

```bash
nslookup precobanana.com.br
```

## 2. Rode o script de setup na VPS

Conecte-se por SSH:

```bash
ssh root@187.127.22.100
```

Baixe e execute o script (substitua o domínio e e-mail):

```bash
export DOMAIN="precobanana.com.br"
export EMAIL="admin@precobanana.com.br"

curl -fsSL https://raw.githubusercontent.com/lucaspressi/preco-de-banana/main/scripts/setup-vps.sh -o setup-vps.sh
nano setup-vps.sh   # revise se quiser
bash setup-vps.sh
```

O script faz tudo:

- Atualiza o sistema.
- Instala Node.js, Nginx, PostgreSQL, PM2, Certbot.
- Cria banco e usuário PostgreSQL.
- Clona o repositório em `/var/www/preco-de-banana`.
- Cria `.env` com credenciais geradas automaticamente.
- Roda migrations, build e seed.
- Configura Nginx como reverse proxy.
- Gera SSL com Let's Encrypt.
- Inicia o app com PM2.

Ao final, ele exibe a URL e o caminho do `.env`.

## 3. Acesse e verifique

- Site público: `https://precobanana.com.br`
- Painel admin: `https://precobanana.com.br/admin/login`

As credenciais do admin estão em `/var/www/preco-de-banana/.env`.

```bash
cat /var/www/preco-de-banana/.env
```

## 4. Migrar dados do Render (opcional)

Se quiser levar os produtos já cadastrados no Render:

### No Render

```bash
pg_dump --no-acl --no-owner $DATABASE_URL > precodebanana.sql
```

Baixe o arquivo `precodebanana.sql` para sua máquina.

### Na VPS

```bash
scp precodebanana.sql root@187.127.22.100:/root/
ssh root@187.127.22.100
sudo -u postgres psql -d preco_de_banana -f /root/precodebanana.sql
```

> Atenção: o dump pode conter senhas e tokens. Revise antes de importar.

## 5. Deploy automático via GitHub Actions (opcional)

Para fazer deploy automático a cada push na `main`:

1. No repositório GitHub, vá em **Settings → Secrets and variables → Actions**.
2. Adicione:
   - `HOSTINGER_HOST`: `187.127.22.100`
   - `HOSTINGER_USER`: `root`
   - `HOSTINGER_SSH_KEY`: chave SSH privada com acesso root
   - `HOSTINGER_PORT`: `22` (opcional)

3. O workflow `.github/workflows/deploy-hostinger.yml` já está no repo. A cada push na `main`, ele atualiza a VPS.

### Criar chave SSH para o GitHub Actions

Na VPS:

```bash
ssh-keygen -t ed25519 -C "github-actions" -f /root/.ssh/github_actions
```

Adicione a chave pública ao `authorized_keys`:

```bash
cat /root/.ssh/github_actions.pub >> /root/.ssh/authorized_keys
```

Copie o conteúdo da **chave privada** (`/root/.ssh/github_actions`) para o segredo `HOSTINGER_SSH_KEY` no GitHub.

## 6. Comandos úteis

```bash
# Ver logs da aplicação
pm2 logs preco-de-banana

# Reiniciar a aplicação
pm2 restart preco-de-banana

# Status do Nginx
systemctl status nginx

# Renovar certificado SSL (automático, mas pode forçar)
certbot renew

# Atualizar manualmente o app
cd /var/www/preco-de-banana
git pull origin main
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 reload preco-de-banana
```

## 7. Variáveis de ambiente

As principais variáveis no `.env`:

```bash
DATABASE_URL="postgresql://pdb_user:SENHA@localhost:5432/preco_de_banana?schema=public"
AUTH_SECRET="..."
ADMIN_EMAIL="..."
ADMIN_PASSWORD="..."
PROMO_API_URL="https://promo.anbu.pro/api/products"
NEXT_PUBLIC_SITE_URL="https://precobanana.com.br"
```

Para alterar a senha do admin, edite `ADMIN_PASSWORD` e rode:

```bash
cd /var/www/preco-de-banana
npm run db:seed
```

## Problemas comuns

### Certbot falha

O domínio ainda não resolve para a VPS. Aguarde a propagação do DNS ou verifique com `nslookup`.

### Erro 502 Bad Gateway

O app Next.js não está rodando. Verifique:

```bash
pm2 status
pm2 logs preco-de-banana
```

### Banco não conecta

Verifique se o PostgreSQL está ativo:

```bash
systemctl status postgresql
sudo -u postgres psql -c "\l"
```

## Notas de segurança

- O script roda como root para simplificar. Em produção robusta, crie um usuário dedicado (`pdb`) para rodar a aplicação.
- O arquivo `.env` contém segredos. Proteja-o:

```bash
chmod 600 /var/www/preco-de-banana/.env
```

- Faça backups regulares do banco:

```bash
sudo -u postgres pg_dump preco_de_banana > /root/backup-$(date +%F).sql
```
