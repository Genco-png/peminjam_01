import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { laporanAPI } from '../../services/api';
import { FiDownload, FiFilter } from 'react-icons/fi';

const LaporanPage = () => {
    const [laporanType, setLaporanType] = useState('peminjaman');
    const [dateRange, setDateRange] = useState({
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchLaporan = async () => {
        setLoading(true);
        try {
            let response;
            if (laporanType === 'peminjaman') {
                response = await laporanAPI.getPeminjaman(dateRange);
                setData(response.data.data);
            } else if (laporanType === 'denda') {
                response = await laporanAPI.getDenda(dateRange);
                setData(response.data.data.laporan);
                setSummary(response.data.data.summary);
            } else {
                response = await laporanAPI.getAlatPopuler();
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching laporan:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLaporan();
    }, [laporanType]);

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Laporan</h1>
                        <p className="text-gray-600 mt-1">Cetak laporan dan statistik peminjaman</p>
                    </div>
                    <button className="btn btn-secondary flex items-center space-x-2" onClick={() => window.print()}>
                        <FiDownload />
                        <span>Cetak PDF</span>
                    </button>
                </div>

                <div className="card">
                    <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4 mb-6">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Laporan</label>
                            <select
                                value={laporanType}
                                onChange={(e) => setLaporanType(e.target.value)}
                                className="input"
                            >
                                <option value="peminjaman">Laporan Peminjaman</option>
                                <option value="denda">Laporan Denda</option>
                                <option value="alat_populer">Alat Paling Sering Dipinjam</option>
                            </select>
                        </div>
                        {laporanType !== 'alat_populer' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
                                    <input
                                        type="date"
                                        value={dateRange.start_date}
                                        onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                                    <input
                                        type="date"
                                        value={dateRange.end_date}
                                        onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </>
                        )}
                        <button onClick={fetchLaporan} className="btn btn-primary flex items-center justify-center space-x-2 px-6">
                            <FiFilter />
                            <span>Filter</span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            {laporanType === 'peminjaman' && (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Kode</th>
                                            <th className="px-4 py-2 text-left">Peminjam</th>
                                            <th className="px-4 py-2 text-left">Alat</th>
                                            <th className="px-4 py-2 text-left">Tgl Pinjam</th>
                                            <th className="px-4 py-2 text-left">Tgl Kembali</th>
                                            <th className="px-4 py-2 text-left">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {data.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 font-mono text-xs">{row.kode_peminjaman}</td>
                                                <td className="px-4 py-2">{row.nama_peminjam}</td>
                                                <td className="px-4 py-2">{row.nama_alat}</td>
                                                <td className="px-4 py-2">{new Date(row.tanggal_pinjam).toLocaleDateString()}</td>
                                                <td className="px-4 py-2">{new Date(row.tanggal_kembali_rencana).toLocaleDateString()}</td>
                                                <td className="px-4 py-2">{row.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {laporanType === 'denda' && (
                                <div>
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="bg-red-50 p-3 rounded-lg text-center">
                                            <p className="text-xs text-red-600 uppercase">Total Denda</p>
                                            <p className="font-bold text-red-900">Rp {summary?.total_denda.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-orange-50 p-3 rounded-lg text-center">
                                            <p className="text-xs text-orange-600 uppercase">Denda Terlambat</p>
                                            <p className="font-bold text-orange-900">Rp {summary?.total_denda_terlambat.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-purple-50 p-3 rounded-lg text-center">
                                            <p className="text-xs text-purple-600 uppercase">Denda Kerusakan</p>
                                            <p className="font-bold text-purple-900">Rp {summary?.total_denda_kerusakan.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Peminjam</th>
                                                <th className="px-4 py-2 text-left">Alat</th>
                                                <th className="px-4 py-2 text-right">Denda Terlambat</th>
                                                <th className="px-4 py-2 text-right">Denda Kerusakan</th>
                                                <th className="px-4 py-2 text-right font-bold">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {data.map((row, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2">{row.nama_peminjam}</td>
                                                    <td className="px-4 py-2">{row.nama_alat}</td>
                                                    <td className="px-4 py-2 text-right">Rp {row.denda.toLocaleString()}</td>
                                                    <td className="px-4 py-2 text-right">Rp {row.denda_kerusakan.toLocaleString()}</td>
                                                    <td className="px-4 py-2 text-right font-bold">Rp {row.total_denda.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {laporanType === 'alat_populer' && (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Nama Alat</th>
                                            <th className="px-4 py-2 text-left">Kategori</th>
                                            <th className="px-4 py-2 text-right">Total Pinjam</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {data.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 font-medium">{row.nama_alat}</td>
                                                <td className="px-4 py-2">{row.nama_kategori}</td>
                                                <td className="px-4 py-2 text-right">{row.total_pinjam} kali</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default LaporanPage;
