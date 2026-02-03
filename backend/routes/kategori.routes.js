const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategoriController');
const { verifyToken, isPetugas } = require('../middleware/auth');

// Public routes (can view kategori)
router.get('/', verifyToken, kategoriController.getAllKategori);
router.get('/:id', verifyToken, kategoriController.getKategoriById);

// Protected routes (Admin/Petugas only)
router.post('/', verifyToken, isPetugas, kategoriController.createKategori);
router.put('/:id', verifyToken, isPetugas, kategoriController.updateKategori);
router.delete('/:id', verifyToken, isPetugas, kategoriController.deleteKategori);

module.exports = router;
