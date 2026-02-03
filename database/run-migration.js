const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function runMigration() {
    let connection;

    try {
        console.log('🔄 Running migration for multi-item borrowing...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'peminjaman_alat_gunung',
            multipleStatements: true
        });

        const sql = fs.readFileSync(path.join(__dirname, 'migration_multi_item.sql'), 'utf8');

        await connection.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('📊 New table created: peminjaman_detail');
        console.log('🔧 Triggers updated to support multi-item loans');
        console.log('📝 Stored procedures updated');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
