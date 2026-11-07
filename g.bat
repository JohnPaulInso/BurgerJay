@echo off
rem (2026-07-13) Quick GitHub upload script. Prev: basic push
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set TODAY=%%a %%b %%c %%d
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set NOW=%%a:%%b

if "%~1"=="" (
    set "commitMsg=Update: %TODAY% %NOW%"
) else (
    set "commitMsg=%~1"
)

echo.
echo ============================================
rem (2026-07-13) Configure g.bat for BurgerJay repo; was generic Route98
echo  BurgerJay GitHub Auto-Upload
echo  Repo: https://github.com/JohnPaulInso/BurgerJay.git
echo  %TODAY% %NOW%
echo ============================================
echo.
echo  Commit: "%commitMsg%"
echo.

git remote set-url origin https://github.com/JohnPaulInso/BurgerJay.git 2>nul || git remote add origin https://github.com/JohnPaulInso/BurgerJay.git

echo [1/3] Staging all changes...
git add .

echo [2/3] Committing...
git commit -m "%commitMsg%"

echo [3/3] Pushing to GitHub...
git push -u origin main

echo.
echo ============================================
echo  Done! Changes pushed to GitHub.
echo ============================================
echo.
