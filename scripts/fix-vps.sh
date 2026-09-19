#!/usr/bin/env bash
set -euo pipefail

# Diagnostico e correcao rapida da VPS Hostinger.
# Roda na VPS como root.

APP_DIR="/var/www/preco-de-banana"
DOMAIN="precobanana.com.br"

echo "========================================"
echo "DIAGNOSTICO VPS - Preco de Banana"
echo "========================================"

# 1. Verifica Node.js
echo ""
echo "[1/7] Node.js"
if command -v node >/dev/null 2>&1; then
  echo "  OK: $(node --version)"
else
  echo "  Node.js nao encontrado. Instalando..."
  curl -fsSL https://nodejs.org/dist/v22.13.1/node-v22.13.1-linux-x64.tar.xz -o /tmp/node.tar.xz
  tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1
  ln -sf /usr/local/bin/node /usr/bin/node
  ln -sf /usr/local/bin/npm /usr/bin/npm
  echo "  Instalado: $(node --version)"
fi

# 2. Verifica PM2
echo ""
echo "[2/7] PM2 (process manager)"
if command -v pm2 >/dev/null 2>&1; then
  echo "  OK: pm2 instalado"
  pm2 status || true
else
  echo "  Instalando pm2..."
  npm install -g pm2
fi

# 3. Verifica app rodando
echo ""
echo "[3/7] Aplicacao Next.js"
if [ -d "$APP_DIR" ]; then
  echo "  OK: diretorio encontrado em $APP_DIR"
  cd "$APP_DIR"

  if [ -f ".env" ]; then
    echo "  OK: .env existe"
  else
    echo "  ERRO: .env nao encontrado. O setup nao completou."
    exit 1
  fi

  # Verifica se esta rodando
  if pm2 describe preco-de-banana >/dev/null 2>&1; then
    echo "  OK: app registrado no PM2"
    pm2 reload preco-de-banana || pm2 restart ecosystem.config.js
  else
    echo "  Iniciando app..."
    pm2 start ecosystem.config.js
    pm2 save
  fi
else
  echo "  ERRO: $APP_DIR nao existe. Rode o setup-vps.sh primeiro."
  exit 1
fi

# 4. Verifica Nginx
echo ""
echo "[4/7] Nginx"
if [ -f "/etc/nginx/sites-available/preco-de-banana" ]; then
  echo "  OK: config do site existe"

  # Corrige server_name se necessario
  if ! grep -q "$DOMAIN" /etc/nginx/sites-available/preco-de-banana; then
    echo "  Corrigindo server_name..."
    sed -i "s/__DOMAIN__/$DOMAIN/g" /etc/nginx/sites-available/preco-de-banana
  fi

  # Ativa o site se nao estiver ativo
  if [ ! -L "/etc/nginx/sites-enabled/preco-de-banana" ]; then
    echo "  Ativando site no Nginx..."
    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/preco-de-banana /etc/nginx/sites-enabled/preco-de-banana
  fi

  nginx -t && systemctl restart nginx
  echo "  OK: Nginx reiniciado"
else
  echo "  ERRO: config do Nginx nao encontrada."
  echo "  Copiando do repo..."
  cp "$APP_DIR/nginx/preco-de-banana.conf" /etc/nginx/sites-available/preco-de-banana
  sed -i "s/__DOMAIN__/$DOMAIN/g" /etc/nginx/sites-available/preco-de-banana
  rm -f /etc/nginx/sites-enabled/default
  ln -sf /etc/nginx/sites-available/preco-de-banana /etc/nginx/sites-enabled/preco-de-banana
  nginx -t && systemctl restart nginx
fi

# 5. Verifica porta 3000
echo ""
echo "[5/7] Porta 3000"
if ss -tlnp | grep -q ':3000'; then
  echo "  OK: porta 3000 esta ouvindo"
else
  echo "  ALERTA: porta 3000 nao responde. O app pode estar iniciando..."
  sleep 3
  if ss -tlnp | grep -q ':3000'; then
    echo "  OK: porta 3000 agora responde"
  else
    echo "  Tentando reiniciar..."
    cd "$APP_DIR"
    pm2 restart preco-de-banana || pm2 start ecosystem.config.js
    pm2 save
  fi
fi

# 6. Verifica SSL
echo ""
echo "[6/7] SSL (Certbot)"
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "  OK: certificado SSL existe"
else
  echo "  Gerando certificado..."
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect || true
fi

# 7. Teste final
echo ""
echo "[7/7] Teste de conectividade"
echo "  Testando localhost:3000..."
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 | grep -q "200\|307"; then
  echo "  OK: app responde na porta 3000"
else
  echo "  ERRO: app nao responde na porta 3000"
  echo "  Logs do app:"
  pm2 logs preco-de-banana --lines 20 || true
fi

echo ""
echo "========================================"
echo "Diagnostico concluido!"
echo ""
echo "Acesse: https://$DOMAIN"
echo "Admin:  https://$DOMAIN/admin/login"
echo ""
echo "Se ainda nao funcionar, verifique:"
echo "  - DNS esta propagado? (nslookup $DOMAIN)"
echo "  - Firewall da Hostinger libera 80/443?"
echo "  - Outro app (OpenClaw) ocupa a porta 80?"
echo "========================================"
