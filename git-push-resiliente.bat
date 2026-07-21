@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo Configurando resiliencia de Git para conexiones inestables...
echo ===================================================
git config --global http.postBuffer 2147483648
git config --global http.lowSpeedLimit 1000
git config --global http.lowSpeedTime 600

echo Obteniendo lista de commits pendientes por subir...
for /f "tokens=*" %%i in ('git log origin/main..HEAD --reverse --format^="%%H"') do (
    echo.
    echo ===================================================
    echo Subiendo commit: %%i
    echo ===================================================
    
    set retryCount=0
    
    :retryPush
    git push origin %%i:refs/heads/main
    
    if !errorlevel! neq 0 (
        set /a retryCount+=1
        if !retryCount! lss 4 (
            echo.
            echo [ADVERTENCIA] Fallo la subida debido a error de red o timeout.
            echo Reintentando en 5 segundos... (Intento !retryCount! de 3)
            timeout /t 5 /nobreak > nul
            goto retryPush
        ) else (
            echo.
            echo [ERROR CRITICO] Fallo la subida del commit %%i despues de multiples intentos.
            echo Abortando el proceso de lote. Por favor verifica tu conexion o el archivo.
            pause
            exit /b 1
        )
    )
    echo.
    echo [EXITO] Commit %%i subido correctamente.
)

echo.
echo ===================================================
echo Todos los commits del historial se han subido correctamente.
echo Verificando si quedan referencias colgantes...
git push origin main
echo ===================================================
echo [PROCESO FINALIZADO]
pause
