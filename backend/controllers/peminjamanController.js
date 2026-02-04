const db = require('../config/database');

// Get all peminjaman with filters
exports.getAllPeminjaman = async (req, res) => {
    try {
        const { status, user_id } = req.query;
        const currentUser = req.user;

        let query = `
            SELECT p.*, 
                   u.nama as nama_peminjam, u.username,
                   a.nama_alat, a.kode_alat,
                   k.nama_kategori,
                   admin.nama as approved_by_nama,
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
                   END as denda_terlambat_sekarang,
                   DATEDIFF(p.tanggal_kembali_rencana, CURDATE()) as hari_tersisa,
                   CASE 
                       WHEN p.status IN ('Approved', 'Dipinjam', 'Terlambat') AND p.tanggal_kembali_rencana < CURDATE()
                       THEN TRUE
                       ELSE FALSE
                   END as is_overdue
            FROM peminjaman p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN alat a ON p.alat_id = a.id
            LEFT JOIN kategori k ON a.kategori_id = k.id
            LEFT JOIN users admin ON p.approved_by = admin.id
            WHERE 1=1
        `;
        let params = [];

        // If peminjam, only show their own loans
        if (currentUser.role_id === 3) {
            query += ' AND p.user_id = ?';
            params.push(currentUser.id);
        } else if (user_id) {
            query += ' AND p.user_id = ?';
            params.push(user_id);
        }

        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }

        query += ' ORDER BY p.created_at DESC';

        const [peminjaman] = await db.promisePool.execute(query, params);

        // Fetch detail items for each peminjaman
        for (let loan of peminjaman) {
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
            data: peminjaman
        });

    } catch (error) {
        console.error('Get all peminjaman error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get peminjaman by ID
exports.getPeminjamanById = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        let query = `
            SELECT p.*, 
                   u.nama as nama_peminjam, u.username, u.email, u.no_telepon,
                   a.nama_alat, a.kode_alat, a.harga_sewa,
                   k.nama_kategori,
                   admin.nama as approved_by_nama
            FROM peminjaman p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN alat a ON p.alat_id = a.id
            LEFT JOIN kategori k ON a.kategori_id = k.id
            LEFT JOIN users admin ON p.approved_by = admin.id
            WHERE p.id = ?
        `;
        let params = [id];

        // If peminjam, only allow viewing their own loans
        if (currentUser.role_id === 3) {
            query += ' AND p.user_id = ?';
            params.push(currentUser.id);
        }

        const [peminjaman] = await db.promisePool.execute(query, params);

        if (peminjaman.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Peminjaman not found'
            });
        }

        const loan = peminjaman[0];

        // Fetch detail items
        const [details] = await db.promisePool.execute(
            `SELECT pd.*, a.nama_alat, a.kode_alat, a.harga_sewa, k.nama_kategori
             FROM peminjaman_detail pd
             JOIN alat a ON pd.alat_id = a.id
             JOIN kategori k ON a.kategori_id = k.id
             WHERE pd.peminjaman_id = ?`,
            [id]
        );
        loan.items = details;

        res.json({
            success: true,
            data: loan
        });

    } catch (error) {
        console.error('Get peminjaman by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Create peminjaman (Peminjam only) - Supports multiple items
exports.createPeminjaman = async (req, res) => {
    const connection = await db.promisePool.getConnection();

    try {
        const { items, tanggal_pinjam, tanggal_kembali_rencana, keperluan } = req.body;
        const user_id = req.user.id;

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one item is required'
            });
        }

        if (!tanggal_kembali_rencana) {
            return res.status(400).json({
                success: false,
                message: 'Return date is required'
            });
        }

        // Start transaction
        await connection.beginTransaction();

        // Check stock availability for all items first
        for (const item of items) {
            if (!item.alat_id || !item.jumlah || item.jumlah <= 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have alat_id and valid jumlah'
                });
            }

            const [alat] = await connection.execute(
                'SELECT nama_alat, jumlah_tersedia FROM alat WHERE id = ?',
                [item.alat_id]
            );

            if (alat.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: `Alat with ID ${item.alat_id} not found`
                });
            }

            if (alat[0].jumlah_tersedia < item.jumlah) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Stok tidak mencukupi untuk ${alat[0].nama_alat}. Tersedia: ${alat[0].jumlah_tersedia}, Diminta: ${item.jumlah}`
                });
            }
        }

        // Format current date for MySQL if not provided
        const formattedTanggalPinjam = tanggal_pinjam || new Date().toISOString().split('T')[0];

        // Determine if multi-item or single-item
        const isMultiItem = items.length > 1;

        // For backward compatibility: if single item, also set alat_id and jumlah
        const firstItem = items[0];
        const alatId = isMultiItem ? null : firstItem.alat_id;
        const jumlah = isMultiItem ? null : firstItem.jumlah;

        // Create peminjaman record
        const [result] = await connection.execute(
            `INSERT INTO peminjaman (user_id, alat_id, jumlah, tanggal_pinjam, tanggal_kembali_rencana, keperluan, status, is_multi_item)
             VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)`,
            [user_id, alatId, jumlah, formattedTanggalPinjam, tanggal_kembali_rencana, keperluan, isMultiItem]
        );

        const peminjamanId = result.insertId;

        // Insert all items into peminjaman_detail
        for (const item of items) {
            await connection.execute(
                'INSERT INTO peminjaman_detail (peminjaman_id, alat_id, jumlah) VALUES (?, ?, ?)',
                [peminjamanId, item.alat_id, item.jumlah]
            );
        }

        // Commit transaction
        await connection.commit();

        res.status(201).json({
            success: true,
            message: `Permintaan peminjaman ${items.length} item berhasil dibuat`,
            data: {
                id: peminjamanId,
                item_count: items.length
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Create peminjaman error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.sqlMessage || error.message || 'Unknown database error'
        });
    } finally {
        if (connection) connection.release();
    }
};

// Approve peminjaman (Admin/Petugas only)
exports.approvePeminjaman = async (req, res) => {
    try {
        const { id } = req.params;
        const { catatan } = req.body;
        const admin_id = req.user.id;

        // Call stored procedure
        const [result] = await db.promisePool.execute(
            'CALL sp_approve_peminjaman(?, ?, ?, @success, @message)',
            [id, admin_id, catatan || null]
        );

        // Get output parameters
        const [output] = await db.promisePool.execute(
            'SELECT @success as success, @message as message'
        );

        const { success, message } = output[0];

        if (success) {
            res.json({
                success: true,
                message: message || 'Peminjaman approved successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: message || 'Failed to approve peminjaman'
            });
        }

    } catch (error) {
        console.error('Approve peminjaman error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Reject peminjaman (Admin/Petugas only)
exports.rejectPeminjaman = async (req, res) => {
    try {
        const { id } = req.params;
        const { catatan } = req.body;
        const admin_id = req.user.id;

        // Call stored procedure
        const [result] = await db.promisePool.execute(
            'CALL sp_reject_peminjaman(?, ?, ?, @success, @message)',
            [id, admin_id, catatan || null]
        );

        // Get output parameters
        const [output] = await db.promisePool.execute(
            'SELECT @success as success, @message as message'
        );

        const { success, message } = output[0];

        if (success) {
            res.json({
                success: true,
                message: message || 'Peminjaman rejected successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: message || 'Failed to reject peminjaman'
            });
        }

    } catch (error) {
        console.error('Reject peminjaman error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get my loans (Peminjam)
exports.getMyLoans = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [peminjaman] = await db.promisePool.execute(
            `SELECT p.*, 
                   a.nama_alat, a.kode_alat, a.harga_sewa,
                   k.nama_kategori,
                   COALESCE(pg.total_denda, 0) as total_denda_final,
                   -- Real-time late fee calculation for active loans
                   CASE 
                       WHEN p.status IN ('Approved', 'Dipinjam', 'Terlambat') AND p.tanggal_kembali_rencana < CURDATE()
                       THEN fn_get_hari_terlambat(p.tanggal_kembali_rencana, CURDATE())
                       ELSE 0
                   END as hari_terlambat_sekarang,
                   CASE 
                       WHEN p.status IN ('Approved', 'Dipinjam', 'Terlambat') AND p.tanggal_kembali_rencana < CURDATE()
                       THEN fn_calculate_denda(p.tanggal_kembali_rencana, CURDATE())
                       ELSE 0
                   END as denda_terlambat_sekarang,
                   -- Days until due or overdue
                   DATEDIFF(p.tanggal_kembali_rencana, CURDATE()) as hari_tersisa,
                   -- Is currently overdue
                   CASE 
                       WHEN p.status IN ('Approved', 'Dipinjam', 'Terlambat') AND p.tanggal_kembali_rencana < CURDATE()
                       THEN TRUE
                       ELSE FALSE
                   END as is_overdue
            FROM peminjaman p
            LEFT JOIN alat a ON p.alat_id = a.id
            LEFT JOIN kategori k ON a.kategori_id = k.id
            LEFT JOIN pengembalian pg ON p.id = pg.peminjaman_id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC`,
            [user_id]
        );

        // Fetch detail items for each loan
        for (let loan of peminjaman) {
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
            data: peminjaman
        });

    } catch (error) {
        console.error('Get my loans error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update overdue status
exports.updateOverdueStatus = async (req, res) => {
    try {
        await db.promisePool.execute('CALL sp_update_status_terlambat()');

        res.json({
            success: true,
            message: 'Overdue status updated successfully'
        });

    } catch (error) {
        console.error('Update overdue status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Request return (Peminjam only)
exports.requestReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Check if peminjaman exists and belongs to user
        const [peminjaman] = await db.promisePool.execute(
            `SELECT p.*, u.nama as nama_peminjam
             FROM peminjaman p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ? AND p.user_id = ?`,
            [id, user_id]
        );

        if (peminjaman.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Peminjaman not found or does not belong to you'
            });
        }

        const loan = peminjaman[0];

        // Check if loan is in valid status for return request
        if (!['Approved', 'Dipinjam', 'Terlambat'].includes(loan.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot request return for loan with status: ${loan.status}`
            });
        }

        // Check if return already requested
        if (loan.return_requested) {
            return res.status(400).json({
                success: false,
                message: 'Return request already submitted. Please wait for staff verification.'
            });
        }

        // Update return_requested flag
        await db.promisePool.execute(
            'UPDATE peminjaman SET return_requested = TRUE, return_requested_at = NOW() WHERE id = ?',
            [id]
        );

        // Log activity
        await db.promisePool.execute(
            'INSERT INTO log_aktivitas (user_id, aksi, tabel, record_id, detail) VALUES (?, ?, ?, ?, ?)',
            [user_id, 'REQUEST_RETURN', 'peminjaman', id, `${loan.nama_peminjam} mengajukan pengembalian untuk ${loan.kode_peminjaman}`]
        );

        res.json({
            success: true,
            message: 'Return request submitted successfully. Please wait for staff verification.'
        });

    } catch (error) {
        console.error('Request return error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

