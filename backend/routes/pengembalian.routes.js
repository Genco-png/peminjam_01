const express = require('express');
const router = express.Router();
const pengembalianController = require('../controllers/pengembalianController');
const { verifyToken, isPetugas } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.get('/', pengembalianController.getAllPengembalian);
router.get('/:id', pengembalianController.getPengembalianById);

// Admin/Petugas only
router.post('/', isPetugas, pengembalianController.processPengembalian);
router.post('/calculate-denda', isPetugas, pengembalianController.calculateDenda);

module.exports = router;
