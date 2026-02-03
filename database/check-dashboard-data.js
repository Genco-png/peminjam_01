const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function checkDashboardData() {
    let connection;

    try {
        console.log('🔍 Checking dashboard data...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'peminjaman_alat_gunung'
        });

        // Check peminjaman count by status
        const [peminjamanStats] = await connection.execute(`
            SELECT 
                status,
                COUNT(*) as count
            FROM peminjaman
            GROUP BY status
            ORDER BY status
        `);

        console.log('📊 Peminjaman by Status:');
        console.table(peminjamanStats);

        // Check total peminjaman
        const [totalPeminjaman] = await connection.execute(`
            SELECT COUNT(*) as total FROM peminjaman
        `);
        console.log(`\n📝 Total Peminjaman Records: ${totalPeminjaman[0].total}`);

        // Check peminjaman_detail count
        const [detailCount] = await connection.execute(`
            SELECT COUNT(*) as total FROM peminjaman_detail
        `);
        console.log(`📋 Total Peminjaman Detail Records: ${detailCount[0].total}`);

        // Check for peminjaman with multiple items
        const [multiItemLoans] = await connection.execute(`
            SELECT 
                p.id,
                p.status,
                p.is_multi_item,
                COUNT(pd.id) as item_count
            FROM peminjaman p
            LEFT JOIN peminjaman_detail pd ON p.id = pd.peminjaman_id
            GROUP BY p.id
            HAVING item_count > 1
        `);

        console.log(`\n🛒 Multi-item Loans: ${multiItemLoans.length}`);
        if (multiItemLoans.length > 0) {
            console.table(multiItemLoans);
        }

        // Check for orphaned detail records
        const [orphanedDetails] = await connection.execute(`
            SELECT COUNT(*) as total
            FROM peminjaman_detail pd
            LEFT JOIN peminjaman p ON pd.peminjaman_id = p.id
            WHERE p.id IS NULL
        `);
        console.log(`\n⚠️  Orphaned Detail Records: ${orphanedDetails[0].total}`);

        // Show sample peminjaman records
        const [sampleLoans] = await connection.execute(`
            SELECT 
                p.id,
                p.status,
                p.is_multi_item,
                p.alat_id,
                p.jumlah,
                u.username,
                (SELECT COUNT(*) FROM peminjaman_detail pd WHERE pd.peminjaman_id = p.id) as detail_count
            FROM peminjaman p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 10
        `);

        console.log('\n📋 Sample Peminjaman Records (Latest 10):');
        console.table(sampleLoans);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkDashboardData();
