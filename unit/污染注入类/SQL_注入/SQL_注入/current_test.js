const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL连接配置
const pool = new Pool({
    user: 'testuser',
    host: 'postgres',
    database: 'testdb',
    password: 'testpass',
    port: 5432,
});

// 初始化数据库表和测试数据
async function initDatabase() {
    try {
        const client = await pool.connect();
        
        // 创建products表
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 清空并插入测试数据
        await client.query('DELETE FROM products');
        await client.query(`
            INSERT INTO products (id, name, price, description) VALUES 
            (1, 'Product A', 29.99, 'Description for product A'),
            (2, 'Product B', 49.99, 'Description for product B'),
            (3, 'Secret Product', 999.99, 'This is a secret product that should not be accessible')
        `);
        
        console.log('Database initialized successfully');
        client.release();
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

// 基于原始testcode0.js的漏洞函数
function getProduct(product_id) {
    // SQL注入漏洞 - 直接字符串拼接
    var q = "SELECT * FROM products WHERE id = '" + product_id + "';";
    console.log('Executing SQL:', q);
    return pool.query(q);
}

// 模拟check_logged函数
function check_logged(req, res) {
    // 简单的模拟实现
    return true;
}

// 基于原始路由的API端点
app.get('/products/detail', async (req, res) => {
    try {
        check_logged(req, res);
        
        // SOURCE - 从URL参数获取product_id
        var product_id = req.query.id;
        console.log('Received product_id:', product_id);
        
        // 调用存在漏洞的getProduct函数
        const result = await getProduct(product_id);
        
        if (result.rows.length > 0) {
            // 模拟render响应
            res.json({
                success: true,
                products: result.rows,
                count: result.rows.length,
                template: 'product_detail'
            });
        } else {
            res.json({
                success: false,
                message: 'No products found',
                products: [],
                template: 'products'
            });
        }
    } catch (err) {
        console.error('SQL Error:', err);
        res.status(500).json({
            success: false,
            error: err.message,
            sqlState: err.code,
            template: 'products'
        });
    }
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 启动服务器前初始化数据库
initDatabase().then(() => {
    console.log('Starting server...');
});

app.listen(3000);
