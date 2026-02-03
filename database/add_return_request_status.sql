-- ============================================
-- Add return request status to pengembalian table
-- ============================================

USE peminjaman_alat_gunung;

-- Add status column to track return request workflow
ALTER TABLE pengembalian 
ADD COLUMN status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending' AFTER peminjaman_id,
ADD COLUMN requested_at TIMESTAMP NULL AFTER processed_by,
ADD COLUMN approved_at TIMESTAMP NULL AFTER requested_at;

-- Add index for status
ALTER TABLE pengembalian ADD INDEX idx_status (status);
