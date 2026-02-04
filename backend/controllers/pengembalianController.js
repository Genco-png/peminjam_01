const db = require('../config/database');

// Get all pengembalian
exports.getAllPengembalian = async (req, res) => {
    try {
        // Fetch loans with return_requested = TRUE (pending returns)
        const [pendingReturns] = await db.promisePool.execute(
            `SELECT p.*, 
                   u.nama as nama_peminjam, u.username,
                   a.nama_alat, a.kode_alat,
                   k.nama_kategori,
                   p.return_requested_at,
                   -- Real-time late fee calculation
                   CASE 
                       WHEN p.status IN ('Approved', 'Dipinjam', 'Terlambat') AND p.tanggal_kembali_rencana < CURDATE()
                       THEN fn_get_hari_terlambat(p.tanggal_kembali_rencana, CURDATE())
                       ELSE 0
                   END as hari_terlambat_sekarang,
                   CASE 
                       WHEN p.status IN ('Approved', 'Dipinjam', 'Terlambat') AND p.tanggal_kembali_rencana < CURDATE()
                       THEN fn_calculate_denda(p.tanggal_kembali_rencana, CURDATE())
                       ELSE 0
                   END as denda_terlambat_sekarang
            FROM peminjaman p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN alat a ON p.alat_id = a.id
            LEFT JOIN kategori k ON a.kategori_id = k.id
            WHERE p.return_requested = TRUE 
              AND p.status IN ('Approved', 'Dipinjam', 'Terlambat')
            ORDER BY p.return_requested_at DESC`
        );

        // Fetch detail items for each loan
        for (let loan of pendingReturns) {
            const [details] = await db.promisePool.execute(
                `SELECT pd.*, a.nama_alat, a.kode_alat, a.harga_sewa, k.nama_kategori
                 FROM peminjaman_detail pd
                 JOIN alat a ON pd.alat_id = a.id
                 JOIN kategori k ON a.kategori_id = k.id
                 WHERE pd.peminjaman_id = ?`,
                [loan.id]
            );
            loan.items = details;
        }

        res.json({
            success: true,
            data: pendingReturns
        });

    } catch (error) {
        console.error('Get all pengembalian error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get pengembalian by ID
exports.getPengembalianById = async (req, res) => {
    try {
        const { id } = req.params;

        const [pengembalian] = await db.promisePool.execute(
            `SELECT pg.*, 
                   p.kode_peminjaman, p.tanggal_pinjam, p.tanggal_kembali_rencana, p.jumlah,
                   u.nama as nama_peminjam, u.username, u.email,
                   a.nama_alat, a.kode_alat, a.harga_sewa,
                   k.nama_kategori,
                   petugas.nama as processed_by_nama
            FROM pengembalian pg
            JOIN peminjaman p ON pg.peminjaman_id = p.id
            JOIN users u ON p.user_id = u.id
            JOIN alat a ON p.alat_id = a.id
            JOIN kategori k ON a.kategori_id = k.id
            LEFT JOIN users petugas ON pg.processed_by = petugas.id
            WHERE pg.id = ?`,
            [id]
        );

        if (pengembalian.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pengembalian not found'
            });
        }

        res.json({
            success: true,
            data: pengembalian[0]
        });

    } catch (error) {
        console.error('Get pengembalian by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Process pengembalian
exports.processPengembalian = async (req, res) => {
    try {
        const { peminjaman_id, tanggal_kembali, kondisi_alat, jumlah_kembali, keterangan } = req.body;
        const processed_by = req.user.id;

        // Validation
        if (!peminjaman_id || !tanggal_kembali || !kondisi_alat || !jumlah_kembali) {
            return res.status(400).json({
                success: false,
                message: 'Peminjaman ID, tanggal kembali, kondisi alat, and jumlah kembali are required'
            });
        }

        // Call stored procedure
        const [result] = await db.promisePool.execute(
            'CALL sp_process_pengembalian(?, ?, ?, ?, ?, ?, @success, @message, @total_denda)',
            [peminjaman_id, tanggal_kembali, kondisi_alat, jumlah_kembali, keterangan, processed_by]
        );

        // Get output parameters
        const [output] = await db.promisePool.execute(
            'SELECT @success as success, @message as message, @total_denda as total_denda'
        );

        const { success, message, total_denda } = output[0];

        if (success) {
            res.json({
                success: true,
                message: message || 'Pengembalian berhasil diproses',
                data: {
                    total_denda: parseFloat(total_denda) || 0
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: message || 'Failed to process pengembalian'
            });
        }

    } catch (error) {
        console.error('Process pengembalian error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Calculate denda preview
exports.calculateDenda = async (req, res) => {
    try {
        const { peminjaman_id, tanggal_kembali, kondisi_alat } = req.body;

        if (!peminjaman_id || !tanggal_kembali || !kondisi_alat) {
            return res.status(400).json({
                success: false,
                message: 'Peminjaman ID, tanggal kembali, and kondisi alat are required'
            });
        }

        // Get peminjaman details
        const [peminjaman] = await db.promisePool.execute(
            `SELECT p.tanggal_kembali_rencana, a.harga_sewa
             FROM peminjaman p
             JOIN alat a ON p.alat_id = a.id
             WHERE p.id = ?`,
            [peminjaman_id]
        );

        if (peminjaman.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Peminjaman not found'
            });
        }

        const { tanggal_kembali_rencana, harga_sewa } = peminjaman[0];

        // Calculate penalties using functions
        const [dendaResult] = await db.promisePool.execute(
            'SELECT fn_calculate_denda(?, ?) as denda_terlambat, fn_get_hari_terlambat(?, ?) as hari_terlambat',
            [tanggal_kembali_rencana, tanggal_kembali, tanggal_kembali_rencana, tanggal_kembali]
        );

        const [dendaKerusakanResult] = await db.promisePool.execute(
            'SELECT fn_calculate_denda_kerusakan(?, ?) as denda_kerusakan',
            [kondisi_alat, harga_sewa]
        );

        const denda_terlambat = parseFloat(dendaResult[0].denda_terlambat) || 0;
        const hari_terlambat = parseInt(dendaResult[0].hari_terlambat) || 0;
        const denda_kerusakan = parseFloat(dendaKerusakanResult[0].denda_kerusakan) || 0;
        const total_denda = denda_terlambat + denda_kerusakan;

        res.json({
            success: true,
            data: {
                hari_terlambat,
                denda_terlambat,
                denda_kerusakan,
                total_denda,
                denda_per_hari: 5000
            }
        });

    } catch (error) {
        console.error('Calculate denda error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
