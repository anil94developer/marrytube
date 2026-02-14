// Admin service - use backend API via axios
import axios from 'axios';
import API_BASE_URL from '../config/api';

// Ensure axios baseURL and token header
axios.defaults.baseURL = API_BASE_URL;
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Get customers with pagination. Returns { data, total, page, limit, totalPages } */
export const getAdminStats = async () => {
  try {
    const res = await axios.get('/admin/stats');
    return res.data || {};
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return {};
  }
};

/** Get customers with pagination. Returns { data, total, page, limit, totalPages } */
export const getAllUsers = async (page = 1, limit = 50, search = '') => {
  try {
    const params = { page, limit };
    if (search.trim()) params.search = search.trim();
    const res = await axios.get('/admin/users', { params });
    if (res.data && typeof res.data.data !== 'undefined') {
      return { data: res.data.data, total: res.data.total || 0, page: res.data.page || 1, limit: res.data.limit || 50, totalPages: res.data.totalPages || 1 };
    }
    return { data: Array.isArray(res.data) ? res.data : [], total: 0, page: 1, limit: 50, totalPages: 1 };
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return { data: [], total: 0, page: 1, limit: 50, totalPages: 1 };
  }
};

export const getAdminUserById = async (id) => {
  try {
    const res = await axios.get(`/admin/users/${id}`);
    return res.data;
  } catch (error) {
    console.error('Failed to fetch user detail:', error);
    return null;
  }
};

/** Get studios with pagination. Returns { data, total, page, limit, totalPages } */
export const getAllStudios = async (page = 1, limit = 50, search = '') => {
  try {
    const params = { page, limit };
    if (search.trim()) params.search = search.trim();
    const res = await axios.get('/admin/allStudios', { params });
    if (res.data && typeof res.data.data !== 'undefined') {
      return { data: res.data.data, total: res.data.total || 0, page: res.data.page || 1, limit: res.data.limit || 50, totalPages: res.data.totalPages || 1 };
    }
    return { data: Array.isArray(res.data) ? res.data : [], total: 0, page: 1, limit: 50, totalPages: 1 };
  } catch (error) {
    console.error('Failed to fetch studios:', error);
    return { data: [], total: 0, page: 1, limit: 50, totalPages: 1 };
  }
};

export const approveStudio = async (studioId, isActive = true) => {
  try {
    const res = await axios.patch(`/admin/studios/${studioId}/approve`, { isActive });
    return res.data;
  } catch (error) {
    console.error('Failed to approve studio:', error);
    return { success: false };
  }
};

export const createStudio = async (data) => {
  try {
    const res = await axios.post('/admin/studios', data);
    return res.data;
  } catch (error) {
    console.error('Failed to create studio:', error);
    return { success: false };
  }
};

export const getStudioCount = async () => {
  try {
    const res = await axios.get('/admin/studios/count');
    return res.data && typeof res.data.count === 'number' ? res.data.count : 0;
  } catch (error) {
    console.error('Failed to fetch studio count:', error);
    return 0;
  }
};

/** Get media with pagination. Returns { data, total, page, limit, totalPages } */
export const getAllMedia = async (filters = {}) => {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const params = { page, limit };
    if (filters.category) params.category = filters.category;
    if (filters.userId) params.userId = filters.userId;
    if ((filters.search || '').trim()) params.search = filters.search.trim();

    const res = await axios.get('/admin/media', { params });
    if (res.data && typeof res.data.data !== 'undefined') {
      return { data: res.data.data, total: res.data.total || 0, page: res.data.page || 1, limit: res.data.limit || 50, totalPages: res.data.totalPages || 1 };
    }
    return { data: Array.isArray(res.data) ? res.data : [], total: 0, page: 1, limit: 50, totalPages: 1 };
  } catch (error) {
    console.error('Failed to fetch media:', error);
    return { data: [], total: 0, page: 1, limit: 50, totalPages: 1 };
  }
};

export const deleteMediaAdmin = async (mediaId) => {
  try {
    const res = await axios.delete(`/admin/media/${mediaId}`);
    return res.data;
  } catch (error) {
    console.error('Failed to delete media (admin):', error);
    return { success: false };
  }
};

export const blockMedia = async (mediaId, blocked = true) => {
  try {
    const res = await axios.patch(`/admin/media/${mediaId}/block`, { blocked });
    return res.data;
  } catch (error) {
    console.error('Failed to block/unblock media:', error);
    return { success: false };
  }
};

/** Returns array of storage rows with user { id, name, email } for AdminStorage */
export const getAllStorageUsage = async () => {
  try {
    const res = await axios.get('/admin/storage');
    if (Array.isArray(res.data)) return res.data;
    return [];
  } catch (error) {
    console.error('Failed to fetch storage usage:', error);
    return [];
  }
};

export const updateStoragePlan = async (planData) => {
  try {
    const res = await axios.post('/admin/plans', planData);
    return res.data;
  } catch (error) {
    console.error('Failed to update/create storage plan:', error);
    return { success: false };
  }
};

export const getPlans = async () => {
  try {
    const res = await axios.get('/admin/plans');
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    return [];
  }
};

export const getStudioClients = async (studioId) => {
  try {
    const res = await axios.get(`/admin/studios/${studioId}/clients`);
    return res.data; // { studio, clients }
  } catch (error) {
    console.error('Failed to fetch studio clients:', error);
    return { studio: null, clients: [] };
  }
};

/** Get admin-set commission per 1 GB (₹) for studio earnings */
export const getCommission = async () => {
  try {
    const res = await axios.get('/admin/commission');
    const val = res.data?.commissionPerGB;
    return typeof val === 'number' ? val : 0;
  } catch (error) {
    console.error('Failed to fetch commission:', error);
    return 0;
  }
};

/** Save commission per 1 GB (₹) */
export const saveCommission = async (commissionPerGB) => {
  try {
    const res = await axios.put('/admin/commission', { commissionPerGB });
    return res.data?.success === true ? res.data.commissionPerGB : null;
  } catch (error) {
    console.error('Failed to save commission:', error);
    return null;
  }
};

/** Get all withdraw (fund) requests for admin */
export const getAdminFundRequests = async () => {
  try {
    const res = await axios.get('/admin/fund-requests');
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('Failed to fetch fund requests:', error);
    return [];
  }
};

/** Approve withdraw request */
export const approveFundRequest = async (requestId, remarks = '') => {
  try {
    const res = await axios.patch(`/admin/fund-requests/${requestId}/approve`, { remarks });
    return res.data;
  } catch (error) {
    console.error('Failed to approve fund request:', error);
    return { success: false };
  }
};

/** Reject withdraw request (refunds studio wallet) */
export const rejectFundRequest = async (requestId, remarks = '') => {
  try {
    const res = await axios.patch(`/admin/fund-requests/${requestId}/reject`, { remarks });
    return res.data;
  } catch (error) {
    console.error('Failed to reject fund request:', error);
    return { success: false };
  }
};

/** Add fund to studio wallet (admin) */
export const addFundToStudio = async (studioId, amount) => {
  try {
    const res = await axios.post(`/admin/studios/${studioId}/add-fund`, { amount });
    return res.data;
  } catch (error) {
    console.error('Failed to add fund to studio:', error);
    return { success: false };
  }
};

