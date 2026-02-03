const bcrypt = require('bcryptjs');

async function generateHashes() {
    const admin = await bcrypt.hash('admin123', 10);
    const petugas = await bcrypt.hash('petugas123', 10);
    const peminjam = await bcrypt.hash('peminjam123', 10);

    console.log('admin123:', admin);
    console.log('petugas123:', petugas);
    console.log('peminjam123:', peminjam);
}

generateHashes();
