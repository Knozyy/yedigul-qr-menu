@echo off
rem Yedigul - tek komut, tek port: ana sayfa + QR menu + yonetim paneli (:3001)
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

rem 7 saniye sonra tarayicida ac
start "" /b cmd /c "timeout /t 7 /nobreak >nul & start http://localhost:3001"

echo.
echo   Ana sayfa:       http://localhost:3001
echo   QR menu:         http://localhost:3001/menu/
echo   Yonetim paneli:  http://localhost:3001/menu/admin
echo.
echo   Durdurmak icin: Ctrl+C (veya pencereyi kapat)
echo.

rem Site + menu + panel + API - hepsi tek surec (3001)
call npm run panel
