const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
};

async function runSetup() {
    let connection;
    try {
        console.log('🚀 Starting Database Auto-Setup...');
        // Create a copy of config without the database name to connect to the server first
        const serverConfig = { ...config };

        connection = await mysql.createConnection(serverConfig);

        const sqlPath = path.join(__dirname, 'setup.sql');
        let sql = fs.readFileSync(sqlPath, 'utf8');

        // Handle DELIMITER //
        const statements = sql
            .split(/DELIMITER \/\/|DELIMITER ;/g)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (let statement of statements) {
            if (statement.includes('//')) {
                const cleanStatement = statement.replace(/\/\//g, ';');
                await connection.query(cleanStatement);
            } else {
                await connection.query(statement);
            }
        }

        console.log('✅ Database setup successfully!');
        return true;
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

// Support both CLI and module import
if (require.main === module) {
    runSetup()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = runSetup;
