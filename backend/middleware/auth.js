const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Check if user is Admin
const isAdmin = (req, res, next) => {
    if (req.user.role_id !== 1) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
    next();
};

// Check if user is Petugas or Admin
const isPetugas = (req, res, next) => {
    if (req.user.role_id !== 1 && req.user.role_id !== 2) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Petugas or Admin only.'
        });
    }
    next();
};

// Check if user is Peminjam
const isPeminjam = (req, res, next) => {
    if (req.user.role_id !== 3) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Peminjam only.'
        });
    }
    next();
};

// Check if user is authenticated (any role)
const isAuthenticated = verifyToken;

module.exports = {
    verifyToken,
    isAdmin,
    isPetugas,
    isPeminjam,
    isAuthenticated
};
