@echo off
rem Yedigul - tek komut, tek port: ana sayfa + QR menu + yonetim paneli (:3001)
cd /d "%~dp0"

rem 3001 portunu baska bir proje kullaniyorsa yanlis siteyi acma.
rem Cikis kodu 2: Yedigul zaten calisiyor, 1: port baska bir surecte, 0: port bos.
powershell -NoProfile -Command "$connection = Get-NetTCPConnection -State Listen -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -First 1; if (-not $connection) { exit 0 }; $pageTitle = $null; try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3001/' -TimeoutSec 2; if ($response.Content -match 'Yedig') { exit 2 }; if ($response.Content -match '<title>([^<]+)</title>') { $pageTitle = $Matches[1] } } catch {}; $ownerPid = $connection.OwningProcess; $process = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $ownerPid) -ErrorAction SilentlyContinue; Write-Host ''; Write-Host 'HATA: 3001 portu baska bir uygulama tarafindan kullaniliyor.'; if ($pageTitle) { Write-Host ('  Sayfa: ' + $pageTitle) }; Write-Host ('  PID:   ' + $ownerPid); if ($process.CommandLine) { Write-Host ('  Komut: ' + $process.CommandLine) }; Write-Host 'Once bu uygulamayi kapatip run.bat dosyasini yeniden calistirin.'; Write-Host ''; exit 1"
set "port_status=%errorlevel%"

if "%port_status%"=="2" (
  echo.
  echo Yedigul zaten calisiyor; mevcut uygulama aciliyor.
  start "" http://localhost:3001
  exit /b 0
)

if not "%port_status%"=="0" (
  echo Bu pencere 10 saniye sonra kapanacak.
  ping 127.0.0.1 -n 11 >nul
  exit /b 1
)

rem Bagimliliklar kurulu degilse kur
if not exist node_modules (
  echo Bagimliliklar kuruluyor, lutfen bekleyin...
  call npm install
  if errorlevel 1 (
    echo HATA: Bagimliliklar kurulamadi.
    echo Bu pencere 10 saniye sonra kapanacak.
    ping 127.0.0.1 -n 11 >nul
    exit /b 1
  )
)

rem .env yoksa sablondan olustur
if not exist .env (
  copy .env.example .env >nul
  echo UYARI: .env dosyasi olusturuldu. ADMIN_PASSWORD ve JWT_SECRET degerlerini duzenleyin!
)

rem Build ve sunucu baslangici icin bekledikten sonra tarayicida ac.
if /I not "%YEDIGUL_NO_BROWSER%"=="1" start "" /b cmd /c "ping 127.0.0.1 -n 11 >nul & start http://localhost:3001"

echo.
echo   Ana sayfa:       http://localhost:3001
echo   QR menu:         http://localhost:3001/menu/
echo   Yonetim paneli:  http://localhost:3001/menu/admin
echo.
echo   Durdurmak icin: Ctrl+C (veya pencereyi kapat)
echo.

rem Site + menu + panel + API - hepsi tek surec (3001)
call npm run panel
