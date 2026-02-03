const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function fixDashboardCache() {
    let connection;

    try {
        console.log('🔧 Fixing dashboard cache issue...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'peminjaman_alat_gunung'
        });

        // Check current stats
        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'Dipinjam' THEN 1 ELSE 0 END) as dipinjam,
                SUM(CASE WHEN status = 'Terlambat' THEN 1 ELSE 0 END) as terlambat,
                SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as selesai
            FROM peminjaman
        `);

        console.log('📊 Current Database Stats:');
        console.table(stats);

        const sedangDipinjam = Number(stats[0].approved) + Number(stats[0].dipinjam);
        console.log(`\n✅ Correct "Sedang Dipinjam" value: ${sedangDipinjam}`);

        console.log('\n💡 If frontend still shows wrong number:');
        console.log('   1. Restart backend server (Ctrl+C, then npm run dev)');
        console.log('   2. Hard refresh browser (Ctrl+Shift+R or Ctrl+F5)');
        console.log('   3. Clear browser cache completely');
        console.log('   4. Try incognito/private browsing mode');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixDashboardCache();
