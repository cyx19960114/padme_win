@echo off
echo Setting up Keycloak clients for PADME Central Service...
echo.

echo This script will help you configure the required Keycloak clients.
echo Make sure Keycloak is running at http://localhost:8090
echo.

REM 检查Keycloak是否运行
curl -f -s http://localhost:8090/ >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Keycloak is not running at localhost:8090
    echo Please start Keycloak service first
    pause
    exit /b 1
)

echo ✓ Keycloak service detected
echo.

echo ===========================================
echo Keycloak Client Configuration Instructions
echo ===========================================
echo.
echo You need to create two clients in Keycloak:
echo.

echo 1. FRONTEND CLIENT (central-service)
echo -----------------------------------
echo - Client ID: central-service
echo - Client Protocol: openid-connect
echo - Access Type: public
echo - Standard Flow Enabled: ON
echo - Implicit Flow Enabled: ON
echo - Direct Access Grants Enabled: ON
echo - Root URL: http://localhost:3000
echo - Valid Redirect URIs: http://localhost:3000/*
echo - Web Origins: http://localhost:3000
echo.

echo 2. BACKEND CLIENT (central-service-backend)
echo ------------------------------------------
echo - Client ID: central-service-backend
echo - Client Protocol: openid-connect
echo - Access Type: confidential
echo - Standard Flow Enabled: ON
echo - Implicit Flow Enabled: OFF
echo - Direct Access Grants Enabled: ON
echo - Service Accounts Enabled: ON
echo - Authorization Enabled: ON
echo - Root URL: http://localhost:3000
echo - Valid Redirect URIs: http://localhost:3000/*
echo - Web Origins: http://localhost:3000
echo - Backchannel Session Logout Required: ON
echo.

echo 3. ADD HARBOR AUDIENCE TO central-service
echo ----------------------------------------
echo - Navigate to central-service client
echo - Go to Client Scopes tab
echo - Choose central-service-dedicated scope
echo - Add new mapper:
echo   * Name: harbor-audience
echo   * Mapper Type: Audience
echo   * Included Client Audience: harbor
echo   * Add to Access Token: ON
echo   * Add to token introspection: ON
echo.

set /p proceed=Press Enter to open Keycloak admin console...

REM 打开Keycloak管理控制台
echo Opening Keycloak admin console...
start http://localhost:8090/auth/admin

echo.
echo Keycloak Admin Credentials:
echo Username: admin
echo Password: admin_password_2024
echo.

echo After creating the clients, you may need to:
echo 1. Note down the client secret for central-service-backend
echo 2. Update the docker-compose.yml if needed
echo 3. Restart Central Service: docker-compose restart centralservice
echo.

echo ALTERNATIVE: You can also import the JSON configuration files
echo from the 'keycloak-clients-local' folder in this directory.
echo Remember to replace any domain placeholders with localhost:3000 in the JSON files.
echo.

echo.
echo ===========================================
echo Manual Configuration Steps
echo ===========================================
echo.
echo 1. Login to Keycloak Admin Console with admin/admin_password_2024
echo 2. Navigate to 'pht' realm (or create it if it doesn't exist)
echo 3. Go to Clients section
echo 4. Create the two clients as described above
echo 5. For central-service-backend, note the client secret from Credentials tab
echo 6. Test the configuration by accessing Central Service at http://localhost:3000
echo.

pause