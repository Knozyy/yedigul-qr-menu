#!/usr/bin/env bash
# Yedigül — günlük SQLite + uploads yedeği.
# Kurulum (sunucuda): deploy/SUNUCU-CHECKLIST.md → A1.
set -euo pipefail

APP_DIR="/root/yedigul"            # << DÜZENLE: repo'nun sunucudaki yolu >>
DEST="/opt/backups/yedigul"
KEEP_DAYS=14

DB="$APP_DIR/server/data.db"
UPLOADS="$APP_DIR/server/uploads"

mkdir -p "$DEST"
STAMP=$(date +%Y%m%d-%H%M%S)

# .backup — WAL modunda bile tutarlı kopya alır (cp KULLANMA)
sqlite3 "$DB" ".backup '$DEST/yedigul-$STAMP.db'"
gzip "$DEST/yedigul-$STAMP.db"

# görseller: değişenleri senkron tut (küçük klasör, tam ayna yeterli)
rsync -a --delete "$UPLOADS/" "$DEST/uploads/"

# eski yedekleri temizle
find "$DEST" -name "yedigul-*.db.gz" -mtime +$KEEP_DAYS -delete

echo "OK: $DEST/yedigul-$STAMP.db.gz"

# ÖNEMLİ: yedek aynı sunucuda kalmamalı. Aşağıdaki satırı kendi hedefinle aç:
# rsync -a "$DEST/" kullanici@baska-makine:/yedekler/yedigul/
