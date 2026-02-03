-- ============================================
-- Database Schema: Peminjaman Alat Gunung
-- ============================================

DROP DATABASE IF EXISTS peminjaman_alat_gunung;
CREATE DATABASE peminjaman_alat_gunung;
USE peminjaman_alat_gunung;

-- ============================================
-- Table: roles
-- ============================================
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_role VARCHAR(50) NOT NULL UNIQUE,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- Table: users
-- ============================================
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

-- ============================================
-- Table: kategori
-- ============================================
CREATE TABLE kategori (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_kategori VARCHAR(100) NOT NULL UNIQUE,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nama_kategori (nama_kategori)
) ENGINE=InnoDB;

-- ============================================
-- Table: alat
-- ============================================
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

-- ============================================
-- Table: peminjaman
-- ============================================
CREATE TABLE peminjaman (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kode_peminjaman VARCHAR(50) UNIQUE,
    user_id INT NOT NULL,
    alat_id INT NOT NULL,
    jumlah INT NOT NULL DEFAULT 1,
    tanggal_pinjam DATE NOT NULL,
    tanggal_kembali_rencana DATE NOT NULL,
    tanggal_kembali_aktual DATE,
    status ENUM('Pending', 'Approved', 'Rejected', 'Dipinjam', 'Selesai', 'Terlambat') DEFAULT 'Pending',
    keperluan TEXT,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    catatan_approval TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (alat_id) REFERENCES alat(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_alat (alat_id),
    INDEX idx_status (status),
    INDEX idx_tanggal_pinjam (tanggal_pinjam),
    INDEX idx_kode (kode_peminjaman),
    CHECK (jumlah > 0),
    CHECK (tanggal_kembali_rencana >= tanggal_pinjam)
) ENGINE=InnoDB;

-- ============================================
-- Table: pengembalian
-- ============================================
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
    INDEX idx_tanggal_kembali (tanggal_kembali_aktual),
    CHECK (jumlah_kembali > 0),
    CHECK (hari_terlambat >= 0),
    CHECK (denda >= 0),
    CHECK (denda_kerusakan >= 0),
    CHECK (total_denda >= 0)
) ENGINE=InnoDB;

-- ============================================
-- Table: log_aktivitas
-- ============================================
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
    INDEX idx_timestamp (timestamp),
    INDEX idx_aksi (aksi)
) ENGINE=InnoDB;

-- ============================================
-- Table: settings (untuk konfigurasi sistem)
-- ============================================
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    deskripsi TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
