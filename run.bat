@echo off
rem Yedigul QR Menu - tek tikla calistir (menu + yonetim paneli)
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

rem 6 saniye sonra tarayiciyi ac (sunucu ayaga kalkinca)
start "" /b cmd /c "timeout /t 6 /nobreak >nul & start http://localhost:3001/admin"

echo.
echo   Menu:  http://localhost:3001
echo   Panel: http://localhost:3001/admin
echo   Durdurmak icin: Ctrl+C
echo.
call npm run panel
