@echo off
title CircuitLens Platform
echo ========================================================
echo   Iniciando CircuitLens Platform...
echo ========================================================
cd /d "%~dp0Proyecto CircuitoLens"

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo Iniciando con Python FastAPI en http://localhost:8000 ...
    start "" http://localhost:8000
    python server.py
    goto end
)

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo Python no detectado. Iniciando servidor con Node.js...
    start "" http://localhost:8000/frontend/circuitlens.html
    npx --yes serve . -p 8000
    goto end
)

echo Abriendo directamente en el navegador...
start "" "%~dp0Proyecto CircuitoLens\frontend\circuitlens.html"

:end
pause
