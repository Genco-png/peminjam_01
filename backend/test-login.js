// Test script to verify password hashing
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testLogin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'peminjaman_alat_gunung'
    });

    try {
        console.log('🔍 Testing login credentials...\n');

        // Get admin user
        const [users] = await connection.execute(
            'SELECT username, password FROM users WHERE username = ?',
            ['admin']
        );

        if (users.length === 0) {
            console.log('❌ User admin not found!');
            return;
        }

        const user = users[0];
        console.log('✅ User found:', user.username);
        console.log('📝 Password hash in DB:', user.password.substring(0, 30) + '...');

        // Test password
        const testPassword = 'admin123';
        console.log('🔐 Testing password:', testPassword);

        const isValid = await bcrypt.compare(testPassword, user.password);

        if (isValid) {
            console.log('✅ Password is VALID! Login should work.');
        } else {
            console.log('❌ Password is INVALID! There is a problem.');

            // Try to create correct hash
            console.log('\n🔧 Creating new hash for admin123...');
            const newHash = await bcrypt.hash('admin123', 10);
            console.log('New hash:', newHash);

            // Update database
            await connection.execute(
                'UPDATE users SET password = ? WHERE username = ?',
                [newHash, 'admin']
            );
            console.log('✅ Password updated in database!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

testLogin();
