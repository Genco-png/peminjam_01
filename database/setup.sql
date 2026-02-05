-- ========================================================
-- DATABASE SETUP: Peminjaman Alat Gunung
-- Unified Schema, Functions, Procedures, Triggers & Seed
-- ========================================================

DROP DATABASE IF EXISTS peminjaman_alat_gunung;
CREATE DATABASE peminjaman_alat_gunung;
USE peminjaman_alat_gunung;

-- ============================================
-- 1. TABLES
-- ============================================

CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_role VARCHAR(50) NOT NULL UNIQUE,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    no_telepon VARCHAR(20),
    alamat TEXT,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role_id)
) ENGINE=InnoDB;

CREATE TABLE kategori (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_kategori VARCHAR(100) NOT NULL UNIQUE,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nama_kategori (nama_kategori)
) ENGINE=InnoDB;

CREATE TABLE alat (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kode_alat VARCHAR(50) UNIQUE,
    nama_alat VARCHAR(100) NOT NULL,
    kategori_id INT NOT NULL,
    jumlah_total INT NOT NULL DEFAULT 0,
    jumlah_tersedia INT NOT NULL DEFAULT 0,
    kondisi ENUM('Baik', 'Rusak Ringan', 'Rusak Berat') DEFAULT 'Baik',
    harga_sewa DECIMAL(10,2) NOT NULL DEFAULT 0,
    deskripsi TEXT,
    foto VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE RESTRICT,
    INDEX idx_nama_alat (nama_alat),
    INDEX idx_kategori (kategori_id),
    INDEX idx_tersedia (jumlah_tersedia),
    CHECK (jumlah_tersedia >= 0),
    CHECK (jumlah_tersedia <= jumlah_total),
    CHECK (harga_sewa >= 0)
) ENGINE=InnoDB;

