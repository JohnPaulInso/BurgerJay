@echo off
rem (2026-07-13) Auto-install node_modules if missing before Capacitor sync; was failing on fresh clone
if not exist "node_modules\@capacitor\cli" (
  echo [0/3] Installing dependencies...
  call npm.cmd install
)
echo [1/3] Building assets...
call npm.cmd run build
echo [2/3] Syncing Android project...
call npx.cmd cap sync android
echo [3/3] Assembling Debug APK...
if not exist "android\local.properties" (
  echo sdk.dir=C\:\\Users\\Lenovo\\AppData\\Local\\Android\\Sdk> "android\local.properties"
)
cd android
rem (2026-07-13) Clean gradle assemble to ensure stale assets are deleted. Prev: assembleDebug only
call gradlew.bat clean assembleDebug
cd ..
echo Build complete.
rem (2026-07-13) Select burgerjay.apk in Explorer; was route98.apk
explorer.exe /select,"%~dp0android\app\build\outputs\apk\debug\burgerjay.apk"

