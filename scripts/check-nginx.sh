#!/usr/bin/env bash

echo "=== Sites ativos no Nginx ==="
ls -la /etc/nginx/sites-enabled/

echo ""
echo "=== Config default do Nginx ==="
grep -r "listen 80 default" /etc/nginx/sites-enabled/ 2>/dev/null || echo "Nenhum default server explicito"

echo ""
echo "=== Root dos sites ==="
grep -r "root " /etc/nginx/sites-enabled/ 2>/dev/null || echo "Nenhum root definido (proxy pass provavelmente)"

echo ""
echo "=== Teste: qual site responde no IP puro ==="
curl -s -H "Host: $(hostname -I | awk '{print $1}')" http://127.0.0.1/ | head -c 200
echo ""

echo ""
echo "=== Processos na porta 3000 ==="
ss -tlnp | grep ':3000' || echo "Nada na porta 3000"

echo ""
echo "=== Processos na porta 8080 ==="
ss -tlnp | grep ':8080' || echo "Nada na porta 8080"
