#!/usr/bin/env bash
# Yedigül — tek komutla HER ŞEY: ana sayfa + QR menü + yönetim paneli
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

# Ana sayfa + statik menü sunucusu (8090) — arka planda
node scripts/serve-static.mjs &

# Sunucular ayağa kalkınca tarayıcıda ikisini de aç
(
  sleep 7
  for url in "http://localhost:8090" "http://localhost:3001/admin"; do
    if command -v start >/dev/null 2>&1; then start "$url"        # Git Bash (Windows)
    elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$url"  # Linux
    elif command -v open >/dev/null 2>&1; then open "$url"        # macOS
    fi
  done
) &

echo ""
echo "  Ana sayfa (site):  http://localhost:8090"
echo "  QR menü (statik):  http://localhost:8090/menu/"
echo "  Canlı menü:        http://localhost:3001"
echo "  Yönetim paneli:    http://localhost:3001/admin"
echo ""
echo "  Durdurmak için: Ctrl+C"
echo ""

# Panel + canlı menü + API (3001) — ön planda
npm run panel
