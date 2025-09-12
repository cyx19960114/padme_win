// 前端诊断脚本 - 在浏览器控制台中运行
console.log('=== PADME Central Service 前端诊断 ===');

// 1. 检查基本DOM元素
console.log('1. DOM检查:');
console.log('- Document ready:', document.readyState);
console.log('- Body内容:', document.body?.innerHTML?.length > 0 ? '有内容' : '空白');
console.log('- React root:', document.getElementById('root') ? '找到' : '未找到');

// 2. 检查静态资源
console.log('\n2. 静态资源检查:');
const scripts = document.querySelectorAll('script[src]');
const styles = document.querySelectorAll('link[rel="stylesheet"]');
console.log('- JavaScript文件数量:', scripts.length);
console.log('- CSS文件数量:', styles.length);

// 3. 检查网络请求
console.log('\n3. 网络请求检查:');
if (window.performance && window.performance.getEntriesByType) {
    const resources = window.performance.getEntriesByType('resource');
    console.log('- 总资源请求数:', resources.length);
    
    const failed = resources.filter(r => r.transferSize === 0 && r.decodedBodySize === 0);
    if (failed.length > 0) {
        console.log('- 失败的请求:', failed.map(r => r.name));
    }
}

// 4. 检查JavaScript错误
console.log('\n4. JavaScript错误检查:');
window.addEventListener('error', function(e) {
    console.error('JavaScript错误:', e.error);
});

// 5. 检查React/Keycloak相关
console.log('\n5. React/Keycloak检查:');
console.log('- React:', typeof window.React !== 'undefined' ? '已加载' : '未加载');
console.log('- Keycloak:', typeof window.Keycloak !== 'undefined' ? '已加载' : '未加载');

// 6. 检查环境变量
console.log('\n6. 环境变量检查:');
const env = window.process?.env || {};
console.log('- REACT_APP_AUTH_SERVER_ADDRESS:', env.REACT_APP_AUTH_SERVER_ADDRESS || '未设置');
console.log('- REACT_APP_CS_API_ENDPOINT:', env.REACT_APP_CS_API_ENDPOINT || '未设置');

console.log('\n=== 诊断完成 ===');
console.log('如果看到白屏，请检查上述输出中的异常项');
