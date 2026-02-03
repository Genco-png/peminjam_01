const axios = require('axios');

async function testDashboardAPI() {
    try {
        console.log('🧪 Testing Dashboard API...\n');

        // You need to login first to get a token
        console.log('1️⃣ Logging in as petugas...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'petugas1',
            password: 'petugas123'
        });

        const token = loginResponse.data.data.token;
        console.log('✅ Login successful!\n');

        // Get dashboard stats
        console.log('2️⃣ Fetching dashboard stats...');
        const dashboardResponse = await axios.get('http://localhost:5000/api/laporan/dashboard-stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📊 Dashboard Stats Response:');
        console.log(JSON.stringify(dashboardResponse.data.data, null, 2));

        console.log('\n📈 Peminjaman Stats:');
        console.table(dashboardResponse.data.data.peminjaman);

    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testDashboardAPI();
