-- ============================================
-- CLEAN RESET DATABASE
-- WARNING: This will DELETE ALL DATA!
-- ============================================

DROP DATABASE IF EXISTS peminjaman_alat_gunung;
CREATE DATABASE peminjaman_alat_gunung;

SELECT 'Database reset successfully! Run init-database.js to setup.' as message;
