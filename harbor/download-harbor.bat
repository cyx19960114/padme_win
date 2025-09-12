@echo off
echo Downloading Harbor Container Registry...
echo.

REM 检查是否已存在Harbor目录
if exist "harbor" (
    echo Harbor directory already exists.
    set /p overwrite=Do you want to re-download? (y/n): 
    if /i "%overwrite%" neq "y" (
        echo Skipping download.
        pause
        exit /b 0
    )
    echo Removing existing Harbor directory...
    rmdir /s /q harbor
)

REM Harbor版本配置
set HARBOR_VERSION=v2.8.4
set HARBOR_PACKAGE=harbor-offline-installer-%HARBOR_VERSION%.tgz

echo Downloading Harbor %HARBOR_VERSION%...
echo Package: %HARBOR_PACKAGE%
echo.

REM 检查curl是否可用
curl --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: curl is not available
    echo Please download Harbor manually from:
    echo https://github.com/goharbor/harbor/releases/download/%HARBOR_VERSION%/%HARBOR_PACKAGE%
    echo.
    echo Then extract it to the current directory.
    pause
    exit /b 1
)

REM 下载Harbor
echo Downloading from GitHub...
curl -L -o "%HARBOR_PACKAGE%" "https://github.com/goharbor/harbor/releases/download/%HARBOR_VERSION%/%HARBOR_PACKAGE%"

if %errorlevel% neq 0 (
    echo Failed to download Harbor package
    echo Please check your internet connection and try again
    echo Or download manually from: https://github.com/goharbor/harbor/releases
    pause
    exit /b 1
)

echo Download completed: %HARBOR_PACKAGE%
echo.

REM 检查tar是否可用（Windows 10 1903+自带tar）
tar --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: tar is not available
    echo Please extract %HARBOR_PACKAGE% manually using 7-Zip or WinRAR
    echo The harbor folder should contain the Harbor installation files
    pause
    exit /b 1
)

REM 解压Harbor包
echo Extracting Harbor package...
tar -zxf "%HARBOR_PACKAGE%"

if %errorlevel% neq 0 (
    echo Failed to extract Harbor package
    echo Please extract %HARBOR_PACKAGE% manually
    pause
    exit /b 1
)

REM 清理下载的压缩包
echo Cleaning up...
del "%HARBOR_PACKAGE%"

echo.
echo Harbor download and extraction completed successfully!
echo.
echo Next steps:
echo 1. Run deploy.bat to start Harbor installation
echo 2. Or manually configure harbor.yml and run prepare + docker-compose up
echo.

REM 检查是否成功解压
if exist "harbor" (
    echo Harbor directory created successfully
    dir harbor
) else (
    echo Warning: Harbor directory not found after extraction
    echo Please check if the extraction was successful
)

echo.
pause
