#!/usr/bin/env bash
# Yedigül — tek komut, tek port: ana sayfa + QR menü + yönetim paneli (:3001)
cd "$(dirname "$0")" || exit 1

# çıkışta (Ctrl+C) tüm alt süreçleri durdur
trap 'kill 0' EXIT

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

# Sunucu ayağa kalkınca tarayıcıda aç
(
  sleep 7
  url="http://localhost:3001"
  if command -v start >/dev/null 2>&1; then start "$url"        # Git Bash (Windows)
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$url"  # Linux
  elif command -v open >/dev/null 2>&1; then open "$url"        # macOS
  fi
) &

echo ""
echo "  Ana sayfa:       http://localhost:3001"
echo "  QR menü:         http://localhost:3001/menu/"
echo "  Yönetim paneli:  http://localhost:3001/menu/admin"
echo ""
echo "  Durdurmak için: Ctrl+C"
echo ""

# Site + menü + panel + API — hepsi tek süreç (3001)
npm run panel
