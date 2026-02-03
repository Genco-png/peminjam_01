import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    FiHome, FiUsers, FiPackage, FiGrid, FiClipboard,
    FiRotateCcw, FiBarChart2, FiActivity, FiList
} from 'react-icons/fi';

const Sidebar = () => {
    const { user, isAdmin, isPetugas } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const adminMenuItems = [
        { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
        { path: '/admin/users', icon: FiUsers, label: 'Kelola User' },
        { path: '/admin/alat', icon: FiPackage, label: 'Kelola Alat' },
        { path: '/admin/kategori', icon: FiGrid, label: 'Kelola Kategori' },
        { path: '/admin/peminjaman', icon: FiClipboard, label: 'Peminjaman' },
        { path: '/admin/pengembalian', icon: FiRotateCcw, label: 'Pengembalian' },
        { path: '/admin/laporan', icon: FiBarChart2, label: 'Laporan' },
        { path: '/admin/log', icon: FiActivity, label: 'Log Aktivitas' },
    ];

    const petugasMenuItems = [
        { path: '/petugas/dashboard', icon: FiHome, label: 'Dashboard' },
        { path: '/petugas/alat', icon: FiPackage, label: 'Kelola Alat' },
        { path: '/petugas/kategori', icon: FiGrid, label: 'Kelola Kategori' },
        { path: '/petugas/peminjaman', icon: FiClipboard, label: 'Peminjaman' },
        { path: '/petugas/pengembalian', icon: FiRotateCcw, label: 'Pengembalian' },
        { path: '/petugas/laporan', icon: FiBarChart2, label: 'Laporan' },
        { path: '/petugas/log', icon: FiActivity, label: 'Log Aktivitas' },
    ];

    const peminjamMenuItems = [
        { path: '/peminjam/dashboard', icon: FiHome, label: 'Dashboard' },
        { path: '/peminjam/alat', icon: FiList, label: 'Daftar Alat' },
        { path: '/peminjam/peminjaman', icon: FiClipboard, label: 'Peminjaman Saya' },
    ];

    let menuItems = [];
    if (user?.role_id === 1) menuItems = adminMenuItems;
    else if (user?.role_id === 2) menuItems = petugasMenuItems;
    else if (user?.role_id === 3) menuItems = peminjamMenuItems;

    return (
        <aside className="w-64 bg-white shadow-lg min-h-screen">
            <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Menu</h2>
                <nav className="space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${isActive(item.path)
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
