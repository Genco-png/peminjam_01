const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanController');
const { verifyToken, isPetugas } = require('../middleware/auth');

// All routes require authentication and Admin/Petugas role
router.use(verifyToken, isPetugas);

router.get('/peminjaman', laporanController.getLaporanPeminjaman);
router.get('/alat-populer', laporanController.getAlatPopuler);
router.get('/denda', laporanController.getLaporanDenda);
router.get('/dashboard-stats', laporanController.getDashboardStats);
router.get('/log-aktivitas', laporanController.getLogAktivitas);

module.exports = router;
