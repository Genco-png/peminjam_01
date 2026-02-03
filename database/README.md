# 🗄️ Database Setup Guide

Panduan lengkap untuk setup database **Peminjaman Alat Gunung** pertama kali.

---

## 📋 Prerequisites

Pastikan sudah terinstall:
- ✅ **MySQL Server** (versi 5.7 atau lebih tinggi)
- ✅ **Node.js** (versi 14 atau lebih tinggi)
- ✅ **npm** (biasanya sudah include dengan Node.js)

---

## 🚀 Quick Start (Setup Pertama Kali)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Konfigurasi Environment

Buat file `.env` di folder `backend`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=peminjaman_alat_gunung
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development
```

> ⚠️ **PENTING**: Ganti `DB_PASSWORD` dengan password MySQL Anda!

### 3. Inisialisasi Database

Jalankan script setup otomatis:

```bash
# Windows
setup-database.bat

# Atau manual dengan Node.js
node database/init-database.js
```

Script ini akan:
- ✅ Membuat database `peminjaman_alat_gunung`
- ✅ Membuat semua tabel (users, alat, peminjaman, dll)
- ✅ Membuat stored procedures dan functions
- ✅ Membuat triggers untuk automasi
- ✅ Insert data awal (roles, users, kategori, alat)

### 4. Jalankan Migration (Multi-Item Support)

```bash
node database/run-migration.js
```

Migration ini menambahkan:
- ✅ Tabel `peminjaman_detail` untuk multi-item borrowing
- ✅ Kolom `is_multi_item` di tabel `peminjaman`
- ✅ Update triggers untuk support multi-item

### 5. Verifikasi Setup

```bash
node database/fix-dashboard.js
```

Output yang benar:
```
📊 Current Database Stats:
┌─────────┬───────┬─────────┬──────────┬──────────┬───────────┬─────────┐
│ (index) │ total │ pending │ approved │ dipinjam │ terlambat │ selesai │
├─────────┼───────┼─────────┼──────────┼──────────┼───────────┼─────────┤
│ 0       │ 2     │ '0'     │ '2'      │ '0'      │ '0'       │ '0'     │
└─────────┴───────┴─────────┴──────────┴──────────┴───────────┴─────────┘

✅ Correct "Sedang Dipinjam" value: 2
```

---

## 🔄 Reset Database (Clean Install)

Jika ingin mulai dari awal atau ada masalah:

```bash
# Cara 1: Gunakan batch script (RECOMMENDED)
reset-and-setup.bat

# Cara 2: Manual
# 1. Drop database
mysql -u root -p -e "DROP DATABASE IF EXISTS peminjaman_alat_gunung;"

# 2. Setup ulang
node database/init-database.js

# 3. Jalankan migration
node database/run-migration.js
```

---

## 👥 Default User Accounts

Setelah setup, gunakan akun berikut untuk login:

| Role | Username | Password | Deskripsi |
|------|----------|----------|-----------|
| **Admin** | admin | admin123 | Full access ke semua fitur |
| **Petugas** | petugas1 | petugas123 | Approve/reject peminjaman |
| **Peminjam** | peminjam1 | peminjam123 | Borrow items |

> ⚠️ **KEAMANAN**: Ganti password default setelah login pertama kali!

---

## 📊 Database Schema

### Tabel Utama

1. **users** - Data pengguna (admin, petugas, peminjam)
2. **roles** - Role/peran pengguna
3. **alat** - Data alat gunung
4. **kategori** - Kategori alat (tenda, carrier, dll)
5. **peminjaman** - Data peminjaman (header)
6. **peminjaman_detail** - Detail item yang dipinjam (NEW!)
7. **pengembalian** - Data pengembalian dan denda
8. **log_aktivitas** - Log semua aktivitas sistem

### Fitur Database

- ✅ **Triggers**: Auto-update stock saat approve/return
- ✅ **Stored Procedures**: Business logic untuk approve/reject
- ✅ **Functions**: Kalkulasi denda otomatis
- ✅ **Indexes**: Optimasi query performance

---

## 🛠️ Troubleshooting

### ❌ Error: "Access denied for user 'root'@'localhost'"

**Solusi**: 
```bash
# Cek password MySQL Anda
mysql -u root -p

