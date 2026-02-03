-- Quick fix: Install missing database function
-- Run this in your MySQL client (phpMyAdmin, MySQL Workbench, etc.)

USE peminjaman_alat_gunung;

DELIMITER //

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

DELIMITER ;

-- Test the function
SELECT fn_generate_kode_peminjaman() AS test_kode;
