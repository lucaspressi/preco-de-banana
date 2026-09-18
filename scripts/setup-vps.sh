#!/usr/bin/env bash
set -euo pipefail

# Setup automatizado da VPS Hostinger para o Preço de Banana.
#
# Antes de rodar:
#   1. Aponte o dominio para o IP desta VPS.
#   2. Deixe as portas 22, 80 e 443 abertas no firewall da Hostinger.
#   3. Este script presume Ubuntu 22.04/24.04 e roda como root.
#
# Uso:
#   curl -fsSL https://raw.githubusercontent.com/lucaspressi/preco-de-banana/main/scripts/setup-vps.sh | bash
#
# Ou, mais seguro, baixe e revise antes:
#   curl -fsSL ... -o setup-vps.sh
#   nano setup-vps.sh
#   bash setup-vps.sh

DOMAIN="${DOMAIN:-example.com}"
EMAIL="${EMAIL:-admin@example.com}"
APP_DIR="/var/www/preco-de-banana"
REPO="https://github.com/lucaspressi/preco-de-banana.git"
BRANCH="${BRANCH:-main}"
NODE_VERSION="22"

export DEBIAN_FRONTEND=noninteractive

# Limpa repositorios quebrados ou conflitantes do NodeSource de runs anteriores.
rm -f /usr/share/keyrings/nodesource.gpg /etc/apt/keyrings/nodesource.gpg
rm -f /etc/apt/sources.list.d/nodesource.list

echo "==> Atualizando pacotes"
apt-get update
apt-get upgrade -y

echo "==> Instalando utilitarios"
apt-get install -y curl gnupg ca-certificates git nginx ufw certbot python3-certbot-nginx

echo "==> Configurando firewall basico"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Instalando Node.js ${NODE_VERSION}"
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_VERSION}.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
apt-get update
apt-get install -y nodejs

echo "==> Instalando PM2"
npm install -g pm2

echo "==> Instalando PostgreSQL"
apt-get install -y postgresql postgresql-contrib

systemctl enable postgresql
systemctl start postgresql

echo "==> Criando banco e usuario"
DB_NAME="preco_de_banana"
DB_USER="pdb_user"
DB_PASS="$(openssl rand -base64 32)"

sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';" || true
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"

echo "==> Clonando aplicacao"
rm -rf "${APP_DIR}"
mkdir -p "${APP_DIR}"
git clone --branch "${BRANCH}" "${REPO}" "${APP_DIR}"
cd "${APP_DIR}"

echo "==> Criando .env"
cat > "${APP_DIR}/.env" <<EOF
DATABASE_URL="${DATABASE_URL}"
AUTH_SECRET="$(openssl rand -base64 48)"
ADMIN_EMAIL="${EMAIL}"
ADMIN_PASSWORD="$(openssl rand -base64 24)"
PROMO_API_URL="https://promo.anbu.pro/api/products"
NEXT_PUBLIC_SITE_URL="https://${DOMAIN}"
EOF

echo "==> Instalando dependencias e buildando"
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

echo "==> Rodando seed"
npm run db:seed

echo "==> Configurando PM2"
pm2 start ecosystem.config.js
pm2 startup systemd -u root --hp /root
pm2 save

echo "==> Configurando Nginx"
cp "${APP_DIR}/nginx/preco-de-banana.conf" "/etc/nginx/sites-available/preco-de-banana"
sed -i "s/__DOMAIN__/${DOMAIN}/g" "/etc/nginx/sites-available/preco-de-banana"
rm -f /etc/nginx/sites-enabled/default
ln -sf "/etc/nginx/sites-available/preco-de-banana" "/etc/nginx/sites-enabled/preco-de-banana"
nginx -t
systemctl restart nginx

echo "==> Configurando SSL com Certbot"
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect || true

echo ""
echo "========================================"
echo "Setup concluido!"
echo "Dominio: https://${DOMAIN}"
echo "Admin:   https://${DOMAIN}/admin/login"
echo ""
echo "Credenciais salvas em: ${APP_DIR}/.env"
echo "Senha do admin gerada automaticamente."
echo "Para alterar, edite ADMIN_PASSWORD no .env e rode: npm run db:seed"
echo "========================================"
