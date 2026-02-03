import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { kategoriAPI } from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

const KategoriManagement = () => {
    const [kategori, setKategori] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingKategori, setEditingKategori] = useState(null);
    const [formData, setFormData] = useState({ nama_kategori: '', deskripsi: '' });

    useEffect(() => {
        fetchKategori();
    }, []);

    const fetchKategori = async () => {
        try {
            const response = await kategoriAPI.getAll();
            setKategori(response.data.data);
        } catch (error) {
            console.error('Error:', error);
            alert('Gagal memuat data kategori');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingKategori) {
                await kategoriAPI.update(editingKategori.id, formData);
                alert('Kategori berhasil diupdate');
            } else {
                await kategoriAPI.create(formData);
                alert('Kategori berhasil ditambahkan');
            }
            setShowModal(false);
            resetForm();
            fetchKategori();
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menyimpan kategori');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin ingin menghapus kategori ini?')) return;
        try {
            await kategoriAPI.delete(id);
            alert('Kategori berhasil dihapus');
            fetchKategori();
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal menghapus kategori');
        }
    };

    const handleEdit = (item) => {
        setEditingKategori(item);
        setFormData({ nama_kategori: item.nama_kategori, deskripsi: item.deskripsi || '' });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ nama_kategori: '', deskripsi: '' });
        setEditingKategori(null);
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
                        <h1 className="text-3xl font-bold text-gray-900">Kelola Kategori</h1>
                        <p className="text-gray-600 mt-1">Manajemen kategori alat</p>
                    </div>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary flex items-center space-x-2">
                        <FiPlus />
                        <span>Tambah Kategori</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kategori.map((item) => (
                        <div key={item.id} className="card hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">{item.nama_kategori}</h3>
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800">
                                        <FiEdit2 />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">{item.deskripsi || 'Tidak ada deskripsi'}</p>
                        </div>
                    ))}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">{editingKategori ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                    <FiX size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                                    <input type="text" value={formData.nama_kategori} onChange={(e) => setFormData({ ...formData, nama_kategori: e.target.value })} className="input" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                    <textarea value={formData.deskripsi} onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })} className="input" rows="3" />
                                </div>

                                <div className="flex space-x-2 pt-4">
                                    <button type="submit" className="btn btn-primary flex-1">{editingKategori ? 'Update' : 'Simpan'}</button>
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

export default KategoriManagement;
