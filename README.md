# Peminjaman Alat Gunung

Aplikasi full-stack untuk peminjaman alat gunung dengan 3 level pengguna (Admin, Petugas, Peminjam).

## 🚀 Teknologi

### Backend
- Express.js
- MySQL2
- JWT Authentication
- bcryptjs
- Excel/CSV Import (xlsx, csv-parser)

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios

## 📁 Struktur Project

```
RPL/
├── backend/           # Express.js API
│   ├── config/       # Database configuration
│   ├── controllers/  # Business logic
│   ├── middleware/   # Authentication & authorization
│   ├── routes/       # API routes
│   └── server.js     # Main server file
├── frontend/         # React application
│   └── src/
│       ├── components/  # Reusable components
│       ├── contexts/    # React contexts
│       ├── pages/       # Page components
│       └── services/    # API services
└── database/         # SQL scripts
    ├── schema.sql
    ├── functions.sql
    ├── stored_procedures.sql
    ├── triggers.sql
    └── seed_data.sql
```

## 🔧 Installation

### 1. Database Setup

```bash
# Import database schema
mysql -u root -p < database/schema.sql
mysql -u root -p peminjaman_alat_gunung < database/functions.sql
mysql -u root -p peminjaman_alat_gunung < database/stored_procedures.sql
mysql -u root -p peminjaman_alat_gunung < database/triggers.sql
mysql -u root -p peminjaman_alat_gunung < database/seed_data.sql
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env file with your database credentials
npm run dev
```

Backend akan berjalan di `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## 👥 Default Users

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Petugas | petugas1 | petugas123 |
| Peminjam | peminjam1 | peminjam123 |

**⚠️ PENTING:** Ganti password default setelah login pertama kali!

## 📋 Fitur

### Admin
- ✅ Kelola User (CRUD)
- ✅ Kelola Alat (CRUD + Import Excel/CSV)
- ✅ Kelola Kategori (CRUD)
- ✅ Approve/Reject Peminjaman
- ✅ Proses Pengembalian dengan Kalkulasi Denda
- ✅ Laporan & Statistik
- ✅ Log Aktivitas

### Petugas
- ✅ Kelola Alat (CRUD + Import Excel/CSV)
- ✅ Kelola Kategori (CRUD)
- ✅ Approve/Reject Peminjaman
- ✅ Proses Pengembalian dengan Kalkulasi Denda
- ✅ Laporan & Statistik
- ✅ Log Aktivitas

### Peminjam
- ✅ Lihat Daftar Alat
- ✅ Ajukan Peminjaman
- ✅ Lihat Status Peminjaman
- ✅ Lihat Riwayat Peminjaman

## 💰 Denda

- **Denda Keterlambatan:** Rp 5.000 per hari
- **Denda Kerusakan:**
  - Rusak Ringan: 2x harga sewa
  - Rusak Berat: 5x harga sewa
  - Hilang: 10x harga sewa

## 📊 Database Features

- ✅ Stored Procedures untuk operasi kompleks
- ✅ Functions untuk kalkulasi denda
- ✅ Triggers untuk logging otomatis
- ✅ Transaction support (Commit/Rollback)
- ✅ Relational operations dengan Foreign Keys

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get profile

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Alat
- `GET /api/alat` - Get all equipment
- `POST /api/alat` - Create equipment
- `POST /api/alat/import` - Import from Excel/CSV

### Peminjaman
- `GET /api/peminjaman` - Get all loans
- `POST /api/peminjaman` - Create loan request
- `PUT /api/peminjaman/:id/approve` - Approve loan
- `PUT /api/peminjaman/:id/reject` - Reject loan

### Pengembalian
- `POST /api/pengembalian` - Process return
- `POST /api/pengembalian/calculate-denda` - Calculate penalty

### Laporan
- `GET /api/laporan/peminjaman` - Loan report
- `GET /api/laporan/denda` - Penalty report
- `GET /api/laporan/dashboard-stats` - Dashboard statistics

## 🧪 Testing

Lihat file `docs/testing.md` untuk skenario pengujian lengkap.

## 📄 License

ISC

## 👨‍💻 Developer

Developed for Rekayasa Perangkat Lunak Project
