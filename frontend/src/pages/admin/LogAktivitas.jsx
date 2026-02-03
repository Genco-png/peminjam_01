import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { laporanAPI } from '../../services/api';
import { FiSearch, FiClock } from 'react-icons/fi';

const LogAktivitasPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await laporanAPI.getLogAktivitas();
            setLogs(response.data.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.user_nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.detail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.aksi?.toLowerCase().includes(searchTerm.toLowerCase())
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

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Log Aktivitas</h1>
                    <p className="text-gray-600 mt-1">Rekam jejak tindakan pengguna dalam sistem</p>
                </div>

                <div className="card">
                    <div className="mb-6">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari aktivitas atau pengguna..."
                                className="input pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredLogs.map((log) => (
                            <div key={log.id} className="flex items-start space-x-4 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className={`p-2 rounded-full ${log.aksi === 'LOGIN' ? 'bg-green-100 text-green-600' :
                                        log.aksi === 'APPROVE' ? 'bg-blue-100 text-blue-600' :
                                            log.aksi === 'REJECT' ? 'bg-red-100 text-red-600' :
                                                'bg-gray-100 text-gray-600'
                                    }`}>
                                    <FiClock />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <p className="text-sm font-bold text-gray-900">{log.user_nama || 'System'}</p>
                                        <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">{log.detail}</p>
                                    <div className="flex mt-2 space-x-2">
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-200 text-gray-600 rounded uppercase">
                                            {log.aksi}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-primary-100 text-primary-600 rounded uppercase">
                                            TABEL: {log.tabel}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LogAktivitasPage;
