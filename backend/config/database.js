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

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('✅ MySQL Database connected successfully');
        console.log(`📊 Database: ${process.env.DB_NAME || 'peminjaman_alat_gunung'}`);
        connection.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection error:', err.message);
        console.error('Please check your database configuration in .env file');
    });

// Export pool as promisePool for compatibility with existing code
module.exports = {
    pool,
    promisePool: pool,
    
    // Helper function for queries (for backward compatibility)
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
