import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin & Petugas Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import AlatManagement from './pages/admin/AlatManagement';
import KategoriManagement from './pages/admin/KategoriManagement';
import Peminjaman from './pages/admin/Peminjaman';
import Pengembalian from './pages/admin/Pengembalian';
import Laporan from './pages/admin/Laporan';
import LogAktivitas from './pages/admin/LogAktivitas';

// Peminjam Pages
import PeminjamDashboard from './pages/peminjam/PeminjamDashboard';
import AlatList from './pages/peminjam/AlatList';
import MyLoans from './pages/peminjam/MyLoans';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Admin & Petugas Protected Routes */}
                    <Route
                        path="/admin/dashboard"
                        element={<ProtectedRoute allowedRoles={[1]}><AdminDashboard /></ProtectedRoute>}
                    />
                    <Route
                        path="/admin/users"
                        element={<ProtectedRoute allowedRoles={[1]}><UserManagement /></ProtectedRoute>}
                    />
                    <Route
                        path="/admin/alat"
                        element={<ProtectedRoute allowedRoles={[1]}><AlatManagement /></ProtectedRoute>}
                    />
                    <Route
                        path="/admin/kategori"
                        element={<ProtectedRoute allowedRoles={[1]}><KategoriManagement /></ProtectedRoute>}
                    />
                    <Route
                        path="/admin/peminjaman"
                        element={<ProtectedRoute allowedRoles={[1]}><Peminjaman /></ProtectedRoute>}
                    />
                    <Route
                        path="/admin/pengembalian"
                        element={<ProtectedRoute allowedRoles={[1]}><Pengembalian /></ProtectedRoute>}
                    />
                    <Route
                        path="/admin/laporan"
                        element={<ProtectedRoute allowedRoles={[1]}><Laporan /></ProtectedRoute>}
                    />
                    <Route
                        path="/admin/log"
                        element={<ProtectedRoute allowedRoles={[1]}><LogAktivitas /></ProtectedRoute>}
                    />

                    {/* Petugas Specific Routes (Reusing components) */}
                    <Route
                        path="/petugas/dashboard"
                        element={<ProtectedRoute allowedRoles={[2]}><AdminDashboard /></ProtectedRoute>}
                    />
                    <Route
                        path="/petugas/alat"
                        element={<ProtectedRoute allowedRoles={[2]}><AlatManagement /></ProtectedRoute>}
                    />
                    <Route
                        path="/petugas/kategori"
                        element={<ProtectedRoute allowedRoles={[2]}><KategoriManagement /></ProtectedRoute>}
                    />
                    <Route
                        path="/petugas/peminjaman"
                        element={<ProtectedRoute allowedRoles={[2]}><Peminjaman /></ProtectedRoute>}
                    />
                    <Route
                        path="/petugas/pengembalian"
                        element={<ProtectedRoute allowedRoles={[2]}><Pengembalian /></ProtectedRoute>}
                    />
                    <Route
                        path="/petugas/laporan"
                        element={<ProtectedRoute allowedRoles={[2]}><Laporan /></ProtectedRoute>}
                    />
                    <Route
                        path="/petugas/log"
                        element={<ProtectedRoute allowedRoles={[2]}><LogAktivitas /></ProtectedRoute>}
                    />

                    {/* Peminjam Protected Routes */}
                    <Route
                        path="/peminjam/dashboard"
                        element={<ProtectedRoute allowedRoles={[3]}><PeminjamDashboard /></ProtectedRoute>}
                    />
                    <Route
                        path="/peminjam/alat"
                        element={<ProtectedRoute allowedRoles={[3]}><AlatList /></ProtectedRoute>}
                    />
                    <Route
                        path="/peminjam/peminjaman"
                        element={<ProtectedRoute allowedRoles={[3]}><MyLoans /></ProtectedRoute>}
                    />

                    {/* Default Redirect */}
                    <Route path="/" element={<Navigate to="/login" replace />} />

                    {/* Unauthorized */}
                    <Route path="/unauthorized" element={
                        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                            <div className="text-center card max-w-sm">
                                <h1 className="text-4xl font-bold text-red-600 mb-2">403</h1>
                                <p className="text-gray-600 mb-6">Anda tidak memiliki akses ke halaman ini.</p>
                                <button onClick={() => window.history.back()} className="btn btn-primary w-full">Kembali</button>
                            </div>
                        </div>
                    } />

                    {/* 404 */}
                    <Route path="*" element={
                        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                            <div className="text-center card max-w-sm">
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
                                <p className="text-gray-600 mb-6">Halaman tidak ditemukan.</p>
                                <a href="/login" className="btn btn-primary block text-center">Ke Halaman Utama</a>
                            </div>
                        </div>
                    } />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
