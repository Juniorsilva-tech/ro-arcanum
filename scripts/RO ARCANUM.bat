@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title RO ARCANUM

REM ============================================================
REM  RO ARCANUM - Servidor e Inicializador do Jogo
REM
REM  Deixe esta janela aberta enquanto joga. Ela executa o
REM  servidor local (Expo/Metro) e a ponte de IA (Hermes).
REM  Para encerrar: pressione Ctrl+C ou feche esta janela.
REM ============================================================

set "PROJETO=C:\Users\Junior\ro-arcanum"

echo.
echo   ================================================
echo             RO ARCANUM - INICIALIZADOR
echo   ================================================
echo.

if not exist "%PROJETO%\package.json" (
  echo   [ERRO] Nao encontrei a pasta do projeto em:
  echo          %PROJETO%
  echo.
  echo   Se voce moveu o projeto, edite este arquivo e ajuste
  echo   a variavel PROJETO.
  echo.
  pause
  exit /b 1
)

cd /d "%PROJETO%"

where node >nul 2>nul
if errorlevel 1 (
  echo   [ERRO] Node.js nao esta instalado ou nao esta no PATH.
  echo          Baixe e instale em: https://nodejs.org
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo   [1/3] Primeira execucao detectada: instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo.
    echo   [ERRO] Falha ao instalar dependencias do projeto.
    echo.
    pause
    exit /b 1
  )
  echo.
)

echo   [1/2] Sincronizando token da IA Narrativa (Hermes / Nous)...
call npx tsx scripts/sync_hermes.ts
if errorlevel 1 (
  echo.
  echo   [AVISO] A autenticacao com a Nous Research expirou ou precisa ser reconectada.
  echo   Deseja abrir o navegador agora para conectar sua conta? (S/N)
  set /p RECONECTAR="> "
  if /i "!RECONECTAR!"=="S" (
    where hermes >nul 2>nul
    if not errorlevel 1 (
      echo   Abrindo login do Hermes no navegador...
      call hermes auth add nous
      echo   Sincronizando novo token...
      call npx tsx scripts/sync_hermes.ts
    ) else (
      echo   [AVISO] Hermes CLI nao encontrado no PATH do sistema.
    )
  )
)

echo.
echo   [2/2] Ligando servidor local do jogo...
echo   O navegador sera aberto automaticamente em instantes.
echo.
echo   ------------------------------------------------
echo   MANTENHA ESTA JANELA ABERTA ENQUANTO JOGA!
echo   Para desligar: feche esta janela ou aperte Ctrl+C.
echo   ------------------------------------------------
echo.

REM Abre o navegador na porta 8081 apos breve intervalo
start "" /b cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:8081"

call npx expo start --web

echo.
echo   O servidor de jogo foi encerrado.
echo.
pause
endlocal
