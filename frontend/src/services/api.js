import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// API endpoints
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
};

export const userAPI = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    getRoles: () => api.get('/users/roles'),
};

export const alatAPI = {
    getAll: (params) => api.get('/alat', { params }),
    getById: (id) => api.get(`/alat/${id}`),
    create: (data) => api.post('/alat', data),
    update: (id, data) => api.put(`/alat/${id}`, data),
    delete: (id) => api.delete(`/alat/${id}`),
    import: (formData) => api.post('/alat/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export const kategoriAPI = {
    getAll: () => api.get('/kategori'),
    getById: (id) => api.get(`/kategori/${id}`),
    create: (data) => api.post('/kategori', data),
    update: (id, data) => api.put(`/kategori/${id}`, data),
    delete: (id) => api.delete(`/kategori/${id}`),
};

export const peminjamanAPI = {
    getAll: (params) => api.get('/peminjaman', { params }),
    getById: (id) => api.get(`/peminjaman/${id}`),
    create: (data) => api.post('/peminjaman', data),
    approve: (id, data) => api.put(`/peminjaman/${id}/approve`, data),
    reject: (id, data) => api.put(`/peminjaman/${id}/reject`, data),
    getMyLoans: () => api.get('/peminjaman/my-loans'),
    updateOverdue: () => api.post('/peminjaman/update-overdue'),
};

export const pengembalianAPI = {
    getAll: () => api.get('/pengembalian'),
    getById: (id) => api.get(`/pengembalian/${id}`),
    process: (data) => api.post('/pengembalian', data),
    calculateDenda: (data) => api.post('/pengembalian/calculate-denda', data),
};

export const laporanAPI = {
    getPeminjaman: (params) => api.get('/laporan/peminjaman', { params }),
    getAlatPopuler: (params) => api.get('/laporan/alat-populer', { params }),
    getDenda: (params) => api.get('/laporan/denda', { params }),
    getDashboardStats: () => api.get('/laporan/dashboard-stats'),
    getLogAktivitas: (params) => api.get('/laporan/log-aktivitas', { params }),
};
