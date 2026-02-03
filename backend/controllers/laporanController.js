const db = require('../config/database');

// Get laporan peminjaman
exports.getLaporanPeminjaman = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        // Call stored procedure
        const [laporan] = await db.promisePool.execute(
            'CALL sp_get_laporan_peminjaman(?, ?)',
            [start_date, end_date]
        );

        res.json({
            success: true,
            data: laporan[0] // First result set from stored procedure
        });

    } catch (error) {
        console.error('Get laporan peminjaman error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get alat populer
exports.getAlatPopuler = async (req, res) => {
    try {
        const { limit } = req.query;
        const limitValue = parseInt(limit) || 10;

        // Call stored procedure
        const [laporan] = await db.promisePool.execute(
            'CALL sp_get_alat_populer(?)',
            [limitValue]
        );

        res.json({
            success: true,
            data: laporan[0]
        });

    } catch (error) {
        console.error('Get alat populer error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get laporan denda
exports.getLaporanDenda = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = `
            SELECT pg.*, 
                   p.kode_peminjaman, p.tanggal_pinjam, p.tanggal_kembali_rencana,
                   u.nama as nama_peminjam, u.username,
                   a.nama_alat, a.kode_alat,
                   k.nama_kategori
            FROM pengembalian pg
            JOIN peminjaman p ON pg.peminjaman_id = p.id
            JOIN users u ON p.user_id = u.id
            JOIN alat a ON p.alat_id = a.id
            JOIN kategori k ON a.kategori_id = k.id
            WHERE pg.total_denda > 0
        `;
        let params = [];

        if (start_date && end_date) {
            query += ' AND pg.tanggal_kembali_aktual BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        query += ' ORDER BY pg.total_denda DESC';

        const [laporan] = await db.promisePool.execute(query, params);

        // Calculate totals
        const totalDenda = laporan.reduce((sum, item) => sum + parseFloat(item.total_denda), 0);
        const totalDendaTerlambat = laporan.reduce((sum, item) => sum + parseFloat(item.denda), 0);
        const totalDendaKerusakan = laporan.reduce((sum, item) => sum + parseFloat(item.denda_kerusakan), 0);

        res.json({
            success: true,
            data: {
                laporan,
                summary: {
                    total_records: laporan.length,
                    total_denda: totalDenda,
                    total_denda_terlambat: totalDendaTerlambat,
                    total_denda_kerusakan: totalDendaKerusakan
                }
            }
        });

    } catch (error) {
        console.error('Get laporan denda error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        // Total alat
        const [totalAlat] = await db.promisePool.execute(
            'SELECT COUNT(*) as total, SUM(jumlah_total) as total_unit FROM alat'
        );

        // Total users by role
        const [totalUsers] = await db.promisePool.execute(
            `SELECT r.nama_role, COUNT(u.id) as total
             FROM roles r
             LEFT JOIN users u ON r.id = u.role_id AND u.is_active = TRUE
             GROUP BY r.id, r.nama_role`
        );

        // Peminjaman statistics
        const [peminjamanStats] = await db.promisePool.execute(
            `SELECT 
                COUNT(*) as total_peminjaman,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'Dipinjam' THEN 1 ELSE 0 END) as dipinjam,
                SUM(CASE WHEN status = 'Terlambat' THEN 1 ELSE 0 END) as terlambat,
                SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as selesai
             FROM peminjaman`
        );

        // Total denda
        const [totalDenda] = await db.promisePool.execute(
            'SELECT SUM(total_denda) as total_denda FROM pengembalian'
        );

        // Recent activities
        const [recentActivities] = await db.promisePool.execute(
            `SELECT la.*, u.nama as user_nama, u.username
             FROM log_aktivitas la
             LEFT JOIN users u ON la.user_id = u.id
             ORDER BY la.timestamp DESC
             LIMIT 10`
        );

        res.json({
            success: true,
            data: {
                alat: totalAlat[0],
                users: totalUsers,
                peminjaman: peminjamanStats[0],
                total_denda: parseFloat(totalDenda[0].total_denda) || 0,
                recent_activities: recentActivities
            }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get log aktivitas
exports.getLogAktivitas = async (req, res) => {
    try {
        const { limit, user_id, aksi } = req.query;
        const limitValue = parseInt(limit) || 50;

        let query = `
            SELECT la.*, u.nama as user_nama, u.username
            FROM log_aktivitas la
            LEFT JOIN users u ON la.user_id = u.id
            WHERE 1=1
        `;
        let params = [];

        if (user_id) {
            query += ' AND la.user_id = ?';
            params.push(user_id);
        }

        if (aksi) {
            query += ' AND la.aksi = ?';
            params.push(aksi);
        }

        query += ' ORDER BY la.timestamp DESC LIMIT ?';
        params.push(limitValue);

        const [logs] = await db.promisePool.execute(query, params);

        res.json({
            success: true,
            data: logs
        });

    } catch (error) {
        console.error('Get log aktivitas error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
