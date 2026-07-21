@echo off
setlocal

set COMMIT_MSG=%~1

if "%COMMIT_MSG%"=="" (
    echo ERROR: Debes proporcionar un mensaje para el commit.
    echo Uso: secure-commit.bat "mensaje del commit"
    exit /b 1
)

echo 🔄 1. Exportando flujos reales de n8n...
docker exec n8n-app n8n export:workflow --all --output=/data/flujos/temp_raw_backup.json

echo 🧹 2. Limpiando y versionando fisicamente...
node scripts/process-and-version.js flujos/temp_raw_backup.json "%COMMIT_MSG%"

echo 📦 3. Sincronizando con Git...
git add .
git commit -m "%COMMIT_MSG%"

echo ✨ 4. Limpiando archivos temporales...
del flujos\temp_raw_backup.json

echo ✅ EXITO: El sistema esta respaldado, limpio y commiteado.
endlocal
