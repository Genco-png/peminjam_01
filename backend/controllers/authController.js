const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

// Login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find user
        const [users] = await db.promisePool.execute(
            `SELECT u.*, r.nama_role 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.username = ? AND u.is_active = TRUE`,
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const user = users[0];

        console.log('🔍 Login attempt for user:', username);
        console.log('📝 Password hash from DB:', user.password.substring(0, 30) + '...');
        console.log('🔐 Password provided:', password);

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('✅ Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('❌ Password verification failed for user:', username);
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role_id: user.role_id,
                nama_role: user.nama_role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Log login activity
        await db.promisePool.execute(
            'INSERT INTO log_aktivitas (user_id, aksi, tabel, detail) VALUES (?, ?, ?, ?)',
            [user.id, 'LOGIN', 'users', `User ${username} logged in`]
        );

        // Return user data and token
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    nama: user.nama,
                    email: user.email,
                    role_id: user.role_id,
                    nama_role: user.nama_role
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Register new Peminjam (Public)
exports.register = async (req, res) => {
    try {
        const { username, password, nama, email, no_telepon, alamat } = req.body;

        // Validation
        if (!username || !password || !nama) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, dan nama wajib diisi'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password minimal 6 karakter'
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
                message: 'Username sudah digunakan'
            });
        }

        // Check if email already exists (if provided)
        if (email) {
            const [existingEmail] = await db.promisePool.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingEmail.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email sudah digunakan'
                });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user with role_id=3 (Peminjam) and is_active=false
        const [result] = await db.promisePool.execute(
            `INSERT INTO users (username, password, nama, email, no_telepon, alamat, role_id, is_active)
             VALUES (?, ?, ?, ?, ?, ?, 3, FALSE)`,
            [username, hashedPassword, nama, email || null, no_telepon || null, alamat || null]
        );

        res.status(201).json({
            success: true,
            message: 'Pendaftaran berhasil! Silakan tunggu persetujuan dari Admin.',
            data: {
                id: result.insertId,
                username,
                nama
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await db.promisePool.execute(
            `SELECT u.id, u.username, u.nama, u.email, u.no_telepon, u.alamat, 
                    u.role_id, r.nama_role, u.created_at
             FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.id = ?`,
            [userId]
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
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Logout (client-side token removal, but log the activity)
exports.logout = async (req, res) => {
    try {
        const userId = req.user.id;

        // Log logout activity
        await db.promisePool.execute(
            'INSERT INTO log_aktivitas (user_id, aksi, tabel, detail) VALUES (?, ?, ?, ?)',
            [userId, 'LOGOUT', 'users', `User logged out`]
        );

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
