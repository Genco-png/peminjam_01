-- ============================================
-- Database Triggers
-- ============================================

USE peminjaman_alat_gunung;

DELIMITER //

-- ============================================
-- Trigger: After INSERT peminjaman
-- Log new loan request
-- ============================================
DROP TRIGGER IF EXISTS trg_after_peminjaman_insert//
CREATE TRIGGER trg_after_peminjaman_insert
AFTER INSERT ON peminjaman
FOR EACH ROW
BEGIN
    INSERT INTO log_aktivitas (user_id, aksi, tabel, record_id, detail)
    VALUES (
        NEW.user_id,
        'CREATE',
        'peminjaman',
        NEW.id,
        CONCAT('Pengajuan peminjaman baru: ', NEW.kode_peminjaman)
    );
END//

-- ============================================
-- Trigger: After UPDATE peminjaman
-- Log loan status changes
-- ============================================
DROP TRIGGER IF EXISTS trg_after_peminjaman_update//
CREATE TRIGGER trg_after_peminjaman_update
AFTER UPDATE ON peminjaman
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO log_aktivitas (user_id, aksi, tabel, record_id, detail)
        VALUES (
            NEW.approved_by,
            'UPDATE',
            'peminjaman',
            NEW.id,
            CONCAT('Status peminjaman berubah dari ', OLD.status, ' menjadi ', NEW.status)
        );
    END IF;
END//

-- ============================================
-- Trigger: After INSERT pengembalian
-- Log equipment return
-- ============================================
DROP TRIGGER IF EXISTS trg_after_pengembalian_insert//
CREATE TRIGGER trg_after_pengembalian_insert
AFTER INSERT ON pengembalian
FOR EACH ROW
BEGIN
    DECLARE v_user_id INT;
    
    SELECT user_id INTO v_user_id
    FROM peminjaman
    WHERE id = NEW.peminjaman_id;
    
    INSERT INTO log_aktivitas (user_id, aksi, tabel, record_id, detail)
    VALUES (
        v_user_id,
        'CREATE',
        'pengembalian',
        NEW.id,
        CONCAT('Pengembalian alat - Denda: Rp ', NEW.total_denda)
    );
END//

-- ============================================
-- Trigger: Before INSERT alat
-- Generate kode_alat if not provided
-- ============================================
DROP TRIGGER IF EXISTS trg_before_alat_insert//
CREATE TRIGGER trg_before_alat_insert
BEFORE INSERT ON alat
FOR EACH ROW
BEGIN
    DECLARE v_counter INT;
    
    IF NEW.kode_alat IS NULL OR NEW.kode_alat = '' THEN
        SELECT COUNT(*) + 1 INTO v_counter FROM alat;
        SET NEW.kode_alat = CONCAT('ALT-', LPAD(v_counter, 5, '0'));
    END IF;
    
    -- Ensure jumlah_tersedia doesn't exceed jumlah_total
    IF NEW.jumlah_tersedia > NEW.jumlah_total THEN
        SET NEW.jumlah_tersedia = NEW.jumlah_total;
    END IF;
END//

-- ============================================
-- Trigger: After INSERT alat
-- Log new equipment
-- ============================================
DROP TRIGGER IF EXISTS trg_after_alat_insert//
CREATE TRIGGER trg_after_alat_insert
AFTER INSERT ON alat
FOR EACH ROW
BEGIN
    INSERT INTO log_aktivitas (user_id, aksi, tabel, record_id, detail)
    VALUES (
        NULL,
        'CREATE',
        'alat',
        NEW.id,
        CONCAT('Alat baru ditambahkan: ', NEW.nama_alat, ' (', NEW.kode_alat, ')')
    );
END//

-- ============================================
-- Trigger: After UPDATE alat
-- Log equipment updates
-- ============================================
DROP TRIGGER IF EXISTS trg_after_alat_update//
CREATE TRIGGER trg_after_alat_update
AFTER UPDATE ON alat
FOR EACH ROW
BEGIN
    IF OLD.jumlah_tersedia != NEW.jumlah_tersedia THEN
        INSERT INTO log_aktivitas (user_id, aksi, tabel, record_id, detail)
        VALUES (
            NULL,
            'UPDATE',
            'alat',
            NEW.id,
            CONCAT('Stok ', NEW.nama_alat, ' berubah dari ', OLD.jumlah_tersedia, ' menjadi ', NEW.jumlah_tersedia)
        );
    END IF;
END//

-- ============================================
-- Trigger: Before DELETE alat
-- Prevent deletion if there are active loans
-- ============================================
DROP TRIGGER IF EXISTS trg_before_alat_delete//
CREATE TRIGGER trg_before_alat_delete
BEFORE DELETE ON alat
FOR EACH ROW
BEGIN
    DECLARE v_active_loans INT;
    
    SELECT COUNT(*) INTO v_active_loans
    FROM peminjaman
    WHERE alat_id = OLD.id
    AND status IN ('Pending', 'Approved', 'Dipinjam', 'Terlambat');
    
    IF v_active_loans > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tidak dapat menghapus alat yang memiliki peminjaman aktif';
    END IF;
END//

-- ============================================
-- Trigger: Before INSERT peminjaman
-- Generate kode_peminjaman and validate
-- ============================================
DROP TRIGGER IF EXISTS trg_before_peminjaman_insert//
CREATE TRIGGER trg_before_peminjaman_insert
BEFORE INSERT ON peminjaman
FOR EACH ROW
BEGIN
    -- Generate kode_peminjaman
    IF NEW.kode_peminjaman IS NULL OR NEW.kode_peminjaman = '' THEN
        SET NEW.kode_peminjaman = fn_generate_kode_peminjaman();
    END IF;
    
    -- Set tanggal_pinjam to today if not set
    IF NEW.tanggal_pinjam IS NULL THEN
        SET NEW.tanggal_pinjam = CURDATE();
    END IF;
END//

-- ============================================
-- Trigger: After INSERT user
-- Log new user creation
-- ============================================
DROP TRIGGER IF EXISTS trg_after_user_insert//
CREATE TRIGGER trg_after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO log_aktivitas (user_id, aksi, tabel, record_id, detail)
    VALUES (
        NEW.id,
        'CREATE',
        'users',
        NEW.id,
        CONCAT('User baru dibuat: ', NEW.username, ' (', NEW.nama, ')')
    );
END//

-- ============================================
-- Trigger: After DELETE user
-- Log user deletion
-- ============================================
DROP TRIGGER IF EXISTS trg_after_user_delete//
CREATE TRIGGER trg_after_user_delete
AFTER DELETE ON users
FOR EACH ROW
BEGIN
    INSERT INTO log_aktivitas (user_id, aksi, tabel, record_id, detail)
    VALUES (
        NULL,
        'DELETE',
        'users',
        OLD.id,
        CONCAT('User dihapus: ', OLD.username, ' (', OLD.nama, ')')
    );
END//

DELIMITER ;
