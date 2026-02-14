import axios from 'axios';
import API_BASE_URL from '../config/api';

axios.defaults.baseURL = axios.defaults.baseURL || API_BASE_URL;

/** Get storage plans (public) */
export const getStoragePlans = async () => {
  try {
    const res = await axios.get('/storage/plans');
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('Failed to fetch storage plans:', error);
    return [];
  }
};

/** Get dashboard data: storage + video/image counts (requires auth) */
export const getDashboard = async () => {
  try {
    const res = await axios.get('/storage/dashboard');
    return res.data || {};
  } catch (error) {
    console.error('Failed to fetch dashboard:', error);
    return {};
  }
};

/** Get my drives (purchased/default plans) for logged-in user — same shape as studio client plans */
export const getMyPlans = async () => {
  const res = await axios.get('/storage/my-plans');
  return Array.isArray(res.data) ? res.data : [];
};

/** Move media between drives. fromUserPlanId / toUserPlanId: 'default' or plan id */
export const moveMediaBetweenDrives = async (fromUserPlanId, toUserPlanId, mediaIds = null) => {
  const body = { fromUserPlanId: String(fromUserPlanId), toUserPlanId: String(toUserPlanId) };
  if (Array.isArray(mediaIds) && mediaIds.length > 0) body.mediaIds = mediaIds;
  const res = await axios.post('/storage/move-media', body);
  return res.data;
};

/** Get current user's storage (requires auth) */
export const getUserStorage = async (userId) => {
  try {
    const res = await axios.get('/storage/user');
    const s = res.data;
    if (!s) return { totalStorage: 1, usedStorage: 0, availableStorage: 1 };
    return {
      totalStorage: parseFloat(s.totalStorage) || 0,
      usedStorage: parseFloat(s.usedStorage) || 0,
      availableStorage: parseFloat(s.availableStorage) ?? (parseFloat(s.totalStorage) || 0) - (parseFloat(s.usedStorage) || 0),
    };
  } catch (error) {
    console.error('Failed to fetch user storage:', error);
    return { totalStorage: 1, usedStorage: 0, availableStorage: 1 };
  }
};

/** Purchase storage (requires auth). planData: { storage, period, price, planId } */
export const purchaseStorage = async (planData, userId) => {
  try {
    const body = {
      storage: planData.storage,
      period: planData.period,
      price: planData.price,
    };
    if (planData.planId != null) body.planId = planData.planId;
    const res = await axios.post('/storage/purchase', body);
    const data = res.data;
    if (data && data.success) {
      return { success: true, message: data.message || 'Storage purchased successfully', storage: data.storage };
    }
    throw new Error(data?.message || 'Purchase failed');
  } catch (error) {
    const msg = error.response?.data?.message || error.message || 'Purchase failed';
    throw new Error(msg);
  }
};

/** No longer used for customer – backend updates storage on upload/delete */
export const updateStorageUsage = async (userId, sizeInGB) => {
  return Promise.resolve();
};

export const updateStoragePlan = async (planData) => {
  return Promise.resolve({ success: true });
};
