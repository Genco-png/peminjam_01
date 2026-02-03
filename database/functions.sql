-- ============================================
-- Database Functions
-- ============================================

USE peminjaman_alat_gunung;

DELIMITER //

-- ============================================
-- Function: fn_calculate_denda
-- Calculate late return penalty (Rp 5,000 per day)
-- ============================================
DROP FUNCTION IF EXISTS fn_calculate_denda//
CREATE FUNCTION fn_calculate_denda(
    p_tanggal_kembali_rencana DATE,
    p_tanggal_kembali_aktual DATE
) RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_hari_terlambat INT;
    DECLARE v_denda DECIMAL(10,2);
    DECLARE v_denda_per_hari DECIMAL(10,2) DEFAULT 5000.00;
    
    -- Calculate days late
    SET v_hari_terlambat = DATEDIFF(p_tanggal_kembali_aktual, p_tanggal_kembali_rencana);
    
    -- If not late, return 0
    IF v_hari_terlambat <= 0 THEN
        SET v_denda = 0;
    ELSE
        SET v_denda = v_hari_terlambat * v_denda_per_hari;
    END IF;
    
    RETURN v_denda;
END//

-- ============================================
-- Function: fn_get_hari_terlambat
-- Get number of days late
-- ============================================
DROP FUNCTION IF EXISTS fn_get_hari_terlambat//
CREATE FUNCTION fn_get_hari_terlambat(
    p_tanggal_kembali_rencana DATE,
    p_tanggal_kembali_aktual DATE
) RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_hari_terlambat INT;
    
    SET v_hari_terlambat = DATEDIFF(p_tanggal_kembali_aktual, p_tanggal_kembali_rencana);
    
    IF v_hari_terlambat < 0 THEN
        SET v_hari_terlambat = 0;
    END IF;
    
    RETURN v_hari_terlambat;
END//

-- ============================================
-- Function: fn_check_alat_availability
-- Check if equipment is available in requested quantity
-- ============================================
DROP FUNCTION IF EXISTS fn_check_alat_availability//
CREATE FUNCTION fn_check_alat_availability(
    p_alat_id INT,
    p_jumlah INT
) RETURNS BOOLEAN
READS SQL DATA
BEGIN
    DECLARE v_jumlah_tersedia INT;
    
    SELECT jumlah_tersedia INTO v_jumlah_tersedia
    FROM alat
    WHERE id = p_alat_id;
    
    IF v_jumlah_tersedia IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF v_jumlah_tersedia >= p_jumlah THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END//

-- ============================================
-- Function: fn_get_user_active_loans
-- Get count of active loans for a user
-- ============================================
DROP FUNCTION IF EXISTS fn_get_user_active_loans//
CREATE FUNCTION fn_get_user_active_loans(
    p_user_id INT
) RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    
    SELECT COUNT(*) INTO v_count
    FROM peminjaman
    WHERE user_id = p_user_id
    AND status IN ('Approved', 'Dipinjam');
    
    RETURN v_count;
END//

-- ============================================
-- Function: fn_generate_kode_peminjaman
-- Generate unique loan code (format: PJM-YYYYMMDD-XXXX)
-- ============================================
DROP FUNCTION IF EXISTS fn_generate_kode_peminjaman//
CREATE FUNCTION fn_generate_kode_peminjaman() RETURNS VARCHAR(50)
READS SQL DATA
BEGIN
    DECLARE v_kode VARCHAR(50);
    DECLARE v_tanggal VARCHAR(8);
    DECLARE v_counter INT;
    
    SET v_tanggal = DATE_FORMAT(NOW(), '%Y%m%d');
    
    -- Get today's counter
    SELECT COUNT(*) + 1 INTO v_counter
    FROM peminjaman
    WHERE DATE(created_at) = CURDATE();
    
    SET v_kode = CONCAT('PJM-', v_tanggal, '-', LPAD(v_counter, 4, '0'));
    
    RETURN v_kode;
END//

-- ============================================
-- Function: fn_calculate_denda_kerusakan
-- Calculate damage penalty based on condition
-- ============================================
DROP FUNCTION IF EXISTS fn_calculate_denda_kerusakan//
CREATE FUNCTION fn_calculate_denda_kerusakan(
    p_kondisi VARCHAR(20),
    p_harga_sewa DECIMAL(10,2)
) RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_denda DECIMAL(10,2);
    
    CASE p_kondisi
        WHEN 'Baik' THEN
            SET v_denda = 0;
        WHEN 'Rusak Ringan' THEN
            SET v_denda = p_harga_sewa * 2; -- 2x harga sewa
        WHEN 'Rusak Berat' THEN
            SET v_denda = p_harga_sewa * 5; -- 5x harga sewa
        WHEN 'Hilang' THEN
            SET v_denda = p_harga_sewa * 10; -- 10x harga sewa
        ELSE
            SET v_denda = 0;
    END CASE;
    
    RETURN v_denda;
END//

DELIMITER ;
