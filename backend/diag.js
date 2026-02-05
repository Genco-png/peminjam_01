const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        const [rows] = await connection.execute('SELECT id, username, role_id, is_active FROM users');
        console.log('👥 Users found:', rows.length);
        console.table(rows);

        await connection.end();
    } catch (error) {
        console.error('❌ Database error:', error.message);
    }
}

checkDB();
