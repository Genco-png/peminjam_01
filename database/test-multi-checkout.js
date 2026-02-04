const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function testCreateMultiItem() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'peminjaman_alat_gunung'
    };

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        const user_id = 4; // peminjam1 typically
        const items = [
            { alat_id: 1, jumlah: 1 },
            { alat_id: 2, jumlah: 1 }
        ];
        const tanggal_pinjam = new Date().toISOString().split('T')[0];
        const tanggal_kembali_rencana = '2026-02-10';
        const keperluan = 'Test Multi Item';
        const isMultiItem = true;
        const alatId = null;
        const jumlah = null;

        console.log('Inserting into peminjaman...');
        const [result] = await connection.execute(
            `INSERT INTO peminjaman (user_id, alat_id, jumlah, tanggal_pinjam, tanggal_kembali_rencana, keperluan, status, is_multi_item)
             VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)`,
            [user_id, alatId, jumlah, tanggal_pinjam, tanggal_kembali_rencana, keperluan, isMultiItem]
        );

        const peminjamanId = result.insertId;
        console.log('Peminjaman created with ID:', peminjamanId);

        for (const item of items) {
            console.log(`Inserting detail for alat_id ${item.alat_id}...`);
            await connection.execute(
                'INSERT INTO peminjaman_detail (peminjaman_id, alat_id, jumlah) VALUES (?, ?, ?)',
                [peminjamanId, item.alat_id, item.jumlah]
            );
        }

        await connection.commit();
        console.log('✅ Transaction committed successfully!');

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Error testing multi-item creation:');
        console.error(error);
    } finally {
        if (connection) await connection.end();
    }
}

testCreateMultiItem();
