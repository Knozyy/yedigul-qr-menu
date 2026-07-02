@echo off
rem Yedigul - tek tikla HER SEY: ana sayfa + QR menu + yonetim paneli
cd /d "%~dp0"

rem Bagimliliklar kurulu degilse kur
if not exist node_modules (
  echo Bagimliliklar kuruluyor, lutfen bekleyin...
  call npm install
)

rem .env yoksa sablondan olustur
if not exist .env (
  copy .env.example .env >nul
  echo UYARI: .env dosyasi olusturuldu. ADMIN_PASSWORD ve JWT_SECRET degerlerini duzenleyin!
)

rem Ana sayfa + statik menu sunucusu (8090) - ayni pencerede arka planda
start "" /b node scripts\serve-static.mjs

rem 7 saniye sonra tarayicida ikisini de ac
start "" /b cmd /c "timeout /t 7 /nobreak >nul & start http://localhost:8090 & start http://localhost:3001/admin"

echo.
echo   Ana sayfa (site):  http://localhost:8090
echo   QR menu (statik):  http://localhost:8090/menu/
echo   Canli menu:        http://localhost:3001
echo   Yonetim paneli:    http://localhost:3001/admin
echo.
echo   Durdurmak icin: Ctrl+C (veya pencereyi kapat)
echo.

rem Panel + canli menu + API (3001) - on planda
call npm run panel
