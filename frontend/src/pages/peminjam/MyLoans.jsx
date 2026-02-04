import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { peminjamanAPI } from '../../services/api';
import { format } from 'date-fns';
import { FiAlertTriangle, FiClock, FiCheckCircle, FiRotateCcw } from 'react-icons/fi';

const MyLoansPage = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyLoans();
        // Refresh every minute to update real-time late fees
        const interval = setInterval(fetchMyLoans, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchMyLoans = async () => {
        try {
            const response = await peminjamanAPI.getMyLoans();
            setLoans(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestReturn = async (loanId) => {
        if (!confirm('Apakah Anda yakin ingin mengajukan pengembalian? Petugas akan segera memverifikasi permintaan Anda.')) {
            return;
        }

        try {
            await peminjamanAPI.requestReturn(loanId);
            alert('Permintaan pengembalian berhasil diajukan! Silakan tunggu verifikasi dari petugas.');
            fetchMyLoans(); // Refresh the list
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal mengajukan pengembalian');
        }
    };

    const getStatusColor = (loan) => {
        if (loan.status === 'Selesai') return 'gray';
        if (loan.is_overdue) return 'red';
        if (loan.hari_tersisa <= 3 && loan.hari_tersisa >= 0) return 'yellow';
        return 'green';
    };

    const getStatusBadge = (loan) => {
        const color = getStatusColor(loan);
        const colorClasses = {
            red: 'bg-red-100 text-red-800 border-red-200',
            yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            green: 'bg-green-100 text-green-800 border-green-200',
            gray: 'bg-gray-100 text-gray-800 border-gray-200'
        };

        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded border ${colorClasses[color]}`}>
                {loan.status}
            </span>
        );
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Peminjaman Saya</h1>
                    <p className="text-gray-600 mt-1">Status dan riwayat peminjaman Anda</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {loans.length === 0 ? (
                        <div className="card text-center py-10 text-gray-500">
                            Belum ada riwayat peminjaman.
                        </div>
                    ) : (
                        loans.map((loan) => {
                            const statusColor = getStatusColor(loan);
                            const isActive = ['Approved', 'Dipinjam', 'Terlambat'].includes(loan.status);
                            const currentLateFee = parseFloat(loan.denda_terlambat_sekarang) || 0;
                            const finalLateFee = parseFloat(loan.total_denda_final) || 0;

                            return (
                                <div
                                    key={loan.id}
                                    className={`card hover:shadow-md transition-shadow ${loan.is_overdue && isActive ? 'border-l-4 border-red-500' : ''
                                        }`}
                                >
                                    {/* Overdue Warning Banner */}
                                    {loan.is_overdue && isActive && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                                            <FiAlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-red-800">
                                                    TERLAMBAT {loan.hari_terlambat_sekarang} HARI!
                                                </p>
                                                <p className="text-xs text-red-700 mt-1">
                                                    Segera kembalikan alat untuk menghindari denda bertambah.
                                                    Denda saat ini: <span className="font-bold">Rp {currentLateFee.toLocaleString()}</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Return Request Pending Banner */}
                                    {loan.return_requested && isActive && (
                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-2">
                                            <FiClock className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-blue-800">
                                                    MENUNGGU VERIFIKASI PETUGAS
                                                </p>
                                                <p className="text-xs text-blue-700 mt-1">
                                                    Permintaan pengembalian Anda sedang diproses. Silakan serahkan alat ke petugas.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row justify-between">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                    {loan.kode_peminjaman}
                                                </span>
                                                {getStatusBadge(loan)}
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900">
                                                {loan.is_multi_item ? 'Peminjaman Multi-Item' : loan.items?.[0]?.nama_alat || loan.nama_alat}
                                            </h3>

                                            {/* Details for Multi-Item or Single Item */}
                                            {loan.is_multi_item && loan.items && loan.items.length > 0 ? (
                                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                                                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Item yang dipinjam:</p>
                                                    <ul className="space-y-1">
                                                        {loan.items.map((item, idx) => (
                                                            <li key={idx} className="text-sm flex justify-between text-gray-700">
                                                                <span>{item.nama_alat}</span>
                                                                <span className="font-semibold">{item.jumlah}x</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {loan.is_multi_item ? 'Memuat detail item...' : ''}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mt-3">
                                                <div>
                                                    <p className="uppercase font-bold text-gray-400">Total Unit</p>
                                                    <p className="font-semibold text-gray-700">
                                                        {loan.is_multi_item
                                                            ? loan.items?.reduce((sum, i) => sum + i.jumlah, 0) || '-'
                                                            : loan.jumlah} unit
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="uppercase font-bold text-gray-400">Pinjam</p>
                                                    <p className="font-semibold text-gray-700">{format(new Date(loan.tanggal_pinjam), 'dd/MM/yyyy')}</p>
                                                </div>
                                                <div>
                                                    <p className="uppercase font-bold text-gray-400">Batas Kembali</p>
                                                    <p className={`font-semibold ${loan.is_overdue && isActive ? 'text-red-600' : 'text-gray-700'
                                                        }`}>
                                                        {format(new Date(loan.tanggal_kembali_rencana), 'dd/MM/yyyy')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="uppercase font-bold text-gray-400">Total Sewa</p>
                                                    <p className="font-semibold text-primary-700">
                                                        Rp {loan.is_multi_item
                                                            ? (loan.items?.reduce((sum, i) => sum + (i.jumlah * i.harga_sewa), 0) || 0).toLocaleString()
                                                            : (loan.jumlah * (loan.items?.[0]?.harga_sewa || loan.harga_sewa || 0)).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Time Status and Actions */}
                                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                                {isActive && (
                                                    <div className="flex items-center space-x-2">
                                                        {loan.is_overdue ? (
                                                            <>
                                                                <FiAlertTriangle className="text-red-500" size={16} />
                                                                <span className="text-sm font-semibold text-red-600">
                                                                    Terlambat {loan.hari_terlambat_sekarang} hari
                                                                </span>
                                                            </>
                                                        ) : loan.hari_tersisa <= 3 ? (
                                                            <>
                                                                <FiClock className="text-yellow-500" size={16} />
                                                                <span className="text-sm font-semibold text-yellow-600">
                                                                    {loan.hari_tersisa === 0 ? 'Jatuh tempo hari ini!' : `${loan.hari_tersisa} hari lagi`}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FiCheckCircle className="text-green-500" size={16} />
                                                                <span className="text-sm font-semibold text-green-600">
                                                                    {loan.hari_tersisa} hari lagi
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Return Button for Peminjam */}
                                                {isActive && !loan.return_requested && (
                                                    <button
                                                        onClick={() => handleRequestReturn(loan.id)}
                                                        className="btn btn-primary py-1 px-4 text-sm bg-mountain-600 hover:bg-mountain-700 flex items-center gap-1 shadow-sm"
                                                    >
                                                        <FiRotateCcw size={14} className="rotate-180" />
                                                        Kembalikan
                                                    </button>
                                                )}
                                                {isActive && loan.return_requested && (
                                                    <span className="px-4 py-1 text-sm bg-blue-100 text-blue-700 rounded-md font-semibold">
                                                        Menunggu Verifikasi
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Late Fee Display */}
                                        {(currentLateFee > 0 || finalLateFee > 0) && (
                                            <div className="mt-4 md:mt-0 md:text-right flex flex-col justify-center md:ml-6">
                                                <p className="text-xs uppercase font-bold text-red-400">
                                                    {loan.status === 'Selesai' ? 'Denda Dibayar' : 'Denda Saat Ini'}
                                                </p>
                                                <p className="text-2xl font-black text-red-600">
                                                    Rp {(loan.status === 'Selesai' ? finalLateFee : currentLateFee).toLocaleString()}
                                                </p>
                                                {isActive && currentLateFee > 0 && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        +Rp 5.000/hari
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {loan.catatan_approval && (
                                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 border-l-4 border-gray-300">
                                            <strong>Catatan:</strong> {loan.catatan_approval}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default MyLoansPage;
