import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { peminjamanAPI } from '../../services/api';
import { FiCheck, FiX, FiInfo } from 'react-icons/fi';
import { format } from 'date-fns';

const PeminjamanPage = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [catatan, setCatatan] = useState('');

    useEffect(() => {
        fetchLoans();
        // Refresh every minute to update real-time late fees
        const interval = setInterval(fetchLoans, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchLoans = async () => {
        try {
            const response = await peminjamanAPI.getAll();
            setLoans(response.data.data);
        } catch (error) {
            console.error('Error fetching loans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            if (action === 'approve') {
                await peminjamanAPI.approve(id, { catatan });
            } else {
                await peminjamanAPI.reject(id, { catatan });
            }
            alert(`Peminjaman berhasil di-${action}`);
            setShowModal(false);
            setCatatan('');
            fetchLoans();
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal melakukan aksi');
        }
    };

    const openModal = (loan, action) => {
        setSelectedLoan({ ...loan, action });
        setShowModal(true);
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

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Peminjaman</h1>
                    <p className="text-gray-600 mt-1">Daftar permintaan dan riwayat peminjaman</p>
                </div>

                <div className="card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peminjam</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alat</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl Pinjam</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batas Kembali</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Denda</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loans.map((loan) => {
                                    const isActive = ['Approved', 'Dipinjam', 'Terlambat'].includes(loan.status);
                                    const currentLateFee = parseFloat(loan.denda_terlambat_sekarang) || 0;

                                    return (
                                        <tr
                                            key={loan.id}
                                            className={`hover:bg-gray-50 ${loan.is_overdue && isActive ? 'bg-red-50' : ''
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{loan.nama_peminjam}</div>
                                                <div className="text-xs text-gray-500">@{loan.username}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{loan.nama_alat}</div>
                                                <div className="text-xs text-gray-500">{loan.kode_alat}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{loan.jumlah}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {format(new Date(loan.tanggal_pinjam), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`text-sm font-medium ${loan.is_overdue && isActive ? 'text-red-600' : 'text-gray-900'
                                                    }`}>
                                                    {format(new Date(loan.tanggal_kembali_rencana), 'dd/MM/yyyy')}
                                                </div>
                                                {isActive && (
                                                    <div className={`text-xs ${loan.is_overdue
                                                        ? 'text-red-600 font-semibold'
                                                        : loan.hari_tersisa <= 3
                                                            ? 'text-yellow-600 font-semibold'
                                                            : 'text-gray-500'
                                                        }`}>
                                                        {loan.is_overdue
                                                            ? `Terlambat ${loan.hari_terlambat_sekarang} hari`
                                                            : `${loan.hari_tersisa} hari lagi`
                                                        }
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`badge badge-${loan.status.toLowerCase()}`}>
                                                    {loan.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {currentLateFee > 0 && (
                                                    <div className="text-sm font-semibold text-red-600">
                                                        Rp {currentLateFee.toLocaleString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {loan.status === 'Pending' && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => openModal(loan, 'approve')}
                                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                            title="Setujui"
                                                        >
                                                            <FiCheck size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => openModal(loan, 'reject')}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                            title="Tolak"
                                                        >
                                                            <FiX size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* Approve/Reject Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">
                                {selectedLoan?.action === 'approve' ? 'Setujui Peminjaman' : 'Tolak Peminjaman'}
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Anda akan {selectedLoan?.action === 'approve' ? 'menyetujui' : 'menolak'} permintaan peminjaman
                                <strong> {selectedLoan?.nama_alat}</strong> oleh <strong>{selectedLoan?.nama_peminjam}</strong>.
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                                <textarea
                                    value={catatan}
                                    onChange={(e) => setCatatan(e.target.value)}
                                    className="input"
                                    rows="3"
                                    placeholder="Masukkan alasan atau catatan..."
                                />
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleAction(selectedLoan.id, selectedLoan.action)}
                                    className={`btn flex-1 ${selectedLoan?.action === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                                >
                                    Konfirmasi
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default PeminjamanPage;