CREATE TABLE peminjaman (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kode_peminjaman VARCHAR(50) UNIQUE,
    user_id INT NOT NULL,
    alat_id INT NULL, -- Nullable for multi-item loans
    jumlah INT NULL DEFAULT 1,
    is_multi_item BOOLEAN DEFAULT FALSE,
    tanggal_pinjam DATE NOT NULL,
    tanggal_kembali_rencana DATE NOT NULL,
    tanggal_kembali_aktual DATE,
    status ENUM('Pending', 'Approved', 'Rejected', 'Dipinjam', 'Selesai', 'Terlambat') DEFAULT 'Pending',
    return_requested BOOLEAN DEFAULT FALSE,
    return_requested_at TIMESTAMP NULL,
    keperluan TEXT,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    catatan_approval TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (alat_id) REFERENCES alat(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_return_requested (return_requested),
    INDEX idx_kode (kode_peminjaman),
    CHECK (jumlah > 0),
    CHECK (tanggal_kembali_rencana >= tanggal_pinjam)
) ENGINE=InnoDB;

CREATE TABLE peminjaman_detail (
    id INT PRIMARY KEY AUTO_INCREMENT,
    peminjaman_id INT NOT NULL,
    alat_id INT NOT NULL,
    jumlah INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (peminjaman_id) REFERENCES peminjaman(id) ON DELETE CASCADE,
    FOREIGN KEY (alat_id) REFERENCES alat(id) ON DELETE RESTRICT,
    INDEX idx_peminjaman (peminjaman_id),
    INDEX idx_alat (alat_id),
    CHECK (jumlah > 0)
) ENGINE=InnoDB;

CREATE TABLE pengembalian (
    id INT PRIMARY KEY AUTO_INCREMENT,
    peminjaman_id INT NOT NULL UNIQUE,
    tanggal_kembali_aktual DATE NOT NULL,
    kondisi_alat ENUM('Baik', 'Rusak Ringan', 'Rusak Berat', 'Hilang') DEFAULT 'Baik',
    jumlah_kembali INT NOT NULL,
    hari_terlambat INT DEFAULT 0,
    denda DECIMAL(10,2) DEFAULT 0,
    denda_kerusakan DECIMAL(10,2) DEFAULT 0,
    total_denda DECIMAL(10,2) DEFAULT 0,
    keterangan TEXT,
    processed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (peminjaman_id) REFERENCES peminjaman(id) ON DELETE RESTRICT,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_peminjaman (peminjaman_id),
    CHECK (jumlah_kembali > 0)
) ENGINE=InnoDB;

CREATE TABLE log_aktivitas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    aksi VARCHAR(100) NOT NULL,
    tabel VARCHAR(50),
    record_id INT,
    detail TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB;

CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    deskripsi TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 2. FUNCTIONS
-- ============================================

DELIMITER //

CREATE FUNCTION fn_calculate_denda(
    p_tanggal_kembali_rencana DATE,
    p_tanggal_kembali_aktual DATE
) RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_hari_terlambat INT;
    DECLARE v_denda DECIMAL(10,2);
    DECLARE v_denda_per_hari DECIMAL(10,2) DEFAULT 5000.00;
    SET v_hari_terlambat = DATEDIFF(p_tanggal_kembali_aktual, p_tanggal_kembali_rencana);
    IF v_hari_terlambat <= 0 THEN SET v_denda = 0;
    ELSE SET v_denda = v_hari_terlambat * v_denda_per_hari; END IF;
    RETURN v_denda;
END//

CREATE FUNCTION fn_get_hari_terlambat(
    p_tanggal_kembali_rencana DATE,
    p_tanggal_kembali_aktual DATE
) RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_hari_terlambat INT;
    SET v_hari_terlambat = DATEDIFF(p_tanggal_kembali_aktual, p_tanggal_kembali_rencana);
    IF v_hari_terlambat < 0 THEN SET v_hari_terlambat = 0; END IF;
    RETURN v_hari_terlambat;
END//

CREATE FUNCTION fn_generate_kode_peminjaman() RETURNS VARCHAR(50)
READS SQL DATA
BEGIN
    DECLARE v_kode VARCHAR(50);
    DECLARE v_tanggal VARCHAR(8);
    DECLARE v_counter INT;
    SET v_tanggal = DATE_FORMAT(NOW(), '%Y%m%d');
    SELECT COUNT(*) + 1 INTO v_counter FROM peminjaman WHERE DATE(created_at) = CURDATE();
    SET v_kode = CONCAT('PJM-', v_tanggal, '-', LPAD(v_counter, 4, '0'));
    RETURN v_kode;
END//

CREATE FUNCTION fn_calculate_denda_kerusakan(
    p_kondisi VARCHAR(20),
    p_harga_sewa DECIMAL(10,2)
) RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_denda DECIMAL(10,2);
    CASE p_kondisi
        WHEN 'Baik' THEN SET v_denda = 0;
        WHEN 'Rusak Ringan' THEN SET v_denda = p_harga_sewa * 2;
        WHEN 'Rusak Berat' THEN SET v_denda = p_harga_sewa * 5;
        WHEN 'Hilang' THEN SET v_denda = p_harga_sewa * 10;
        ELSE SET v_denda = 0;
    END CASE;
    RETURN v_denda;
END//

CREATE FUNCTION fn_generate_kode_alat() RETURNS VARCHAR(50)
READS SQL DATA
BEGIN
    DECLARE v_kode VARCHAR(50);
    DECLARE v_counter INT;
    SELECT COUNT(*) + 1 INTO v_counter FROM alat;
    SET v_kode = CONCAT('ALAT-', LPAD(v_counter, 4, '0'));
    RETURN v_kode;
END//

-- ============================================
-- 3. STORED PROCEDURES
-- ============================================

CREATE PROCEDURE sp_approve_peminjaman(
    IN p_peminjaman_id INT,
    IN p_admin_id INT,
    IN p_catatan TEXT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_is_multi_item BOOLEAN;
    DECLARE v_alat_id INT;
    DECLARE v_jumlah INT;
    DECLARE v_stock_available INT;
    DECLARE v_item_name VARCHAR(100);
    DECLARE done INT DEFAULT FALSE;
    DECLARE cur CURSOR FOR 
        SELECT pd.alat_id, pd.jumlah, a.nama_alat, a.jumlah_tersedia
        FROM peminjaman_detail pd
        JOIN alat a ON pd.alat_id = a.id
        WHERE pd.peminjaman_id = p_peminjaman_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    START TRANSACTION;
    SELECT status, is_multi_item, alat_id, jumlah INTO v_status, v_is_multi_item, v_alat_id, v_jumlah
    FROM peminjaman WHERE id = p_peminjaman_id;
    
    IF v_status IS NULL THEN
        SET p_success = FALSE; SET p_message = 'Peminjaman not found'; ROLLBACK;
    ELSEIF v_status != 'Pending' THEN
        SET p_success = FALSE; SET p_message = CONCAT('Cannot approve status: ', v_status); ROLLBACK;
    ELSE
        IF v_is_multi_item = TRUE THEN
            OPEN cur;
            check_loop: LOOP
                FETCH cur INTO v_alat_id, v_jumlah, v_item_name, v_stock_available;
                IF done THEN LEAVE check_loop; END IF;
                IF v_stock_available < v_jumlah THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('Insufficient stock for ', v_item_name);
                    CLOSE cur; ROLLBACK; LEAVE check_loop;
                END IF;
            END LOOP;
            IF done THEN CLOSE cur; END IF;
            
            IF p_success IS NULL OR p_success = TRUE THEN
                UPDATE peminjaman SET status = 'Approved', approved_by = p_admin_id, approved_at = NOW(), catatan_approval = p_catatan WHERE id = p_peminjaman_id;
                SET p_success = TRUE; SET p_message = 'Approved successfully'; COMMIT;
            END IF;
        ELSE
            SELECT jumlah_tersedia INTO v_stock_available FROM alat WHERE id = v_alat_id;
            IF v_stock_available < v_jumlah THEN
                SET p_success = FALSE; SET p_message = 'Insufficient stock'; ROLLBACK;
            ELSE
                UPDATE peminjaman SET status = 'Approved', approved_by = p_admin_id, approved_at = NOW(), catatan_approval = p_catatan WHERE id = p_peminjaman_id;
                SET p_success = TRUE; SET p_message = 'Approved successfully'; COMMIT;
            END IF;
        END IF;
    END IF;
END//

CREATE PROCEDURE sp_reject_peminjaman(
    IN p_peminjaman_id INT,
    IN p_admin_id INT,
    IN p_catatan TEXT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_status VARCHAR(20);
    
    SELECT status INTO v_status FROM peminjaman WHERE id = p_peminjaman_id;
    
    IF v_status IS NULL THEN
        SET p_success = FALSE; SET p_message = 'Peminjaman not found';
    ELSEIF v_status != 'Pending' THEN
        SET p_success = FALSE; SET p_message = CONCAT('Cannot reject status: ', v_status);
    ELSE
        UPDATE peminjaman SET status = 'Rejected', approved_by = p_admin_id, approved_at = NOW(), catatan_approval = p_catatan WHERE id = p_peminjaman_id;
        SET p_success = TRUE; SET p_message = 'Rejected successfully';
    END IF;
END//

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
    DECLARE v_status VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; SET p_success = FALSE; SET p_message = 'Transaction failed'; SET p_total_denda = 0; END;
    
    START TRANSACTION;
    SELECT p.alat_id, p.jumlah, p.tanggal_kembali_rencana, p.status, a.harga_sewa
    INTO v_alat_id, v_jumlah, v_tanggal_kembali_rencana, v_status, v_harga_sewa
    FROM peminjaman p LEFT JOIN alat a ON p.alat_id = a.id WHERE p.id = p_peminjaman_id;
    
    IF v_status IS NULL THEN SET p_success = FALSE; SET p_message = 'Not found'; ROLLBACK;
    ELSEIF v_status NOT IN ('Approved', 'Dipinjam', 'Terlambat') THEN SET p_success = FALSE; SET p_message = 'Cannot return'; ROLLBACK;
    ELSE
        SET p_total_denda = fn_calculate_denda(v_tanggal_kembali_rencana, p_tanggal_kembali) + fn_calculate_denda_kerusakan(p_kondisi, COALESCE(v_harga_sewa, 0));
        INSERT INTO pengembalian (peminjaman_id, tanggal_kembali_aktual, kondisi_alat, jumlah_kembali, hari_terlambat, denda, denda_kerusakan, total_denda, keterangan, processed_by)
        VALUES (p_peminjaman_id, p_tanggal_kembali, p_kondisi, p_jumlah_kembali, fn_get_hari_terlambat(v_tanggal_kembali_rencana, p_tanggal_kembali), 
                fn_calculate_denda(v_tanggal_kembali_rencana, p_tanggal_kembali), fn_calculate_denda_kerusakan(p_kondisi, COALESCE(v_harga_sewa, 0)), p_total_denda, p_keterangan, p_processed_by);
        
        UPDATE peminjaman SET return_requested = FALSE, return_requested_at = NULL WHERE id = p_peminjaman_id;
        SET p_success = TRUE; SET p_message = 'Success'; COMMIT;
    END IF;
END//

CREATE PROCEDURE sp_get_laporan_peminjaman(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT p.*, 
           u.nama as nama_peminjam, u.username,
           a.nama_alat, a.kode_alat,
           k.nama_kategori
    FROM peminjaman p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN alat a ON p.alat_id = a.id
    LEFT JOIN kategori k ON a.kategori_id = k.id
    WHERE p.tanggal_pinjam BETWEEN p_start_date AND p_end_date
    ORDER BY p.tanggal_pinjam DESC;
END//

CREATE PROCEDURE sp_get_alat_populer(
    IN p_limit INT
)
BEGIN
    SELECT a.nama_alat, k.nama_kategori, COUNT(pd.id) as total_pinjam
    FROM alat a
    JOIN kategori k ON a.kategori_id = k.id
    LEFT JOIN peminjaman_detail pd ON a.id = pd.alat_id
    GROUP BY a.id
    ORDER BY total_pinjam DESC
    LIMIT p_limit;
END//

-- ============================================
-- 4. TRIGGERS
-- ============================================

CREATE TRIGGER trg_before_peminjaman_insert BEFORE INSERT ON peminjaman FOR EACH ROW
BEGIN
    IF NEW.kode_peminjaman IS NULL OR NEW.kode_peminjaman = '' THEN SET NEW.kode_peminjaman = fn_generate_kode_peminjaman(); END IF;
    IF NEW.tanggal_pinjam IS NULL THEN SET NEW.tanggal_pinjam = CURDATE(); END IF;
END//

CREATE TRIGGER trg_before_alat_insert BEFORE INSERT ON alat FOR EACH ROW
BEGIN
    IF NEW.kode_alat IS NULL OR NEW.kode_alat = '' THEN SET NEW.kode_alat = fn_generate_kode_alat(); END IF;
END//

CREATE TRIGGER trg_after_peminjaman_insert AFTER INSERT ON peminjaman FOR EACH ROW
BEGIN
    INSERT INTO log_aktivitas (user_id, aksi, tabel, record_id, detail) VALUES (NEW.user_id, 'CREATE', 'peminjaman', NEW.id, CONCAT('New loan: ', NEW.kode_peminjaman));
END//

CREATE TRIGGER trg_after_peminjaman_update AFTER UPDATE ON peminjaman FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO log_aktivitas (user_id, aksi, tabel, record_id, detail) VALUES (NEW.approved_by, 'UPDATE', 'peminjaman', NEW.id, CONCAT('Status changed: ', OLD.status, ' -> ', NEW.status));
        
        -- Stock reduction on Approved
        IF NEW.status = 'Approved' THEN
            IF NEW.is_multi_item = TRUE THEN
                UPDATE alat a INNER JOIN peminjaman_detail pd ON a.id = pd.alat_id SET a.jumlah_tersedia = a.jumlah_tersedia - pd.jumlah WHERE pd.peminjaman_id = NEW.id;
            ELSE
                UPDATE alat SET jumlah_tersedia = jumlah_tersedia - NEW.jumlah WHERE id = NEW.alat_id;
            END IF;
        END IF;
    END IF;
END//

CREATE TRIGGER trg_after_pengembalian_insert AFTER INSERT ON pengembalian FOR EACH ROW
BEGIN
    DECLARE v_is_multi_item BOOLEAN;
    DECLARE v_alat_id INT;
    DECLARE v_user_id INT;
    
    SELECT is_multi_item, alat_id, user_id INTO v_is_multi_item, v_alat_id, v_user_id FROM peminjaman WHERE id = NEW.peminjaman_id;
    
    -- Stock restoration
    IF v_is_multi_item = TRUE THEN
        UPDATE alat a INNER JOIN peminjaman_detail pd ON a.id = pd.alat_id SET a.jumlah_tersedia = a.jumlah_tersedia + pd.jumlah WHERE pd.peminjaman_id = NEW.peminjaman_id;
    ELSE
        UPDATE alat SET jumlah_tersedia = jumlah_tersedia + NEW.jumlah_kembali WHERE id = v_alat_id;
    END IF;
    
    UPDATE peminjaman SET status = 'Selesai', tanggal_kembali_aktual = NEW.tanggal_kembali_aktual WHERE id = NEW.peminjaman_id;
    INSERT INTO log_aktivitas (user_id, aksi, tabel, record_id, detail) VALUES (v_user_id, 'CREATE', 'pengembalian', NEW.id, CONCAT('Return processed. Denda: ', NEW.total_denda));
END//

DELIMITER ;

-- ============================================
-- 5. SEED DATA
-- ============================================

INSERT INTO roles (nama_role, deskripsi) VALUES
('Admin', 'Full access'),
('Petugas', 'Manage loans'),
('Peminjam', 'Borrow items');

INSERT INTO users (username, password, nama, email, role_id) VALUES
('admin', '$2a$10$XSdK5RnKGWs1G7YvibNum.TtBQbIeElEVaROIpWdQBaaGfdJEQcmu', 'Administrator', 'admin@example.com', 1),
('petugas1', '$2a$10$kgcdoiLXmAl17Fr15vOsZ.syT8NuKubl8o6Qg8pWuyao9UtP2FHwm', 'Petugas Satu', 'petugas1@example.com', 2),
('peminjam1', '$2a$10$rvS.dCZhzp4KJzEjqjDuvOaUTYcejssoUNNXRdZo7KymH7I2dE2f2', 'Peminjam Satu', 'peminjam1@example.com', 3);

INSERT INTO kategori (nama_kategori) VALUES ('Tenda'), ('Carrier'), ('Sleeping Bag'), ('Cooking Set');

INSERT INTO alat (nama_alat, kategori_id, jumlah_total, jumlah_tersedia, harga_sewa) VALUES
('Tenda 2P', 1, 10, 10, 50000),
('Tenda 4P', 1, 5, 5, 75000),
('Carrier 60L', 2, 10, 10, 40000),
('SB Polar', 3, 15, 15, 30000);

INSERT INTO settings (setting_key, setting_value, deskripsi) VALUES
('denda_per_hari', '5000', 'Late penalty'),
('app_name', 'Peminjaman Alat Gunung', 'App Title');
