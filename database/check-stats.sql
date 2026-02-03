-- Quick query to check dashboard stats manually
USE peminjaman_alat_gunung;

-- Peminjaman statistics (same as backend query)
SELECT 
    COUNT(*) as total_peminjaman,
    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
    SUM(CASE WHEN status = 'Dipinjam' THEN 1 ELSE 0 END) as dipinjam,
    SUM(CASE WHEN status = 'Terlambat' THEN 1 ELSE 0 END) as terlambat,
    SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as selesai
FROM peminjaman;

-- Show all peminjaman records
SELECT 
    id,
    user_id,
    status,
    is_multi_item,
    created_at
FROM peminjaman
ORDER BY created_at DESC;
