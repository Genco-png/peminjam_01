-- ============================================
-- Stored Procedures
-- ============================================

USE peminjaman_alat_gunung;

DELIMITER //

-- ============================================
-- Procedure: sp_approve_peminjaman
-- Approve loan request and update stock
-- ============================================
DROP PROCEDURE IF EXISTS sp_approve_peminjaman//
CREATE PROCEDURE sp_approve_peminjaman(
    IN p_peminjaman_id INT,
    IN p_admin_id INT,
    IN p_catatan TEXT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_alat_id INT;
    DECLARE v_jumlah INT;
    DECLARE v_jumlah_tersedia INT;
    DECLARE v_status VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Error: Transaksi gagal';
    END;
    
    START TRANSACTION;
    
    -- Get peminjaman details
    SELECT alat_id, jumlah, status INTO v_alat_id, v_jumlah, v_status
    FROM peminjaman
    WHERE id = p_peminjaman_id;
    
    -- Check if peminjaman exists
    IF v_alat_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Peminjaman tidak ditemukan';
        ROLLBACK;
    -- Check if already approved
    ELSEIF v_status != 'Pending' THEN
        SET p_success = FALSE;
        SET p_message = 'Peminjaman sudah diproses';
        ROLLBACK;
    ELSE
        -- Check stock availability
        SELECT jumlah_tersedia INTO v_jumlah_tersedia
        FROM alat
        WHERE id = v_alat_id;
        
        IF v_jumlah_tersedia < v_jumlah THEN
            SET p_success = FALSE;
            SET p_message = 'Stok tidak mencukupi';
            ROLLBACK;
        ELSE
            -- Update peminjaman status
            UPDATE peminjaman
            SET status = 'Approved',
                approved_by = p_admin_id,
                approved_at = NOW(),
                catatan_approval = p_catatan
            WHERE id = p_peminjaman_id;
            
            -- Update stock
            UPDATE alat
            SET jumlah_tersedia = jumlah_tersedia - v_jumlah
            WHERE id = v_alat_id;
            
            SET p_success = TRUE;
            SET p_message = 'Peminjaman berhasil disetujui';
            COMMIT;
        END IF;
    END IF;
END//

-- ============================================
-- Procedure: sp_reject_peminjaman
-- Reject loan request
-- ============================================
DROP PROCEDURE IF EXISTS sp_reject_peminjaman//
CREATE PROCEDURE sp_reject_peminjaman(
    IN p_peminjaman_id INT,
    IN p_admin_id INT,
    IN p_catatan TEXT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_status VARCHAR(20);
    
    SELECT status INTO v_status
    FROM peminjaman
    WHERE id = p_peminjaman_id;
    
    IF v_status IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Peminjaman tidak ditemukan';
    ELSEIF v_status != 'Pending' THEN
        SET p_success = FALSE;
        SET p_message = 'Peminjaman sudah diproses';
    ELSE
        UPDATE peminjaman
        SET status = 'Rejected',
            approved_by = p_admin_id,
            approved_at = NOW(),
            catatan_approval = p_catatan
        WHERE id = p_peminjaman_id;
        
        SET p_success = TRUE;
        SET p_message = 'Peminjaman ditolak';
    END IF;
END//

-- ============================================
-- Procedure: sp_process_pengembalian
-- Process equipment return with penalty calculation
-- ============================================
DROP PROCEDURE IF EXISTS sp_process_pengembalian//
CREATE PROCEDURE sp_process_pengembalian(
    IN p_peminjaman_id INT,
    IN p_tanggal_kembali DATE,
    IN p_kondisi VARCHAR(20),
    IN p_jumlah_kembali INT,
    IN p_keterangan TEXT,
    IN p_processed_by INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255),
    OUT p_total_denda DECIMAL(10,2)
)
BEGIN
    DECLARE v_alat_id INT;
    DECLARE v_jumlah INT;
    DECLARE v_tanggal_kembali_rencana DATE;
    DECLARE v_harga_sewa DECIMAL(10,2);
    DECLARE v_hari_terlambat INT;
    DECLARE v_denda_terlambat DECIMAL(10,2);
    DECLARE v_denda_kerusakan DECIMAL(10,2);
    DECLARE v_status VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Error: Transaksi gagal';
        SET p_total_denda = 0;
    END;
    
    START TRANSACTION;
    
    -- Get peminjaman details
    SELECT p.alat_id, p.jumlah, p.tanggal_kembali_rencana, p.status, a.harga_sewa
    INTO v_alat_id, v_jumlah, v_tanggal_kembali_rencana, v_status, v_harga_sewa
    FROM peminjaman p
    JOIN alat a ON p.alat_id = a.id
    WHERE p.id = p_peminjaman_id;
    
    -- Validate
    IF v_alat_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Peminjaman tidak ditemukan';
        SET p_total_denda = 0;
        ROLLBACK;
    ELSEIF v_status NOT IN ('Approved', 'Dipinjam', 'Terlambat') THEN
        SET p_success = FALSE;
        SET p_message = 'Peminjaman tidak dapat dikembalikan';
        SET p_total_denda = 0;
        ROLLBACK;
    ELSE
        -- Calculate penalties
        SET v_hari_terlambat = fn_get_hari_terlambat(v_tanggal_kembali_rencana, p_tanggal_kembali);
        SET v_denda_terlambat = fn_calculate_denda(v_tanggal_kembali_rencana, p_tanggal_kembali);
        SET v_denda_kerusakan = fn_calculate_denda_kerusakan(p_kondisi, v_harga_sewa);
        SET p_total_denda = v_denda_terlambat + v_denda_kerusakan;
        
        -- Insert pengembalian record
        INSERT INTO pengembalian (
            peminjaman_id, tanggal_kembali_aktual, kondisi_alat,
            jumlah_kembali, hari_terlambat, denda, denda_kerusakan,
            total_denda, keterangan, processed_by
        ) VALUES (
            p_peminjaman_id, p_tanggal_kembali, p_kondisi,
            p_jumlah_kembali, v_hari_terlambat, v_denda_terlambat,
            v_denda_kerusakan, p_total_denda, p_keterangan, p_processed_by
        );
        
        -- Update peminjaman status
        UPDATE peminjaman
        SET status = 'Selesai',
            tanggal_kembali_aktual = p_tanggal_kembali
        WHERE id = p_peminjaman_id;
        
        -- Restore stock
        UPDATE alat
        SET jumlah_tersedia = jumlah_tersedia + p_jumlah_kembali
        WHERE id = v_alat_id;
        
        SET p_success = TRUE;
        SET p_message = 'Pengembalian berhasil diproses';
        COMMIT;
    END IF;
END//

-- ============================================
-- Procedure: sp_get_laporan_peminjaman
-- Generate loan report for date range
-- ============================================
DROP PROCEDURE IF EXISTS sp_get_laporan_peminjaman//
CREATE PROCEDURE sp_get_laporan_peminjaman(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        p.id,
        p.kode_peminjaman,
        u.nama AS nama_peminjam,
        a.nama_alat,
        k.nama_kategori,
        p.jumlah,
        p.tanggal_pinjam,
        p.tanggal_kembali_rencana,
        p.tanggal_kembali_aktual,
        p.status,
        COALESCE(pg.total_denda, 0) AS total_denda,
        admin.nama AS approved_by_nama
    FROM peminjaman p
    JOIN users u ON p.user_id = u.id
    JOIN alat a ON p.alat_id = a.id
    JOIN kategori k ON a.kategori_id = k.id
    LEFT JOIN users admin ON p.approved_by = admin.id
    LEFT JOIN pengembalian pg ON p.id = pg.peminjaman_id
    WHERE p.tanggal_pinjam BETWEEN p_start_date AND p_end_date
    ORDER BY p.tanggal_pinjam DESC;
END//

-- ============================================
-- Procedure: sp_get_alat_populer
-- Get most borrowed equipment
-- ============================================
DROP PROCEDURE IF EXISTS sp_get_alat_populer//
CREATE PROCEDURE sp_get_alat_populer(
    IN p_limit INT
)
BEGIN
    SELECT 
        a.id,
        a.nama_alat,
        k.nama_kategori,
        COUNT(p.id) AS total_peminjaman,
        SUM(p.jumlah) AS total_unit_dipinjam,
        a.jumlah_total,
        a.jumlah_tersedia
    FROM alat a
    JOIN kategori k ON a.kategori_id = k.id
    LEFT JOIN peminjaman p ON a.id = p.alat_id
    WHERE p.status IN ('Approved', 'Dipinjam', 'Selesai')
    GROUP BY a.id, a.nama_alat, k.nama_kategori, a.jumlah_total, a.jumlah_tersedia
    ORDER BY total_peminjaman DESC
    LIMIT p_limit;
END//

-- ============================================
-- Procedure: sp_update_status_terlambat
-- Update status for overdue loans
-- ============================================
DROP PROCEDURE IF EXISTS sp_update_status_terlambat//
CREATE PROCEDURE sp_update_status_terlambat()
BEGIN
    UPDATE peminjaman
    SET status = 'Terlambat'
    WHERE status IN ('Approved', 'Dipinjam')
    AND tanggal_kembali_rencana < CURDATE();
END//

DELIMITER ;
