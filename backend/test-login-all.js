const http = require('http');

async function testLogin(username, password) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ username, password });
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });

        req.on('error', (e) => resolve({ error: e.message }));
        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('--- Admin ---');
    console.log(await testLogin('admin', 'admin123'));
    console.log('--- Petugas ---');
    console.log(await testLogin('petugas1', 'petugas123'));
    console.log('--- Peminjam ---');
    console.log(await testLogin('peminjam1', 'peminjam123'));
}

runTests();
