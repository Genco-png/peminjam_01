import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { peminjamanAPI } from '../../services/api';
import { FiPackage, FiClock, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PeminjamDashboard = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchMyLoans();
    }, []);

    const fetchMyLoans = async () => {
        try {
            const response = await peminjamanAPI.getMyLoans();
            setLoans(response.data.data);
        } catch (error) {
            console.error('Error fetching loans:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate stats from my loans
    const stats = {
        pending: loans.filter(l => l.status === 'Pending').length,
        approved: loans.filter(l => l.status === 'Approved').length,
        dipinjam: loans.filter(l => l.status === 'Dipinjam').length,
        terlambat: loans.filter(l => l.status === 'Terlambat').length,
        selesai: loans.filter(l => l.status === 'Selesai').length,
    };

    // Check for unreturned items (active loans)
    const unreturnedLoans = loans.filter(l =>
        ['Approved', 'Dipinjam', 'Terlambat'].includes(l.status)
    );
    const overdueLoans = unreturnedLoans.filter(l => l.is_overdue);
    const totalCurrentLateFee = overdueLoans.reduce((sum, loan) =>
        sum + (parseFloat(loan.denda_terlambat_sekarang) || 0), 0
    );

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
            title: 'Menunggu Persetujuan',
            value: stats.pending,
            icon: FiClock,
            color: 'yellow',
        },
        {
            title: 'Sedang Dipinjam',
            value: stats.dipinjam + stats.approved,
            icon: FiPackage,
            color: 'blue',
        },
        {
            title: 'Selesai',
            value: stats.selesai,
            icon: FiCheckCircle,
            color: 'green',
        },
        {
            title: 'Terlambat',
            value: stats.terlambat,
            icon: FiAlertTriangle,
            color: 'red',
        },
    ];

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Selamat Datang, {user?.nama || 'Peminjam'}!</h1>
                    <p className="text-gray-600 mt-1">Dashboard peminjaman alat gunung Anda</p>
                </div>

                {/* Unreturned Items Warning */}
                {unreturnedLoans.length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 shadow-md">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <FiAlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-lg font-bold text-red-900">
                                    ⚠️ Anda Memiliki {unreturnedLoans.length} Alat yang Belum Dikembalikan!
                                </h3>
                                <div className="mt-3 text-sm text-red-800">
                                    <p className="mb-2">
                                        Harap segera kembalikan alat yang telah Anda pinjam untuk menghindari denda keterlambatan.
                                    </p>

                                    {overdueLoans.length > 0 && (
                                        <div className="mt-4 p-3 bg-red-100 rounded border border-red-300">
                                            <p className="font-bold text-red-900 mb-2">
                                                🚨 {overdueLoans.length} Alat Terlambat Dikembalikan:
                                            </p>
                                            <ul className="space-y-2 ml-4">
                                                {overdueLoans.map(loan => (
                                                    <li key={loan.id} className="text-xs">
                                                        <span className="font-semibold">{loan.nama_alat}</span>
                                                        {' - '}
                                                        <span className="text-red-700">
                                                            Terlambat {loan.hari_terlambat_sekarang} hari
                                                        </span>
                                                        {' - '}
                                                        <span className="font-bold text-red-900">
                                                            Denda: Rp {parseFloat(loan.denda_terlambat_sekarang || 0).toLocaleString()}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {totalCurrentLateFee > 0 && (
                                                <div className="mt-3 pt-3 border-t border-red-300">
                                                    <p className="font-bold text-red-900">
                                                        Total Denda Saat Ini:
                                                        <span className="text-lg ml-2">Rp {totalCurrentLateFee.toLocaleString()}</span>
                                                        <span className="text-xs ml-2 font-normal">(+Rp 5.000/hari per alat)</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <button
                                        onClick={() => navigate('/peminjam/peminjaman')}
                                        className="btn btn-danger"
                                    >
                                        Lihat Detail Peminjaman →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, index) => (
                        <div key={index} className="card hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Menu Cepat</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/peminjam/alat')}
                            className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg text-left transition-colors"
                        >
                            <FiPackage className="w-8 h-8 text-primary-600 mb-2" />
                            <h3 className="font-bold text-primary-900">Lihat Daftar Alat</h3>
                            <p className="text-sm text-primary-700">Cari dan pinjam alat gunung</p>
                        </button>
                        <button
                            onClick={() => navigate('/peminjam/peminjaman')}
                            className="p-4 bg-mountain-50 hover:bg-mountain-100 rounded-lg text-left transition-colors"
                        >
                            <FiClock className="w-8 h-8 text-mountain-600 mb-2" />
                            <h3 className="font-bold text-mountain-900">Riwayat Peminjaman</h3>
                            <p className="text-sm text-mountain-700">Lihat status peminjaman Anda</p>
                        </button>
                    </div>
                </div>

                {/* Recent Loans */}
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Peminjaman Terbaru</h2>
                    {loans.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FiPackage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Belum ada peminjaman</p>
                            <button
                                onClick={() => navigate('/peminjam/alat')}
                                className="mt-4 btn btn-primary"
                            >
                                Pinjam Sekarang
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {loans.slice(0, 5).map((loan) => (
                                <div key={loan.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{loan.nama_alat}</p>
                                        <p className="text-xs text-gray-500">
                                            {loan.kode_peminjaman} • {new Date(loan.tanggal_pinjam).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                    <span className={`badge badge-${loan.status.toLowerCase()}`}>
                                        {loan.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default PeminjamDashboard;
