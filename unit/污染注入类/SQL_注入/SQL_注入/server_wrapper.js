// 服务器包装器 - 为原始测试代码提供必要的环境
const express = require('express');
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
const url = require("url");

// 创建Express应用
const app = express();

// 数据库配置 - 模拟原始config对象
const config = {
    db: {
        connectionString: 'postgres://testuser:testpass@postgres:5432/testdb'
    }
};

// pg-promise兼容接口（如果原始代码使用pg-promise）
const pgp = require('pg-promise')();
const db = pgp(config.db.connectionString);

// 模拟check_logged函数
function check_logged(req, res) {
    // 简单的检查，测试时直接通过
    return true;
}

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// 让这些变量全局可用
global.express = express;
global.app = app;
global.config = config;
global.db = db;
global.pgp = pgp;
global.check_logged = check_logged;
global.url = url;

// 数据库初始化函数
async function initializeDatabase() {
    try {
        // 创建产品表
        await db.none(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2),
                description TEXT
            )
        `);
        
        // 插入测试数据
        await db.none('DELETE FROM products'); // 清空现有数据
        await db.none(`
            INSERT INTO products (id, name, price, description) VALUES
            (1, 'Normal Product', 10.99, 'This is a normal product'),
            (40, 'Test Product', 25.99, 'This is a test product for injection'),
            (99, 'Secret Product', 999.99, 'This is a secret product with sensitive information'),
            (100, 'Admin Product', 888.88, 'Admin only product with confidential data')
        `);
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
}

// 获取当前正在测试的文件名
const testFile = process.env.TEST_FILE || process.argv[2] || 'testcode0.js';

console.log(`Loading test file: ${testFile}`);

try {
    // 读取测试文件内容
    let testFileContent = fs.readFileSync(path.join(__dirname, testFile), 'utf8');
    
    // 移除原文件中的重复声明和app.listen调用
    testFileContent = testFileContent.replace(/var express = require\('express'\);?/g, '// var express = require(\'express\'); // 已在wrapper中定义');
    testFileContent = testFileContent.replace(/var url = require\("url"\);?/g, '// var url = require("url"); // 已在wrapper中定义');
    testFileContent = testFileContent.replace(/app\.listen\s*\([^)]*\)[^;]*;?/g, '');
    
    // 处理router相关代码 - 将router.get转换为app.get
    testFileContent = testFileContent.replace(/var router = express\.Router\(\);?/g, '');
    testFileContent = testFileContent.replace(/router\.get\(/g, 'app.get(');
    
    // 处理pg-promise声明
    testFileContent = testFileContent.replace(/pgp = require\('pg-promise'\)\(\),?\s*db = pgp\(config\.db\.connectionString\);?/g, '// pg-promise已在wrapper中初始化');
    
    // 修复db.one()调用为db.oneOrNone()以处理可能的空结果
    testFileContent = testFileContent.replace(/return db\.one\(/g, 'return db.oneOrNone(');
    testFileContent = testFileContent.replace(/db\.one\(/g, 'db.oneOrNone(');
    
    // 处理可能的模块导出
    testFileContent = testFileContent.replace(/module\.exports = router;?/g, '// module.exports = router; // 不需要导出');
    
    // 清理多余的空行和格式问题
    testFileContent = testFileContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // 处理特定的语法问题 - 移除末尾多余的闭括号
    // 先清理末尾的空白和多余符号
    testFileContent = testFileContent.trim();
    
    // 移除末尾的多余 });
    if (testFileContent.endsWith('});')) {
        testFileContent = testFileContent.slice(0, -3);
    }
    
    // 检查函数结构完整性
    const lines = testFileContent.split('\n');
    const cleanLines = [];
    let braceCount = 0;
    
    for (let line of lines) {
        const openCount = (line.match(/\{/g) || []).length;
        const closeCount = (line.match(/\}/g) || []).length;
        
        braceCount += openCount - closeCount;
        
        // 跳过只有闭括号的行，如果它会导致负的brace计数
        if (line.trim() === '}' && braceCount < 0) {
            braceCount += 1; // 恢复计数
            continue;
        }
        
        cleanLines.push(line);
    }
    
    testFileContent = cleanLines.join('\n');
    
    console.log(`最终的brace计数: ${braceCount}`);
    
    // 添加兼容的res.render方法（原始代码使用render但我们返回JSON）
    app.use((req, res, next) => {
        const originalRender = res.render;
        res.render = function(template, data) {
            // 将render调用转换为JSON响应
            res.json({
                success: true,
                template: template,
                data: data
            });
        };
        next();
    });
    
    console.log('处理后的测试文件内容:');
    console.log('================================');
    console.log(testFileContent);
    console.log('================================');
    
    // 动态执行测试文件
    eval(testFileContent);
    console.log(`Test file ${testFile} loaded successfully`);
} catch (error) {
    console.error(`Error loading test file ${testFile}:`, error);
    
    // 如果加载失败，提供一个基本的路由
    app.get('/products/detail', (req, res) => {
        res.status(500).json({
            success: false,
            error: `Failed to load test file: ${testFile}`,
            message: error.message
        });
    });
}

// 启动服务器
const PORT = process.env.PORT || 3000;

// 异步启动函数
async function startServer() {
    try {
        // 先初始化数据库
        await initializeDatabase();
        
        // 然后启动服务器
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// 启动服务器
startServer();
