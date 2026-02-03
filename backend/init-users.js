// Script to initialize users with properly hashed passwords
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeUsers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'peminjaman_alat_gunung'
    });

    try {
        console.log('🔐 Initializing users with hashed passwords...');

        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const petugasPassword = await bcrypt.hash('petugas123', 10);
        const peminjamPassword = await bcrypt.hash('peminjam123', 10);

        // Delete existing users
        await connection.execute('DELETE FROM users');
        console.log('✅ Cleared existing users');

        // Insert users with hashed passwords
        const users = [
            ['admin', adminPassword, 'Administrator', 'admin@example.com', '081234567890', 'Jl. Admin No. 1', 1],
            ['petugas1', petugasPassword, 'Petugas Satu', 'petugas1@example.com', '081234567891', 'Jl. Petugas No. 1', 2],
            ['petugas2', petugasPassword, 'Petugas Dua', 'petugas2@example.com', '081234567892', 'Jl. Petugas No. 2', 2],
            ['peminjam1', peminjamPassword, 'Peminjam Satu', 'peminjam1@example.com', '081234567893', 'Jl. Peminjam No. 1', 3],
            ['peminjam2', peminjamPassword, 'Peminjam Dua', 'peminjam2@example.com', '081234567894', 'Jl. Peminjam No. 2', 3]
        ];

        for (const user of users) {
            await connection.execute(
                'INSERT INTO users (username, password, nama, email, no_telepon, alamat, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                user
            );
            console.log(`✅ Created user: ${user[0]}`);
        }

        console.log('\n🎉 User initialization complete!');
        console.log('\nDefault credentials:');
        console.log('- Admin:    admin / admin123');
        console.log('- Petugas:  petugas1 / petugas123');
        console.log('- Peminjam: peminjam1 / peminjam123');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

initializeUsers();
