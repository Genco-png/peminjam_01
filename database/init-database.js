const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

// Database configuration
const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
};

const dbName = process.env.DB_NAME || 'peminjaman_alat_gunung';

async function initDatabase() {
    let connection;

    try {
        console.log('================================================');
        console.log('🚀 MySQL Database Auto-Setup');
        console.log('================================================');
        console.log('');

        // Connect to MySQL server (without database)
        console.log('📡 Connecting to MySQL server...');
        connection = await mysql.createConnection(config);
        console.log('✅ Connected to MySQL server');
        console.log('');

        // Drop and create database
        console.log(`🗑️  Dropping database if exists: ${dbName}`);
        await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
        console.log('✅ Database dropped (if existed)');

        console.log(`📦 Creating database: ${dbName}`);
        await connection.query(`CREATE DATABASE ${dbName}`);
        console.log('✅ Database created');

        // Use the new database
        await connection.query(`USE ${dbName}`);
        console.log('');

        // Helper function to clean and execute SQL with DELIMITER support
        const executeSqlFile = async (filePath) => {
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  File not found: ${path.basename(filePath)}, skipping...`);
                return;
            }

            let sql = fs.readFileSync(filePath, 'utf8');

            // Handle DELIMITER // used in functions, procedures, and triggers
            if (sql.includes('DELIMITER //')) {
                sql = sql.replace(/DELIMITER \/\//g, '');
                sql = sql.replace(/DELIMITER ;/g, '');
                sql = sql.replace(/\/\//g, ';');
            }

            await connection.query(sql);
        };

        // Import schema
        console.log('[1/5] 📋 Importing schema...');
        await executeSqlFile(path.join(__dirname, 'schema.sql'));
        console.log('✅ Schema imported successfully');
        console.log('');

        // Import functions
        console.log('[2/5] ⚙️  Importing functions...');
        await executeSqlFile(path.join(__dirname, 'functions.sql'));
        console.log('✅ Functions imported successfully');
        console.log('');

        // Import stored procedures
        console.log('[3/5] 📝 Importing stored procedures...');
        await executeSqlFile(path.join(__dirname, 'stored_procedures.sql'));
        console.log('✅ Stored procedures imported successfully');
        console.log('');

        // Import triggers
        console.log('[4/5] 🔔 Importing triggers...');
        await executeSqlFile(path.join(__dirname, 'triggers.sql'));
        console.log('✅ Triggers imported successfully');
        console.log('');

        // Import seed data
        console.log('[5/5] 🌱 Importing seed data...');
        await executeSqlFile(path.join(__dirname, 'seed_data.sql'));
        console.log('✅ Seed data imported successfully');
        console.log('');

        // Verify installation
        console.log('🔍 Verifying installation...');
        const [tables] = await connection.query(
            `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?`,
            [dbName]
        );
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        const [alat] = await connection.query('SELECT COUNT(*) as count FROM alat');
        const [kategori] = await connection.query('SELECT COUNT(*) as count FROM kategori');

        console.log('');
        console.log('================================================');
        console.log('✅ Database Setup Complete!');
        console.log('================================================');
        console.log(`📊 Database: ${dbName}`);
        console.log(`📋 Total Tables: ${tables[0].count}`);
        console.log(`👥 Total Users: ${users[0].count}`);
        console.log(`🎒 Total Alat: ${alat[0].count}`);
        console.log(`📂 Total Kategori: ${kategori[0].count}`);
        console.log('');
        console.log('Default users created:');
        console.log('- Admin:    admin / admin123');
        console.log('- Petugas:  petugas1 / petugas123');
        console.log('- Peminjam: peminjam1 / peminjam123');
        console.log('');
        console.log('Next steps:');
        console.log('1. cd backend && npm install && npm run dev');
        console.log('2. cd frontend && npm install && npm run dev');
        console.log('================================================');

    } catch (error) {
        console.error('');
        console.error('❌ Error during database setup:');
        console.error(error.message);
        console.error('');
        console.error('Please check:');
        console.error('1. MySQL server is running');
        console.error('2. Database credentials in .env file are correct');
        console.error('3. MySQL user has permission to create databases');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the initialization
initDatabase();
