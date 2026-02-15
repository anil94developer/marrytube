
import axios from 'axios';

// Fetch all purchased plans for a client (with auth)
export const getUserPlans = async (clientId) => {
  try {
    const res = await axios.get(`/studio/clients/${clientId}/plans`);
    return res.data;
  } catch (error) {
    console.error('getUserPlans error:', error);
    return [];
  }
};


// Studio service - use backend API endpoints under /studio

export const getStudioDashboard = async () => {
  const res = await axios.get('/studio/dashboard');
  return res.data;
};

export const getStudioClients = async (studioId, filters = {}) => {
  const params = {};
  if (filters.search) params.search = filters.search;
  const res = await axios.get('/studio/clients', { params });
  return res.data;
};

export const addStudioClient = async (clientData) => {
  const res = await axios.post('/studio/addClients', clientData);
  return res.data;
};

export const updateStudioClient = async (clientId, clientData) => {
  const res = await axios.patch(`/studio/clients/${clientId}`, clientData);
  return res.data;
};

export const deleteStudioClient = async (clientId) => {
  const res = await axios.delete(`/studio/clients/${clientId}`);
  return res.data;
};

export const purchaseSpaceForClient = async (clientId, planData) => {
  const res = await axios.post(`/studio/clients/${clientId}/purchase-space`, planData);
  return res.data;
};

export const purchasePlanForClient = async (clientId, data) => {
  const res = await axios.post(`/studio/clients/${clientId}/purchase-plan`, data);
  return res.data;
};

export const moveMediaBetweenPlans = async (clientId, fromUserPlanId, toUserPlanId, mediaIds = null) => {
  const body = { fromUserPlanId, toUserPlanId };
  if (Array.isArray(mediaIds) && mediaIds.length > 0) body.mediaIds = mediaIds;
  const res = await axios.post(`/studio/clients/${clientId}/move-media`, body);
  return res.data;
};

export const getStoragePlans = async (filters = {}) => {
  const params = {};
  if (filters.category) params.category = filters.category;
  const res = await axios.get('/storage/plans', { params });
  return res.data;
};

export const uploadMediaForClient = async (clientId, data) => {
  // If caller provides final media url and key, save media record
  if (data.url && data.key) {
    return saveMediaForClient(clientId, {
      name: data.name,
      url: data.url,
      s3Key: data.key || data.s3Key,
      category: data.category,
      size: data.size,
      mimeType: data.type || data.mimeType,
      folderId: data.folderId || null,
    });
  }

  // Otherwise request an upload URL from backend
  const res = await axios.post(`/studio/clients/${clientId}/upload-url`, data);
  return res.data;
};

export const saveMediaForClient = async (clientId, mediaData) => {
  const res = await axios.post(`/studio/clients/${clientId}/media`, mediaData);
  return res.data;
};

export const getClientDetails = async (clientId) => {
  const res = await axios.get(`/studio/clients/${clientId}/details`);
  return res.data;
};

/** Delete a client's media (studio acting on behalf of client) */
export const deleteClientMedia = async (clientId, mediaId) => {
  const res = await axios.delete(`/studio/clients/${clientId}/media/${mediaId}`);
  return res.data;
};

export const getFundRequests = async () => {
  const res = await axios.get('/studio/fund-requests');
  return res.data;
};

export const createFundRequest = async (requestData) => {
  const res = await axios.post('/studio/fund-requests', requestData);
  return res.data;
};

export const getBankDetails = async () => {
  const res = await axios.get('/studio/bank-details');
  return res.data;
};

export const saveBankDetails = async (data) => {
  const res = await axios.put('/studio/bank-details', data);
  return res.data;
};
