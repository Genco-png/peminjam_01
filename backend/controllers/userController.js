const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.promisePool.execute(
            `SELECT u.id, u.username, u.nama, u.email, u.no_telepon, u.alamat,
                    u.role_id, r.nama_role, u.is_active, u.created_at
             FROM users u
             JOIN roles r ON u.role_id = r.id
             ORDER BY u.created_at DESC`
        );

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await db.promisePool.execute(
            `SELECT u.id, u.username, u.nama, u.email, u.no_telepon, u.alamat,
                    u.role_id, r.nama_role, u.is_active, u.created_at
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.id = ?`,
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Create new user
exports.createUser = async (req, res) => {
    try {
        const { username, password, nama, email, no_telepon, alamat, role_id } = req.body;

        // Validation
        if (!username || !password || !nama || !role_id) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, nama, and role_id are required'
            });
        }

        // Check if username already exists
        const [existing] = await db.promisePool.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.promisePool.execute(
            `INSERT INTO users (username, password, nama, email, no_telepon, alamat, role_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, hashedPassword, nama, email, no_telepon, alamat, role_id]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: result.insertId,
                username,
                nama,
                email,
                role_id
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, nama, email, no_telepon, alamat, role_id, is_active } = req.body;

        // Check if user exists
        const [existing] = await db.promisePool.execute(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Build update query dynamically
        let updateFields = [];
        let updateValues = [];

        if (username) {
            updateFields.push('username = ?');
            updateValues.push(username);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password = ?');
            updateValues.push(hashedPassword);
        }
        if (nama) {
            updateFields.push('nama = ?');
            updateValues.push(nama);
        }
        if (email !== undefined) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (no_telepon !== undefined) {
            updateFields.push('no_telepon = ?');
            updateValues.push(no_telepon);
        }
        if (alamat !== undefined) {
            updateFields.push('alamat = ?');
            updateValues.push(alamat);
        }
        if (role_id) {
            updateFields.push('role_id = ?');
            updateValues.push(role_id);
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateValues.push(id);

        await db.promisePool.execute(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        res.json({
            success: true,
            message: 'User updated successfully'
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const [existing] = await db.promisePool.execute(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has active loans
        const [activeLoans] = await db.promisePool.execute(
            `SELECT COUNT(*) as count FROM peminjaman 
             WHERE user_id = ? AND status IN ('Pending', 'Approved', 'Dipinjam', 'Terlambat')`,
            [id]
        );

        if (activeLoans[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete user with active loans'
            });
        }

        // Delete user
        await db.promisePool.execute('DELETE FROM users WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all roles
exports.getRoles = async (req, res) => {
    try {
        const [roles] = await db.promisePool.execute(
            'SELECT * FROM roles ORDER BY id'
        );

        res.json({
            success: true,
            data: roles
        });

    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
