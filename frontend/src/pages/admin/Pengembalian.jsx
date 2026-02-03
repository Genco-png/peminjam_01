import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { pengembalianAPI, peminjamanAPI } from '../../services/api';
import { FiRotateCcw, FiSearch, FiAlertTriangle } from 'react-icons/fi';
import { format } from 'date-fns';

const PengembalianPage = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [dendaPreview, setDendaPreview] = useState(null);
    const [formData, setFormData] = useState({
        tanggal_kembali: format(new Date(), 'yyyy-MM-dd'),
        kondisi_alat: 'Baik',
        jumlah_kembali: '',
        keterangan: ''
    });

    useEffect(() => {
        fetchActiveLoans();
    }, []);

    const fetchActiveLoans = async () => {
        try {
            // Fetch loans with status 'Dipinjam' or 'Terlambat'
            const response = await peminjamanAPI.getAll({ status: 'Dipinjam' });
            const overdueResponse = await peminjamanAPI.getAll({ status: 'Terlambat' });
            setLoans([...response.data.data, ...overdueResponse.data.data]);
        } catch (error) {
            console.error('Error fetching loans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewDenda = async () => {
        if (!selectedLoan) return;
        try {
            const response = await pengembalianAPI.calculateDenda({
                peminjaman_id: selectedLoan.id,
                tanggal_kembali: formData.tanggal_kembali,
                kondisi_alat: formData.kondisi_alat
            });
            setDendaPreview(response.data.data);
        } catch (error) {
            console.error('Error calculating denda:', error);
        }
    };

    useEffect(() => {
        if (selectedLoan) {
            handlePreviewDenda();
        }
    }, [formData.tanggal_kembali, formData.kondisi_alat, selectedLoan]);

    const handleProcess = async (e) => {
        e.preventDefault();
        try {
            await pengembalianAPI.process({
                peminjaman_id: selectedLoan.id,
                ...formData
            });
            alert('Pengembalian berhasil diproses');
            setShowModal(false);
            fetchActiveLoans();
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal memproses pengembalian');
        }
    };

    const openModal = (loan) => {
        setSelectedLoan(loan);
        setFormData({ ...formData, jumlah_kembali: loan.jumlah });
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
                    <h1 className="text-3xl font-bold text-gray-900">Pengembalian</h1>
                    <p className="text-gray-600 mt-1">Proses pengembalian alat dan cek denda</p>
                </div>

                <div className="card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peminjam</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alat</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl Pinjam</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl Kembali (Rencana)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loans.map((loan) => (
                                    <tr key={loan.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{loan.nama_peminjam}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{loan.nama_alat} ({loan.jumlah})</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {format(new Date(loan.tanggal_pinjam), 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {format(new Date(loan.tanggal_kembali_rencana), 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`badge badge-${loan.status.toLowerCase()}`}>
                                                {loan.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => openModal(loan)}
                                                className="btn btn-primary flex items-center space-x-1 py-1"
                                            >
                                                <FiRotateCcw size={14} />
                                                <span>Proses</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Return Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto pt-10 pb-10">
                        <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                            <h2 className="text-xl font-bold mb-4">Proses Pengembalian</h2>
                            <form onSubmit={handleProcess} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg text-sm mb-4">
                                    <div>
                                        <p className="text-gray-500">Peminjam</p>
                                        <p className="font-medium">{selectedLoan?.nama_peminjam}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Alat</p>
                                        <p className="font-medium">{selectedLoan?.nama_alat} ({selectedLoan?.jumlah})</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kembali (Aktual)</label>
                                    <input 
                                        type="date" 
                                        value={formData.tanggal_kembali}
                                        onChange={(e) => setFormData({...formData, tanggal_kembali: e.target.value})}
                                        className="input" 
                                        required 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kondisi Alat</label>
                                    <select 
                                        value={formData.kondisi_alat}
                                        onChange={(e) => setFormData({...formData, kondisi_alat: e.target.value})}
                                        className="input"
                                    >
                                        <option value="Baik">Baik</option>
                                        <option value="Rusak Ringan">Rusak Ringan</option>
                                        <option value="Rusak Berat">Rusak Berat</option>
                                        <option value="Hilang">Hilang</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                                    <textarea 
                                        value={formData.keterangan}
                                        onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                                        className="input" 
                                        rows="2"
                                        placeholder="Keterangan tambahan..."
                                    />
                                </div>

                                {dendaPreview && (
                                    <div className={`p-4 rounded-lg ${dendaPreview.total_denda > 0 ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                                        <div className="flex items-center space-x-2 font-bold mb-2">
                                            <FiAlertTriangle />
                                            <span>Rincian Denda</span>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span>Terlambat: {dendaPreview.hari_terlambat} hari</span>
                                                <span className="font-mono">Rp {dendaPreview.denda_terlambat.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Kerusakan/Hilang:</span>
                                                <span className="font-mono">Rp {dendaPreview.denda_kerusakan.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between pt-1 border-t border-red-200 mt-1 font-bold">
                                                <span>Total Denda:</span>
                                                <span className="font-mono">Rp {dendaPreview.total_denda.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex space-x-2 pt-4">
                                    <button type="submit" className="btn btn-primary flex-1">Konfirmasi & Selesai</button>
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Batal</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default PengembalianPage;
