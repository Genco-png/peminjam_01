import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { alatAPI, kategoriAPI } from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload } from 'react-icons/fi';

const AlatManagement = () => {
    const [alat, setAlat] = useState([]);
    const [kategori, setKategori] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAlat, setEditingAlat] = useState(null);
    const [formData, setFormData] = useState({
        nama_alat: '',
        kategori_id: '',
        jumlah_total: '',
        harga_sewa: '',
        kondisi: 'Baik',
        deskripsi: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [alatRes, kategoriRes] = await Promise.all([
                alatAPI.getAll(),
                kategoriAPI.getAll()
            ]);
            setAlat(alatRes.data.data);
            setKategori(kategoriRes.data.data);
        } catch (error) {
            console.error('Error:', error);
            alert('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAlat) {
                await alatAPI.update(editingAlat.id, formData);
                alert('Alat berhasil diupdate');
            } else {
                await alatAPI.create(formData);
                alert('Alat berhasil ditambahkan');
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || 'Gagal menyimpan alat');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus alat ini?')) return;
        try {
            await alatAPI.delete(id);
            alert('Alat berhasil dihapus');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menghapus alat');
        }
    };

    const handleEdit = (item) => {
        setEditingAlat(item);
        setFormData({
            nama_alat: item.nama_alat,
            kategori_id: item.kategori_id,
            jumlah_total: item.jumlah_total,
            harga_sewa: item.harga_sewa,
            kondisi: item.kondisi,
            deskripsi: item.deskripsi || '',
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            nama_alat: '',
            kategori_id: '',
            jumlah_total: '',
            harga_sewa: '',
            kondisi: 'Baik',
            deskripsi: '',
        });
        setEditingAlat(null);
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await alatAPI.import(formData);
            alert(response.data.message);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal import file');
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

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Kelola Alat</h1>
                        <p className="text-gray-600 mt-1">Manajemen alat gunung</p>
                    </div>
                    <div className="flex space-x-2">
                        <label className="btn btn-secondary flex items-center space-x-2 cursor-pointer">
                            <FiUpload />
                            <span>Import Excel/CSV</span>
                            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
                        </label>
                        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary flex items-center space-x-2">
                            <FiPlus />
                            <span>Tambah Alat</span>
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Alat</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga Sewa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kondisi</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {alat.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{item.kode_alat}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{item.nama_alat}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{item.nama_kategori}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm">{item.jumlah_tersedia} / {item.jumlah_total}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">Rp {item.harga_sewa.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`badge ${item.kondisi === 'Baik' ? 'badge-selesai' : 'badge-terlambat'}`}>
                                                {item.kondisi}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800">
                                                    <FiEdit2 />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">{editingAlat ? 'Edit Alat' : 'Tambah Alat'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <FiX size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Alat</label>
                                    <input type="text" value={formData.nama_alat} onChange={(e) => setFormData({ ...formData, nama_alat: e.target.value })} className="input" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                    <select value={formData.kategori_id} onChange={(e) => setFormData({ ...formData, kategori_id: e.target.value })} className="input" required>
                                        <option value="">Pilih Kategori</option>
                                        {kategori.map((kat) => (
                                            <option key={kat.id} value={kat.id}>{kat.nama_kategori}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Total</label>
                                    <input type="number" value={formData.jumlah_total} onChange={(e) => setFormData({ ...formData, jumlah_total: e.target.value })} className="input" required min="1" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga Sewa (Rp)</label>
                                    <input type="number" value={formData.harga_sewa} onChange={(e) => setFormData({ ...formData, harga_sewa: e.target.value })} className="input" required min="0" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kondisi</label>
                                    <select value={formData.kondisi} onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })} className="input">
                                        <option value="Baik">Baik</option>
                                        <option value="Rusak Ringan">Rusak Ringan</option>
                                        <option value="Rusak Berat">Rusak Berat</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                    <textarea value={formData.deskripsi} onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })} className="input" rows="3" />
                                </div>

                                <div className="flex space-x-2 pt-4">
                                    <button type="submit" className="btn btn-primary flex-1">{editingAlat ? 'Update' : 'Simpan'}</button>
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

export default AlatManagement;
