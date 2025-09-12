@echo off
echo ========================================
echo 创建无认证测试版本的 PADME Playground
echo ========================================

echo.
echo 这将创建一个临时的无认证版本来测试基本功能...

echo.
echo 1. 停止前端服务...
docker-compose stop frontend

echo.
echo 2. 创建简单的测试页面...
docker run --rm -v "%cd%\test-frontend:/app" alpine sh -c "
mkdir -p /app && 
cat > /app/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>PADME Playground - 测试版本</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 50px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .status { 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 5px; 
        }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        button { 
            background: #007bff; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            margin: 5px; 
        }
        button:hover { background: #0056b3; }
        #output { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            margin-top: 20px; 
            min-height: 100px; 
            border: 1px solid #dee2e6; 
        }
    </style>
</head>
<body>
    <div class='container'>
        <h1>🎮 PADME Playground - 测试版本</h1>
        
        <div class='status success'>
            <h3>✅ 基本连接测试成功</h3>
            <p>这个页面表明前端服务正在正常工作</p>
        </div>

        <div class='status info'>
            <h3>🔧 功能测试</h3>
            <button onclick='testBackend()'>测试后端 API</button>
            <button onclick='testKeycloak()'>测试 Keycloak</button>
            <button onclick='testBlazegraph()'>测试 Blazegraph</button>
        </div>

        <div id='output'></div>

        <div class='status info'>
            <h3>📋 下一步</h3>
            <p>如果所有测试都通过，说明服务正常，问题在于Keycloak配置。</p>
            <p>如果有测试失败，我们需要先修复基础服务。</p>
        </div>
    </div>

    <script>
        function log(message, type = 'info') {
            const output = document.getElementById('output');
            const timestamp = new Date().toLocaleTimeString();
            output.innerHTML += '[' + timestamp + '] ' + message + '<br>';
            output.scrollTop = output.scrollHeight;
        }

        async function testBackend() {
            log('🔍 测试后端连接...', 'info');
            try {
                const response = await fetch('http://localhost:3002');
                if (response.ok) {
                    const text = await response.text();
                    log('✅ 后端连接成功: ' + response.status + ' - ' + text.substring(0, 50) + '...', 'success');
                } else {
                    log('⚠️ 后端响应异常: ' + response.status, 'error');
                }
            } catch (error) {
                log('❌ 后端连接失败: ' + error.message, 'error');
            }
        }

        async function testKeycloak() {
            log('🔍 测试Keycloak连接...', 'info');
            try {
                const response = await fetch('http://localhost:8090');
                if (response.ok) {
                    log('✅ Keycloak连接成功: ' + response.status, 'success');
                } else {
                    log('⚠️ Keycloak响应异常: ' + response.status, 'error');
                }
            } catch (error) {
                log('❌ Keycloak连接失败: ' + error.message, 'error');
            }
        }

        async function testBlazegraph() {
            log('🔍 测试Blazegraph连接...', 'info');
            try {
                const response = await fetch('http://localhost:9998');
                if (response.ok) {
                    log('✅ Blazegraph连接成功: ' + response.status, 'success');
                } else {
                    log('⚠️ Blazegraph响应异常: ' + response.status, 'error');
                }
            } catch (error) {
                log('❌ Blazegraph连接失败: ' + error.message, 'error');
            }
        }

        // 页面加载时自动运行测试
        window.onload = function() {
            log('🚀 PADME Playground 测试版本已加载');
            log('📊 开始自动测试...');
            setTimeout(() => {
                testBackend();
                setTimeout(() => testKeycloak(), 1000);
                setTimeout(() => testBlazegraph(), 2000);
            }, 1000);
        };
    </script>
</body>
</html>
EOF
"

echo.
echo 3. 启动临时测试服务...
docker run -d --name playground-test --rm -p 3004:80 -v "%cd%\test-frontend:/usr/share/nginx/html:ro" nginx:alpine

echo.
echo ========================================
echo 测试版本已创建！
echo ========================================
echo.
echo 请访问: http://localhost:3004
echo.
echo 这个页面将测试所有后端服务的连通性
echo 如果测试通过，说明问题在于前端的Keycloak集成
echo.
echo 测试完成后运行以下命令清理:
echo docker stop playground-test
echo rmdir /s test-frontend
echo.
pause
