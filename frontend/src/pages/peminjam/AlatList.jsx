import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { alatAPI, peminjamanAPI, kategoriAPI } from '../../services/api';
import { FiPlus, FiInfo, FiSearch, FiShoppingCart, FiTrash2, FiX } from 'react-icons/fi';

const AlatListPage = () => {
    const [alat, setAlat] = useState([]);
    const [kategori, setKategori] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedKategori, setSelectedKategori] = useState('');
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);

    // Loan Request Data
    const [loanData, setLoanData] = useState({
        tanggal_pinjam: new Date().toISOString().split('T')[0],
        tanggal_kembali_rencana: '',
        keperluan: ''
    });

    useEffect(() => {
        fetchData();
        fetchKategori();
    }, []);

    const fetchData = async () => {
        try {
            const response = await alatAPI.getAll();
            setAlat(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchKategori = async () => {
        try {
            const response = await kategoriAPI.getAll();
            setKategori(response.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const addToCart = (item) => {
        const existingItem = cart.find(c => c.id === item.id);
        if (existingItem) {
            // Increase quantity
            if (existingItem.jumlah < item.jumlah_tersedia) {
                setCart(cart.map(c =>
                    c.id === item.id ? { ...c, jumlah: c.jumlah + 1 } : c
                ));
            } else {
                alert(`Maksimal ${item.jumlah_tersedia} unit tersedia`);
            }
        } else {
            // Add new item to cart
            setCart([...cart, { ...item, jumlah: 1 }]);
        }
        setShowCart(true);
    };

    const removeFromCart = (itemId) => {
        setCart(cart.filter(c => c.id !== itemId));
    };

    const updateCartQuantity = (itemId, newQuantity) => {
        const item = alat.find(a => a.id === itemId);
        if (newQuantity > item.jumlah_tersedia) {
            alert(`Maksimal ${item.jumlah_tersedia} unit tersedia`);
            return;
        }
        if (newQuantity < 1) {
            removeFromCart(itemId);
            return;
        }
        setCart(cart.map(c =>
            c.id === itemId ? { ...c, jumlah: newQuantity } : c
        ));
    };

    const handleCheckout = async (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert('Keranjang kosong! Tambahkan alat terlebih dahulu.');
            return;
        }

        try {
            const items = cart.map(item => ({
                alat_id: item.id,
                jumlah: item.jumlah
            }));

            await peminjamanAPI.create({
                items,
                ...loanData
            });

            alert(`Permintaan peminjaman ${cart.length} item berhasil dikirim! Silakan tunggu persetujuan petugas.`);
            setShowModal(false);
            setCart([]);
            setShowCart(false);
            setLoanData({
                tanggal_pinjam: new Date().toISOString().split('T')[0],
                tanggal_kembali_rencana: '',
                keperluan: ''
            });
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal mengirim permintaan');
        }
    };

    const filteredAlat = alat.filter(item =>
        item.nama_alat.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedKategori === '' || item.kategori_id === parseInt(selectedKategori))
    );

    const totalItems = cart.reduce((sum, item) => sum + item.jumlah, 0);

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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Daftar Alat</h1>
                        <p className="text-gray-600 mt-1">Pilih alat yang ingin Anda pinjam</p>
                    </div>
                    {cart.length > 0 && (
                        <button
                            onClick={() => setShowCart(!showCart)}
                            className="btn btn-primary flex items-center space-x-2 relative"
                        >
                            <FiShoppingCart />
                            <span>Keranjang ({totalItems})</span>
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari alat gunung..."
                            className="input pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="input md:w-48"
                        value={selectedKategori}
                        onChange={(e) => setSelectedKategori(e.target.value)}
                    >
                        <option value="">Semua Kategori</option>
                        {kategori.map(cat => <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAlat.map((item) => {
                        const inCart = cart.find(c => c.id === item.id);
                        return (
                            <div key={item.id} className="card flex flex-col hover:shadow-lg transition-shadow border border-transparent hover:border-primary-100">
                                <div className="flex-1">
                                    <span className={`badge mb-2 ${item.jumlah_tersedia > 0 ? 'badge-selesai' : 'badge-rejected'}`}>
                                        {item.jumlah_tersedia > 0 ? 'Tersedia' : 'Kosong'}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-900">{item.nama_alat}</h3>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">{item.nama_kategori}</p>
                                    <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px] mb-4">
                                        {item.deskripsi || 'Tidak ada deskripsi tersedia untuk alat ini.'}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="text-primary-700">
                                            <p className="text-xs uppercase font-bold text-gray-400">Harga Sewa</p>
                                            <p className="text-lg font-black">Rp {item.harga_sewa.toLocaleString()}/hari</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs uppercase font-bold text-gray-400">Tersedia</p>
                                            <p className="text-lg font-bold">{item.jumlah_tersedia} unit</p>
                                        </div>
                                    </div>
                                </div>
                                {inCart ? (
                                    <div className="mt-4 flex items-center space-x-2">
                                        <button
                                            onClick={() => updateCartQuantity(item.id, inCart.jumlah - 1)}
                                            className="btn btn-secondary px-3"
                                        >
                                            -
                                        </button>
                                        <span className="flex-1 text-center font-bold">{inCart.jumlah} di keranjang</span>
                                        <button
                                            onClick={() => updateCartQuantity(item.id, inCart.jumlah + 1)}
                                            className="btn btn-secondary px-3"
                                        >
                                            +
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => addToCart(item)}
                                        disabled={item.jumlah_tersedia === 0}
                                        className={`mt-4 btn flex items-center justify-center space-x-2 ${item.jumlah_tersedia > 0 ? 'btn-primary' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                                    >
                                        <FiPlus />
                                        <span>Tambah ke Keranjang</span>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Cart Sidebar */}
                {showCart && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end" onClick={() => setShowCart(false)}>
                        <div className="bg-white w-full max-w-md h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold">Keranjang ({totalItems} item)</h2>
                                    <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
                                        <FiX size={24} />
                                    </button>
                                </div>

                                {cart.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">Keranjang kosong</p>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            {cart.map((item) => (
                                                <div key={item.id} className="border rounded-lg p-3 flex items-center space-x-3">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-sm">{item.nama_alat}</h3>
                                                        <p className="text-xs text-gray-500">{item.nama_kategori}</p>
                                                        <p className="text-sm text-primary-700 font-bold">
                                                            Rp {(item.harga_sewa * item.jumlah).toLocaleString()}/hari
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => updateCartQuantity(item.id, item.jumlah - 1)}
                                                            className="btn btn-secondary px-2 py-1 text-sm"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="font-bold">{item.jumlah}</span>
                                                        <button
                                                            onClick={() => updateCartQuantity(item.id, item.jumlah + 1)}
                                                            className="btn btn-secondary px-2 py-1 text-sm"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => { setShowModal(true); setShowCart(false); }}
                                            className="btn btn-primary w-full"
                                        >
                                            Lanjut ke Checkout
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Checkout Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md my-8">
                            <h2 className="text-xl font-bold mb-4 text-primary-900">Ajukan Peminjaman</h2>

                            <div className="bg-primary-50 p-3 rounded-lg mb-4 max-h-48 overflow-y-auto">
                                <p className="font-bold text-primary-800 mb-2">{cart.length} Item dalam Keranjang:</p>
                                {cart.map((item, idx) => (
                                    <div key={idx} className="text-sm text-primary-700 flex justify-between">
                                        <span>• {item.nama_alat}</span>
                                        <span className="font-bold">{item.jumlah}x</span>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleCheckout} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rencana Kembali</label>
                                    <input
                                        type="date"
                                        className="input w-full"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={loanData.tanggal_kembali_rencana}
                                        onChange={(e) => setLoanData({ ...loanData, tanggal_kembali_rencana: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan/Keperluan</label>
                                    <textarea
                                        className="input w-full"
                                        rows="2"
                                        value={loanData.keperluan}
                                        onChange={(e) => setLoanData({ ...loanData, keperluan: e.target.value })}
                                        placeholder="Contoh: Pendakian Gn. Merbabu"
                                        required
                                    />
                                </div>
                                <div className="flex space-x-2 pt-4">
                                    <button type="submit" className="btn btn-primary flex-1">Kirim Permintaan</button>
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

export default AlatListPage;
