-- ============================================
-- Migration: Add peminjaman_detail table for multiple items per loan
-- ============================================

USE peminjaman_alat_gunung;

-- Create peminjaman_detail table
CREATE TABLE IF NOT EXISTS peminjaman_detail (
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

-- Migrate existing peminjaman data to peminjaman_detail
-- Only migrate if table is empty (first time migration)
INSERT INTO peminjaman_detail (peminjaman_id, alat_id, jumlah)
SELECT id, alat_id, jumlah
FROM peminjaman
WHERE NOT EXISTS (SELECT 1 FROM peminjaman_detail WHERE peminjaman_id = peminjaman.id);

-- Add column to track if peminjaman uses new multi-item system
-- Keep alat_id for backward compatibility but make it nullable
ALTER TABLE peminjaman 
    MODIFY COLUMN alat_id INT NULL,
    ADD COLUMN is_multi_item BOOLEAN DEFAULT FALSE AFTER jumlah;

-- Update existing records to mark them as single-item
UPDATE peminjaman SET is_multi_item = FALSE WHERE is_multi_item IS NULL;

-- Update triggers to handle peminjaman_detail

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trg_after_peminjaman_approved;
DROP TRIGGER IF EXISTS trg_after_pengembalian_insert;

-- Recreate trigger for approval (handle both single and multi-item)
CREATE TRIGGER trg_after_peminjaman_approved
AFTER UPDATE ON peminjaman
FOR EACH ROW
BEGIN
    -- Only execute when status changes to 'Approved'
    IF NEW.status = 'Approved' AND OLD.status != 'Approved' THEN
        IF NEW.is_multi_item = TRUE THEN
            -- Multi-item: update stock for all items in detail
            UPDATE alat a
            INNER JOIN peminjaman_detail pd ON a.id = pd.alat_id
            SET a.jumlah_tersedia = a.jumlah_tersedia - pd.jumlah
            WHERE pd.peminjaman_id = NEW.id;
        ELSE
            -- Single-item: update stock for the single alat_id
            UPDATE alat 
            SET jumlah_tersedia = jumlah_tersedia - NEW.jumlah
            WHERE id = NEW.alat_id;
        END IF;
    END IF;
END;

CREATE TRIGGER trg_after_pengembalian_insert
AFTER INSERT ON pengembalian
FOR EACH ROW
BEGIN
    DECLARE v_is_multi_item BOOLEAN;
    DECLARE v_alat_id INT;
    
    -- Get peminjaman info
    SELECT is_multi_item, alat_id INTO v_is_multi_item, v_alat_id
    FROM peminjaman
    WHERE id = NEW.peminjaman_id;
    
    IF v_is_multi_item = TRUE THEN
        -- Multi-item: restore stock for all items
        UPDATE alat a
        INNER JOIN peminjaman_detail pd ON a.id = pd.alat_id
        SET a.jumlah_tersedia = a.jumlah_tersedia + pd.jumlah
        WHERE pd.peminjaman_id = NEW.peminjaman_id;
    ELSE
        -- Single-item: restore stock for single item
        UPDATE alat 
        SET jumlah_tersedia = jumlah_tersedia + NEW.jumlah_kembali
        WHERE id = v_alat_id;
    END IF;
    
    -- Update peminjaman status
    UPDATE peminjaman 
    SET status = 'Selesai', tanggal_kembali_aktual = NEW.tanggal_kembali_aktual
    WHERE id = NEW.peminjaman_id;
END;

-- Update stored procedures to handle multi-item loans

DROP PROCEDURE IF EXISTS sp_approve_peminjaman;

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
    
    -- Start transaction
    START TRANSACTION;
    
    -- Get peminjaman status
    SELECT status, is_multi_item, alat_id, jumlah 
    INTO v_status, v_is_multi_item, v_alat_id, v_jumlah
    FROM peminjaman 
    WHERE id = p_peminjaman_id;
    
    -- Check if peminjaman exists and is pending
    IF v_status IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Peminjaman not found';
        ROLLBACK;
    ELSEIF v_status != 'Pending' THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot approve peminjaman with status: ', v_status);
        ROLLBACK;
    ELSE
        -- Check stock availability
        IF v_is_multi_item = TRUE THEN
            -- Check stock for all items
            OPEN cur;
            check_loop: LOOP
                FETCH cur INTO v_alat_id, v_jumlah, v_item_name, v_stock_available;
                IF done THEN
                    LEAVE check_loop;
                END IF;
                
                IF v_stock_available < v_jumlah THEN
                    SET p_success = FALSE;
                    SET p_message = CONCAT('Insufficient stock for ', v_item_name, '. Available: ', v_stock_available, ', Requested: ', v_jumlah);
                    CLOSE cur;
                    ROLLBACK;
                    LEAVE check_loop;
                END IF;
            END LOOP;
            CLOSE cur;
            
            -- If we got here, all items have sufficient stock
            IF p_success IS NULL THEN
                UPDATE peminjaman 
                SET status = 'Approved',
                    approved_by = p_admin_id,
                    approved_at = NOW(),
                    catatan_approval = p_catatan
                WHERE id = p_peminjaman_id;
                
                SET p_success = TRUE;
                SET p_message = 'Peminjaman approved successfully';
                COMMIT;
            END IF;
        ELSE
            -- Single item check
            SELECT jumlah_tersedia INTO v_stock_available
            FROM alat WHERE id = v_alat_id;
            
            IF v_stock_available < v_jumlah THEN
                SET p_success = FALSE;
                SET p_message = CONCAT('Insufficient stock. Available: ', v_stock_available, ', Requested: ', v_jumlah);
                ROLLBACK;
            ELSE
                UPDATE peminjaman 
                SET status = 'Approved',
                    approved_by = p_admin_id,
                    approved_at = NOW(),
                    catatan_approval = p_catatan
                WHERE id = p_peminjaman_id;
                
                SET p_success = TRUE;
                SET p_message = 'Peminjaman approved successfully';
                COMMIT;
            END IF;
        END IF;
    END IF;
END;

-- Success message
SELECT 'Migration completed successfully!' as message;

