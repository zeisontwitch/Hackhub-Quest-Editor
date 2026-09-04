@echo off
rem ─────────────────────────────────────────────────────────────────────────
rem  HackHub Quest Mod Editor — one-click launcher for Windows
rem  Installs dependencies, starts the editor, opens it in your browser, and
rem  then closes itself. The second window titled "HackHub Quest Mod Editor"
rem  is the editor itself — keep THAT one open while you work.
rem ─────────────────────────────────────────────────────────────────────────
setlocal
cd /d "%~dp0"

set "PORT=5173"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo   Node.js was not found on this PC.
    echo   Install the LTS version from https://nodejs.org/ and run this file again.
    echo.
    pause
    exit /b 1
)

echo.
echo   [1/3] Installing dependencies (fast if already installed)...
rem Skip the install entirely when the folder is already set up: this is the
rem common case, and it turns a ten-second start into an instant one.
if exist "node_modules\.package-lock.json" (
    echo         already installed, skipping.
    goto :installed
)
rem "npm ci" installs exactly what package-lock.json pins. "npm install"
rem re-resolves the whole tree against the registry first, which took SEVEN
rem MINUTES here against 28 seconds for the same result.
call npm ci
if errorlevel 1 (
    echo.
    echo   Falling back to npm install...
    call npm install
)
if errorlevel 1 (
    echo.
    echo   Installing dependencies failed — check the messages above.
    pause
    exit /b 1
)
:installed

echo   [2/3] Starting the editor...
start "HackHub Quest Mod Editor" cmd /k "npm run dev"

echo   [3/3] Waiting for the editor to answer on http://localhost:%PORT% ...
rem Poll the port rather than guessing with a fixed delay: the moment the
rem editor answers we open the browser and this window closes itself. Waits up
rem to a minute, which covers a cold first start.
set "READY="
where powershell >nul 2>nul
if errorlevel 1 (
    rem No PowerShell on this PC: fall back to a short fixed wait.
    timeout /t 6 /nobreak >nul
    set "READY=1"
) else (
    powershell -NoProfile -Command "for($i=0;$i -lt 60;$i++){ try { $c = New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1', %PORT%); $c.Close(); exit 0 } catch { Start-Sleep -Seconds 1 } }; exit 1"
    if not errorlevel 1 set "READY=1"
)

if not defined READY (
    echo.
    echo   The editor did not answer on port %PORT% within a minute.
    echo   Look at the "HackHub Quest Mod Editor" window: another app may hold
    echo   that port, and Vite will have printed the address it actually used.
    echo.
    pause
    exit /b 1
)

start "" "http://localhost:%PORT%"

echo.
echo   Done! The editor is running at http://localhost:%PORT%
echo   Keep the "HackHub Quest Mod Editor" window open while you work —
echo   closing it stops the editor. This window closes on its own now.
echo.
rem Give the browser a moment to pick the URL up before this window vanishes.
timeout /t 2 /nobreak >nul
exit /b 0
