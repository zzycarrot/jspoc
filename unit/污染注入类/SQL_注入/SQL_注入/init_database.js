const { Client } = require('pg');

async function initDatabase() {
    const client = new Client({
        host: 'postgres',
        port: 5432,
        database: 'testdb',
        user: 'testuser',
        password: 'testpass'
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL');

        // 创建products表
        await client.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 清空现有数据
        await client.query('DELETE FROM products');

        // 插入测试数据
        await client.query(`
            INSERT INTO products (name, price, description) VALUES 
            ('Product A', 29.99, 'Description for product A'),
            ('Product B', 49.99, 'Description for product B'),
            ('Secret Product', 999.99, 'This is a secret product that should not be accessible')
        `);

        console.log('Database initialized successfully');
        
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    } finally {
        await client.end();
        process.exit(0);
    }
}

initDatabase();
