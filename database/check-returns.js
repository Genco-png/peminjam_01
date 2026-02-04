const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function checkSpecificLogs() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'peminjaman_alat_gunung'
        });

        console.log('--- REQUEST_RETURN Logs ---');
        const [reqLogs] = await connection.execute("SELECT * FROM log_aktivitas WHERE aksi = 'REQUEST_RETURN' OR detail LIKE '%mengajukan%'");
        console.table(reqLogs);

        console.log('\n--- Pending Return Requests in Peminjaman ---');
        const [pending] = await connection.execute("SELECT id, kode_peminjaman, return_requested, status FROM peminjaman WHERE return_requested = 1");
        console.table(pending);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkSpecificLogs();