# Update .env dengan password yang benar
DB_PASSWORD=your_mysql_password
```

### ❌ Error: "Database 'peminjaman_alat_gunung' already exists"

**Solusi**:
```bash
# Gunakan reset script
reset-and-setup.bat
```

### ❌ Error: "Duplicate column name 'is_multi_item'"

**Solusi**: Migration sudah pernah dijalankan. Skip migration atau reset database.

### ❌ Dashboard menunjukkan angka yang salah (misal: 20 padahal seharusnya 2)

**Penyebab**: Frontend cache atau backend belum restart

**Solusi**:
1. **Restart backend server**
   ```bash
   # Tekan Ctrl+C di terminal backend
   # Lalu jalankan ulang:
   npm run dev
   ```

2. **Hard refresh browser**
   - Windows: `Ctrl + Shift + R` atau `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

3. **Clear browser cache**
   - Chrome: Settings → Privacy → Clear browsing data
   - Pilih "Cached images and files"

4. **Test dengan incognito mode**
   - `Ctrl + Shift + N` (Chrome)

5. **Verifikasi database benar**
   ```bash
   node database/fix-dashboard.js
   ```

---

## 🧪 Testing Database

### Test Query Manual

```bash
# Cek jumlah peminjaman
mysql -u root -p peminjaman_alat_gunung -e "SELECT status, COUNT(*) as total FROM peminjaman GROUP BY status;"

# Cek detail items
mysql -u root -p peminjaman_alat_gunung -e "SELECT * FROM peminjaman_detail;"

# Cek stock alat
mysql -u root -p peminjaman_alat_gunung -e "SELECT nama_alat, jumlah_total, jumlah_tersedia FROM alat;"
```

### Test dengan Script

```bash
# Cek dashboard stats (RECOMMENDED)
node database/fix-dashboard.js

# Cek semua data
node database/check-dashboard-data.js

# Debug dashboard
node database/debug-dashboard.js
```

---

## 📁 File Structure

```
database/
├── schema.sql                  # Database schema
├── seed_data.sql               # Initial data
├── init-database.js            # Setup script
├── migration_multi_item.sql    # Migration untuk multi-item
├── run-migration.js            # Migration runner
├── reset-database.sql          # Reset SQL
├── fix-dashboard.js            # Fix & verify dashboard ⭐
├── debug-dashboard.js          # Debug tool
└── check-dashboard-data.js     # Verification tool

Root:
├── setup-database.bat          # Setup script
└── reset-and-setup.bat         # Reset & setup script ⭐
```

---

## 🔐 Security Notes

1. **Ganti JWT_SECRET** di production
2. **Ganti default passwords** setelah setup
3. **Jangan commit .env** ke git
4. **Gunakan strong password** untuk MySQL
5. **Backup database** secara berkala

---

## 📞 Need Help?

Jika masih ada masalah:
1. Cek log error di terminal
2. Jalankan `node database/fix-dashboard.js`
3. Periksa koneksi MySQL dengan `mysql -u root -p`
4. Pastikan semua dependencies terinstall dengan `npm install`

---

## ✅ Checklist Setup

- [ ] MySQL Server running
- [ ] Node.js dan npm terinstall
- [ ] File `.env` sudah dikonfigurasi
- [ ] Dependencies terinstall (`npm install`)
- [ ] Database initialized (`node database/init-database.js`)
- [ ] Migration completed (`node database/run-migration.js`)
- [ ] Verification passed (`node database/fix-dashboard.js`)
- [ ] Backend server running (`npm run dev`)
- [ ] Frontend running (`cd frontend && npm run dev`)
- [ ] Login berhasil dengan akun default

---

**Happy Coding! 🚀**
