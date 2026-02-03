const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const alatController = require('../controllers/alatController');
const { verifyToken, isPetugas } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls', '.csv'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only .xlsx, .xls, and .csv files are allowed'));
        }
    }
});

// Public routes (can view alat)
router.get('/', verifyToken, alatController.getAllAlat);
router.get('/:id', verifyToken, alatController.getAlatById);

// Protected routes (Admin/Petugas only)
router.post('/', verifyToken, isPetugas, alatController.createAlat);
router.put('/:id', verifyToken, isPetugas, alatController.updateAlat);
router.delete('/:id', verifyToken, isPetugas, alatController.deleteAlat);
router.post('/import', verifyToken, isPetugas, upload.single('file'), alatController.importAlat);

module.exports = router;
