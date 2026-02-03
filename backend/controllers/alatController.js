const db = require('../config/database');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');

// Get all alat with filters
exports.getAllAlat = async (req, res) => {
    try {
        const { kategori_id, kondisi, search } = req.query;

        let query = `
            SELECT a.*, k.nama_kategori
            FROM alat a
            JOIN kategori k ON a.kategori_id = k.id
            WHERE 1=1
        `;
        let params = [];

        if (kategori_id) {
            query += ' AND a.kategori_id = ?';
            params.push(kategori_id);
        }

        if (kondisi) {
            query += ' AND a.kondisi = ?';
            params.push(kondisi);
        }

        if (search) {
            query += ' AND (a.nama_alat LIKE ? OR a.kode_alat LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY a.nama_alat';

        const [alat] = await db.promisePool.execute(query, params);

        res.json({
            success: true,
            data: alat
        });

    } catch (error) {
        console.error('Get all alat error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get alat by ID
exports.getAlatById = async (req, res) => {
    try {
        const { id } = req.params;

        const [alat] = await db.promisePool.execute(
            `SELECT a.*, k.nama_kategori
             FROM alat a
             JOIN kategori k ON a.kategori_id = k.id
             WHERE a.id = ?`,
            [id]
        );

        if (alat.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Alat not found'
            });
        }

        res.json({
            success: true,
            data: alat[0]
        });

    } catch (error) {
        console.error('Get alat by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Create new alat
exports.createAlat = async (req, res) => {
    try {
        const { nama_alat, kategori_id, jumlah_total, kondisi, harga_sewa, deskripsi, foto } = req.body;

        // Validation
        if (!nama_alat || !kategori_id || !jumlah_total || !harga_sewa) {
            return res.status(400).json({
                success: false,
                message: 'Nama alat, kategori, jumlah total, and harga sewa are required'
            });
        }

        // Insert alat
        const [result] = await db.promisePool.execute(
            `INSERT INTO alat (nama_alat, kategori_id, jumlah_total, jumlah_tersedia, kondisi, harga_sewa, deskripsi, foto)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nama_alat, kategori_id, jumlah_total, jumlah_total, kondisi || 'Baik', harga_sewa, deskripsi, foto]
        );

        res.status(201).json({
            success: true,
            message: 'Alat created successfully',
            data: {
                id: result.insertId,
                nama_alat,
                kategori_id,
                jumlah_total,
                harga_sewa
            }
        });

    } catch (error) {
        console.error('Create alat error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update alat
exports.updateAlat = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_alat, kategori_id, jumlah_total, jumlah_tersedia, kondisi, harga_sewa, deskripsi, foto } = req.body;

        // Check if alat exists
        const [existing] = await db.promisePool.execute(
            'SELECT * FROM alat WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Alat not found'
            });
        }

        // Build update query
        let updateFields = [];
        let updateValues = [];

        if (nama_alat) {
            updateFields.push('nama_alat = ?');
            updateValues.push(nama_alat);
        }
        if (kategori_id) {
            updateFields.push('kategori_id = ?');
            updateValues.push(kategori_id);
        }
        if (jumlah_total !== undefined) {
            updateFields.push('jumlah_total = ?');
            updateValues.push(jumlah_total);
        }
        if (jumlah_tersedia !== undefined) {
            updateFields.push('jumlah_tersedia = ?');
            updateValues.push(jumlah_tersedia);
        }
        if (kondisi) {
            updateFields.push('kondisi = ?');
            updateValues.push(kondisi);
        }
        if (harga_sewa !== undefined) {
            updateFields.push('harga_sewa = ?');
            updateValues.push(harga_sewa);
        }
        if (deskripsi !== undefined) {
            updateFields.push('deskripsi = ?');
            updateValues.push(deskripsi);
        }
        if (foto !== undefined) {
            updateFields.push('foto = ?');
            updateValues.push(foto);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        await db.promisePool.execute(
            `UPDATE alat SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        res.json({
            success: true,
            message: 'Alat updated successfully'
        });

    } catch (error) {
        console.error('Update alat error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete alat
exports.deleteAlat = async (req, res) => {
    try {
        const { id } = req.params;

        // The trigger will prevent deletion if there are active loans
        await db.promisePool.execute('DELETE FROM alat WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Alat deleted successfully'
        });

    } catch (error) {
        console.error('Delete alat error:', error);

        if (error.sqlMessage && error.sqlMessage.includes('peminjaman aktif')) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete alat with active loans'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Import alat from Excel/CSV
exports.importAlat = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const filePath = req.file.path;
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

        let data = [];

        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            // Parse Excel
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            data = xlsx.utils.sheet_to_json(worksheet);
        } else if (fileExtension === 'csv') {
            // Parse CSV
            data = await new Promise((resolve, reject) => {
                const results = [];
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (row) => results.push(row))
                    .on('end', () => resolve(results))
                    .on('error', (error) => reject(error));
            });
        } else {
            // Clean up file
            fs.unlinkSync(filePath);
            return res.status(400).json({
                success: false,
                message: 'Invalid file format. Only .xlsx, .xls, and .csv are supported'
            });
        }

        // Validate and insert data
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            try {
                // Validate required fields
                if (!row.nama_alat || !row.kategori_id || !row.jumlah_total || !row.harga_sewa) {
                    errors.push(`Row ${i + 1}: Missing required fields`);
                    errorCount++;
                    continue;
                }

                // Insert alat
                await db.promisePool.execute(
                    `INSERT INTO alat (nama_alat, kategori_id, jumlah_total, jumlah_tersedia, kondisi, harga_sewa, deskripsi)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        row.nama_alat,
                        row.kategori_id,
                        row.jumlah_total,
                        row.jumlah_total,
                        row.kondisi || 'Baik',
                        row.harga_sewa,
                        row.deskripsi || null
                    ]
                );

                successCount++;
            } catch (error) {
                errors.push(`Row ${i + 1}: ${error.message}`);
                errorCount++;
            }
        }

        // Clean up file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: `Import completed. ${successCount} records imported, ${errorCount} errors`,
            data: {
                successCount,
                errorCount,
                errors: errors.slice(0, 10) // Return first 10 errors
            }
        });

    } catch (error) {
        console.error('Import alat error:', error);

        // Clean up file if exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
