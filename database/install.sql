-- ============================================
-- Complete Database Export
-- Peminjaman Alat Gunung
-- ============================================

-- This file contains the complete database structure
-- Run this file to create the entire database

-- Create and use database
DROP DATABASE IF EXISTS peminjaman_alat_gunung;
CREATE DATABASE peminjaman_alat_gunung;
USE peminjaman_alat_gunung;

-- Import schema
SOURCE schema.sql;

-- Import functions
SOURCE functions.sql;

-- Import stored procedures
SOURCE stored_procedures.sql;

-- Import triggers
SOURCE triggers.sql;

-- Import seed data
SOURCE seed_data.sql;

-- Verify installation
SELECT 'Database setup complete!' as Status;
SELECT COUNT(*) as 'Total Tables' FROM information_schema.tables WHERE table_schema = 'peminjaman_alat_gunung';
SELECT COUNT(*) as 'Total Users' FROM users;
SELECT COUNT(*) as 'Total Alat' FROM alat;
SELECT COUNT(*) as 'Total Kategori' FROM kategori;
