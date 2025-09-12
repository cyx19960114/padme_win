@echo off
echo 正在打开Keycloak管理控制台...
echo.
echo 访问信息:
echo - URL: http://localhost:8090/admin/
echo - 用户名: admin
echo - 密码: admin_password_2024
echo.
echo 如果页面显示错误，请尝试以下路径:
echo - http://localhost:8090/
echo - http://localhost:8090/admin/master/console/
echo.

start http://localhost:8090/admin/

echo 管理控制台已在浏览器中打开
pause
