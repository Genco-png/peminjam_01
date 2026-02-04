const express = require('express');
const router = express.Router();
const peminjamanController = require('../controllers/peminjamanController');
const { verifyToken, isPetugas } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.get('/', peminjamanController.getAllPeminjaman);
router.get('/my-loans', peminjamanController.getMyLoans);
router.get('/:id', peminjamanController.getPeminjamanById);
router.post('/', peminjamanController.createPeminjaman);
router.post('/:id/request-return', peminjamanController.requestReturn);

// Admin/Petugas only
router.put('/:id/approve', isPetugas, peminjamanController.approvePeminjaman);
router.put('/:id/reject', isPetugas, peminjamanController.rejectPeminjaman);
router.post('/update-overdue', isPetugas, peminjamanController.updateOverdueStatus);

module.exports = router;

