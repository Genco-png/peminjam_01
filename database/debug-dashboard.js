const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function debugDashboard() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'peminjaman_alat_gunung'
        });

        console.log('🔍 Running exact same query as backend...\n');

        const [peminjamanStats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_peminjaman,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'Dipinjam' THEN 1 ELSE 0 END) as dipinjam,
                SUM(CASE WHEN status = 'Terlambat' THEN 1 ELSE 0 END) as terlambat,
                SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as selesai
            FROM peminjaman
        `);

        console.log('📊 Result from backend query:');
        console.table(peminjamanStats);

        console.log('\n🧮 Calculation for "Sedang Dipinjam":');
        console.log(`approved (${peminjamanStats[0].approved}) + dipinjam (${peminjamanStats[0].dipinjam}) = ${Number(peminjamanStats[0].approved) + Number(peminjamanStats[0].dipinjam)}`);

        // Check all records
        const [allRecords] = await connection.execute(`
            SELECT id, user_id, status, alat_id, jumlah, is_multi_item, created_at
            FROM peminjaman
            ORDER BY id
        `);

        console.log('\n📋 All peminjaman records:');
        console.table(allRecords);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

debugDashboard();
