const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'peminjaman_alat_gunung',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Export pool
const db = {
    pool,
    promisePool: pool,
    async query(sql, params) {
        try {
            const [results] = await pool.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Query error:', error);
            throw error;
        }
    }
};

// Test connection and auto-setup if needed
async function testAndSetup() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL Database connected successfully');
        console.log(`📊 Database: ${process.env.DB_NAME || 'peminjaman_alat_gunung'}`);
        connection.release();
    } catch (err) {
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.log('⚠️ Database not found, attempting auto-setup...');
            try {
                const runSetup = require('../../database/setup');
                await runSetup();
                console.log('✅ Auto-setup complete, database is ready.');
            } catch (setupErr) {
                console.error('❌ Auto-setup failed:', setupErr.message);
            }
        } else {
            console.error('❌ MySQL connection error:', err.message);
            console.error('Please check your database configuration in .env file');
        }
    }
}

testAndSetup();

module.exports = db;
