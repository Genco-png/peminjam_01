const db = require('../config/database');

// Get all kategori
exports.getAllKategori = async (req, res) => {
    try {
        const [kategori] = await db.promisePool.execute(
            'SELECT * FROM kategori ORDER BY nama_kategori'
        );

        res.json({
            success: true,
            data: kategori
        });

    } catch (error) {
        console.error('Get all kategori error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get kategori by ID
exports.getKategoriById = async (req, res) => {
    try {
        const { id } = req.params;

        const [kategori] = await db.promisePool.execute(
            'SELECT * FROM kategori WHERE id = ?',
            [id]
        );

        if (kategori.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kategori not found'
            });
        }

        res.json({
            success: true,
            data: kategori[0]
        });

    } catch (error) {
        console.error('Get kategori by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Create new kategori
exports.createKategori = async (req, res) => {
    try {
        const { nama_kategori, deskripsi } = req.body;

        if (!nama_kategori) {
            return res.status(400).json({
                success: false,
                message: 'Nama kategori is required'
            });
        }

        const [result] = await db.promisePool.execute(
            'INSERT INTO kategori (nama_kategori, deskripsi) VALUES (?, ?)',
            [nama_kategori, deskripsi]
        );

        res.status(201).json({
            success: true,
            message: 'Kategori created successfully',
            data: {
                id: result.insertId,
                nama_kategori,
                deskripsi
            }
        });

    } catch (error) {
        console.error('Create kategori error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Kategori already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update kategori
exports.updateKategori = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_kategori, deskripsi } = req.body;

        const [existing] = await db.promisePool.execute(
            'SELECT id FROM kategori WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kategori not found'
            });
        }

        let updateFields = [];
        let updateValues = [];

        if (nama_kategori) {
            updateFields.push('nama_kategori = ?');
            updateValues.push(nama_kategori);
        }
        if (deskripsi !== undefined) {
            updateFields.push('deskripsi = ?');
            updateValues.push(deskripsi);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        await db.promisePool.execute(
            `UPDATE kategori SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        res.json({
            success: true,
            message: 'Kategori updated successfully'
        });

    } catch (error) {
        console.error('Update kategori error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete kategori
exports.deleteKategori = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if kategori has alat
        const [alat] = await db.promisePool.execute(
            'SELECT COUNT(*) as count FROM alat WHERE kategori_id = ?',
            [id]
        );

        if (alat[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete kategori that has equipment'
            });
        }

        await db.promisePool.execute('DELETE FROM kategori WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Kategori deleted successfully'
        });

    } catch (error) {
        console.error('Delete kategori error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
