import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { laporanAPI, peminjamanAPI } from '../../services/api';
import { FiUsers, FiPackage, FiClipboard, FiDollarSign, FiTrendingUp, FiClock } from 'react-icons/fi';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await laporanAPI.getDashboardStats();
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </Layout>
        );
    }

    const statCards = [
        {
            title: 'Total Alat',
            value: stats?.alat?.total || 0,
            subtitle: `${stats?.alat?.total_unit || 0} unit`,
            icon: FiPackage,
            color: 'blue',
        },
        {
            title: 'Peminjaman Pending',
            value: stats?.peminjaman?.pending || 0,
            subtitle: 'Menunggu persetujuan',
            icon: FiClock,
            color: 'yellow',
        },
        {
            title: 'Sedang Dipinjam',
            value: (stats?.peminjaman?.approved || 0) + (stats?.peminjaman?.dipinjam || 0),
            subtitle: 'Peminjaman aktif',
            icon: FiClipboard,
            color: 'purple',
        },
        {
            title: 'Total Denda',
            value: `Rp ${(stats?.total_denda || 0).toLocaleString('id-ID')}`,
            subtitle: 'Akumulasi denda',
            icon: FiDollarSign,
            color: 'red',
        },
    ];

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
                    <p className="text-gray-600 mt-1">Selamat datang di sistem peminjaman alat gunung</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, index) => (
                        <div key={index} className="card hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                                </div>
                                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activities */}
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Aktivitas Terbaru</h2>
                    <div className="space-y-3">
                        {stats?.recent_activities?.slice(0, 10).map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900">
                                        <span className="font-medium">{activity.user_nama || 'System'}</span>
                                        {' '}- {activity.detail}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(activity.timestamp).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <span className={`badge badge-${activity.aksi.toLowerCase()}`}>
                                    {activity.aksi}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Peminjaman Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Status Peminjaman</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Pending</span>
                                <span className="badge badge-pending">{stats?.peminjaman?.pending || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Approved</span>
                                <span className="badge badge-approved">{stats?.peminjaman?.approved || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Dipinjam</span>
                                <span className="badge badge-dipinjam">{stats?.peminjaman?.dipinjam || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Terlambat</span>
                                <span className="badge badge-terlambat">{stats?.peminjaman?.terlambat || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Selesai</span>
                                <span className="badge badge-selesai">{stats?.peminjaman?.selesai || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Statistik User</h2>
                        <div className="space-y-3">
                            {stats?.users?.map((userRole) => (
                                <div key={userRole.nama_role} className="flex justify-between items-center">
                                    <span className="text-gray-600">{userRole.nama_role}</span>
                                    <span className="font-semibold text-gray-900">{userRole.total} user</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AdminDashboard;
