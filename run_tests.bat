@echo off
rem ============================================================
rem BurgerJay POS - Automated Multi-Device Sync Playwright Runner
rem ============================================================
title BurgerJay POS - Automated Live Sync Tests
echo.
echo ============================================================
echo   Starting Multi-Device Live Playwright Automated Tests...
echo ============================================================
echo.
node tests/run-all.js
echo.
pause
