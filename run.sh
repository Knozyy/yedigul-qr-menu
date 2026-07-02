#!/usr/bin/env bash
# Yedigül QR Menü — tek komutla çalıştır (menü + yönetim paneli)
cd "$(dirname "$0")" || exit 1

# Bağımlılıklar kurulu değilse kur
if [ ! -d node_modules ]; then
  echo "Bağımlılıklar kuruluyor, lütfen bekleyin..."
  npm install
fi

# .env yoksa şablondan oluştur
if [ ! -f .env ]; then
  cp .env.example .env
  echo "UYARI: .env dosyası oluşturuldu. ADMIN_PASSWORD ve JWT_SECRET değerlerini düzenleyin!"
fi

# Sunucu ayağa kalkınca tarayıcıyı aç
(
  sleep 6
  if command -v start >/dev/null 2>&1; then start "http://localhost:3001/admin"      # Git Bash (Windows)
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "http://localhost:3001/admin"  # Linux
  elif command -v open >/dev/null 2>&1; then open "http://localhost:3001/admin"      # macOS
  fi
) &

echo ""
echo "  Menü:  http://localhost:3001"
echo "  Panel: http://localhost:3001/admin"
echo "  Durdurmak için: Ctrl+C"
echo ""
npm run panel
