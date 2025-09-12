@echo off
echo Downloading Harbor v2.8.4...
echo.

if exist "harbor" (
    echo Harbor directory already exists.
    echo Please remove it first if you want to re-download.
    pause
    exit /b 0
)

echo Downloading Harbor offline installer...
curl -L -o "harbor-offline-installer-v2.8.4.tgz" "https://github.com/goharbor/harbor/releases/download/v2.8.4/harbor-offline-installer-v2.8.4.tgz"

if %errorlevel% neq 0 (
    echo Download failed. Please check your internet connection.
    pause
    exit /b 1
)

echo Extracting Harbor package...
tar -zxf "harbor-offline-installer-v2.8.4.tgz"

if %errorlevel% neq 0 (
    echo Extract failed. Please extract manually.
    pause
    exit /b 1
)

echo Cleaning up...
del "harbor-offline-installer-v2.8.4.tgz"

echo.
echo Harbor download completed successfully!
echo Harbor directory created.
echo.
echo Next: Run deploy.bat to install Harbor
pause
