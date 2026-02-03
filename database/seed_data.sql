-- ============================================
-- Seed Data with Properly Hashed Passwords
-- ============================================

USE peminjaman_alat_gunung;

-- ============================================
-- Insert Roles
-- ============================================
INSERT INTO roles (nama_role, deskripsi) VALUES
('Admin', 'Administrator dengan akses penuh'),
('Petugas', 'Petugas yang mengelola peminjaman dan alat'),
('Peminjam', 'User yang dapat meminjam alat');

-- ============================================
-- Insert Users with bcrypt hashed passwords
-- Passwords: admin123, petugas123, peminjam123
-- ============================================

INSERT INTO users (username, password, nama, email, no_telepon, alamat, role_id) VALUES
('admin', '$2a$10$XSdK5RnKGWs1G7YvibNum.TtBQbIeElEVaROIpWdQBaaGfdJEQcmu', 'Administrator', 'admin@example.com', '081234567890', 'Jl. Admin No. 1', 1),
('petugas1', '$2a$10$kgcdoiLXmAl17Fr15vOsZ.syT8NuKubl8o6Qg8pWuyao9UtP2FHwm', 'Petugas Satu', 'petugas1@example.com', '081234567891', 'Jl. Petugas No. 1', 2),
('petugas2', '$2a$10$kgcdoiLXmAl17Fr15vOsZ.syT8NuKubl8o6Qg8pWuyao9UtP2FHwm', 'Petugas Dua', 'petugas2@example.com', '081234567892', 'Jl. Petugas No. 2', 2),
('peminjam1', '$2a$10$rvS.dCZhzp4KJzEjqjDuvOaUTYcejssoUNNXRdZo7KymH7I2dE2f2', 'Peminjam Satu', 'peminjam1@example.com', '081234567893', 'Jl. Peminjam No. 1', 3),
('peminjam2', '$2a$10$rvS.dCZhzp4KJzEjqjDuvOaUTYcejssoUNNXRdZo7KymH7I2dE2f2', 'Peminjam Dua', 'peminjam2@example.com', '081234567894', 'Jl. Peminjam No. 2', 3);

-- ============================================
-- Insert Kategori
-- ============================================
INSERT INTO kategori (nama_kategori, deskripsi) VALUES
('Tenda', 'Tenda untuk berkemah di gunung'),
('Carrier', 'Tas carrier untuk membawa perlengkapan'),
('Sleeping Bag', 'Kantung tidur untuk tidur di gunung'),
('Cooking Set', 'Peralatan memasak portable'),
('Navigasi', 'Alat navigasi seperti kompas dan GPS'),
('Penerangan', 'Alat penerangan seperti headlamp dan senter'),
('Pakaian', 'Pakaian khusus pendakian gunung'),
('Sepatu', 'Sepatu gunung dan trekking');

-- ============================================
-- Insert Alat
-- ============================================
INSERT INTO alat (nama_alat, kategori_id, jumlah_total, jumlah_tersedia, kondisi, harga_sewa, deskripsi) VALUES
-- Tenda
('Tenda Kapasitas 2 Orang', 1, 10, 10, 'Baik', 50000, 'Tenda dome untuk 2 orang, waterproof'),
('Tenda Kapasitas 4 Orang', 1, 5, 5, 'Baik', 75000, 'Tenda besar untuk 4 orang, double layer'),
('Tenda Ultralight', 1, 3, 3, 'Baik', 100000, 'Tenda ringan untuk pendakian cepat'),

-- Carrier
('Carrier 60L', 2, 15, 15, 'Baik', 40000, 'Carrier 60 liter dengan rain cover'),
('Carrier 80L', 2, 10, 10, 'Baik', 50000, 'Carrier 80 liter untuk ekspedisi panjang'),
('Daypack 30L', 2, 8, 8, 'Baik', 25000, 'Tas kecil untuk day hiking'),

-- Sleeping Bag
('Sleeping Bag Suhu -5°C', 3, 12, 12, 'Baik', 35000, 'Sleeping bag untuk suhu dingin'),
('Sleeping Bag Suhu 0°C', 3, 15, 15, 'Baik', 30000, 'Sleeping bag standar'),
('Sleeping Bag Ultralight', 3, 5, 5, 'Baik', 45000, 'Sleeping bag ringan dan compact'),

-- Cooking Set
('Kompor Portable + Gas', 4, 10, 10, 'Baik', 20000, 'Kompor portable dengan tabung gas'),
('Nesting Cookware Set', 4, 8, 8, 'Baik', 25000, 'Set peralatan masak nested'),
('Water Filter', 4, 6, 6, 'Baik', 15000, 'Filter air portable'),

-- Navigasi
('Kompas Silva', 5, 10, 10, 'Baik', 10000, 'Kompas navigasi profesional'),
('GPS Garmin', 5, 4, 4, 'Baik', 50000, 'GPS handheld dengan peta'),
('Altimeter', 5, 5, 5, 'Baik', 15000, 'Altimeter untuk mengukur ketinggian'),

-- Penerangan
('Headlamp LED', 6, 20, 20, 'Baik', 15000, 'Headlamp LED rechargeable'),
('Senter Tactical', 6, 10, 10, 'Baik', 12000, 'Senter tactical waterproof'),
('Lampu Tenda', 6, 8, 8, 'Baik', 10000, 'Lampu gantung untuk tenda'),

-- Pakaian
('Jaket Gunung Waterproof', 7, 12, 12, 'Baik', 40000, 'Jaket waterproof windproof'),
('Sarung Tangan Gunung', 7, 15, 15, 'Baik', 10000, 'Sarung tangan thermal'),
('Buff/Masker', 7, 20, 20, 'Baik', 5000, 'Buff multifungsi'),

-- Sepatu
('Sepatu Gunung High Cut', 8, 10, 10, 'Baik', 45000, 'Sepatu gunung ankle support'),
('Sepatu Trekking Low Cut', 8, 8, 8, 'Baik', 35000, 'Sepatu trekking ringan'),
('Gaiters', 8, 12, 12, 'Baik', 15000, 'Pelindung kaki dari air dan lumpur');

-- ============================================
-- Insert Settings
-- ============================================
INSERT INTO settings (setting_key, setting_value, deskripsi) VALUES
('denda_per_hari', '5000', 'Denda keterlambatan per hari (Rupiah)'),
('max_peminjaman_aktif', '3', 'Maksimal peminjaman aktif per user'),
('durasi_peminjaman_max', '14', 'Durasi maksimal peminjaman (hari)'),
('app_name', 'Peminjaman Alat Gunung', 'Nama aplikasi'),
('app_version', '1.0.0', 'Versi aplikasi');
