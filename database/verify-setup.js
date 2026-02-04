const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'peminjaman_alat_gunung'
};

async function verify() {
    let connection;
    try {
        connection = await mysql.createConnection(config);

        console.log('--- Verifying Tables ---');
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables found:', tables.map(t => Object.values(t)[0]).join(', '));

        console.log('\n--- Verifying Columns in peminjaman ---');
        const [columns] = await connection.query('SHOW COLUMNS FROM peminjaman');
        const colNames = columns.map(c => c.Field);
        console.log('Columns in peminjaman:', colNames.join(', '));

        if (colNames.includes('is_multi_item') && colNames.includes('return_requested')) {
            console.log('✅ Migration columns found in peminjaman');
        } else {
            console.log('❌ Missing migration columns in peminjaman');
        }

        console.log('\n--- Verifying Seed Data ---');
        const [users] = await connection.query('SELECT username FROM users');
        console.log('Users found:', users.map(u => u.username).join(', '));

        if (users.some(u => u.username === 'admin')) {
            console.log('✅ Admin user found');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

verify();
