
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
  if (filters.page != null) params.page = filters.page;
  if (filters.limit != null) params.limit = filters.limit;
  if (filters.sort) params.sort = filters.sort;
  const res = await axios.get('/studio/clients', { params });
  const d = res.data;
  if (d && Array.isArray(d.data)) {
    return d;
  }
  if (Array.isArray(d)) {
    return { data: d, total: d.length, page: 1, limit: d.length, totalPages: 1 };
  }
  return { data: [], total: 0, page: 1, limit: 50, totalPages: 1 };
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

/** Cashfree order for studio purchasing a plan for a client. Returns paymentSessionId, orderId, returnUrl, cashfreeMode. */
export const createStudioClientPaymentOrder = async (clientId, planData, returnUrl) => {
  const body = {
    clientId: parseInt(clientId, 10),
    planId: planData.planId,
    returnUrl,
  };
  if (planData.storage != null) body.storage = planData.storage;
  if (planData.period) body.period = planData.period;
  const res = await axios.post('/storage/create-studio-client-order', body);
  const data = res.data;
  if (data && data.success) {
    return {
      success: true,
      orderId: data.orderId,
      paymentSessionId: data.paymentSessionId,
      returnUrl: data.returnUrl,
      cashfreeMode: data.cashfreeMode,
    };
  }
  throw new Error(data?.message || 'Failed to create payment order');
};

export const moveMediaBetweenPlans = async (clientId, fromUserPlanId, toUserPlanId, mediaIds = null, toFolderId = undefined) => {
  const body = { fromUserPlanId, toUserPlanId };
  if (Array.isArray(mediaIds) && mediaIds.length > 0) body.mediaIds = mediaIds;
  if (toFolderId !== undefined && toFolderId !== null && toFolderId !== '') {
    body.toFolderId = toFolderId;
  }
  const res = await axios.post(`/studio/clients/${clientId}/move-media`, body);
  return res.data;
};

/** Copy file(s) to another folder on the same drive or to another drive. Same drive: pass same from/to plan id + mediaIds. */
export const copyClientMediaBetweenPlans = async (clientId, fromUserPlanId, toUserPlanId, mediaIds = null, toFolderId = undefined) => {
  const body = { fromUserPlanId, toUserPlanId };
  if (Array.isArray(mediaIds) && mediaIds.length > 0) body.mediaIds = mediaIds;
  if (toFolderId !== undefined && toFolderId !== null && toFolderId !== '') {
    body.toFolderId = toFolderId;
  }
  const res = await axios.post(`/studio/clients/${clientId}/copy-media`, body);
  return res.data;
};

/** Rename or reparent folder within the same drive */
export const updateClientFolder = async (clientId, folderId, body) => {
  const res = await axios.patch(`/studio/clients/${clientId}/folders/${folderId}`, body);
  return res.data;
};

/** Move folder (and files) to another drive; nested structure is flattened into one folder on the destination */
export const moveClientFolderToDrive = async (clientId, folderId, toUserPlanId, toFolderId = undefined) => {
  const body = { toUserPlanId };
  if (toFolderId !== undefined && toFolderId !== null && toFolderId !== '') body.toFolderId = toFolderId;
  const res = await axios.post(`/studio/clients/${clientId}/folders/${folderId}/move-to-drive`, body);
  return res.data;
};

/** Copy folder tree to destination drive (new folder + duplicated file rows; same drive allowed for duplicate-under-parent) */
export const copyClientFolderToDrive = async (clientId, folderId, toUserPlanId, toFolderId = undefined) => {
  const body = { toUserPlanId };
  if (toFolderId !== undefined && toFolderId !== null && toFolderId !== '') body.toFolderId = toFolderId;
  const res = await axios.post(`/studio/clients/${clientId}/folders/${folderId}/copy-to-drive`, body);
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

export const getClientDetails = async (clientId, options = {}) => {
  const params = {};
  if (options.includeMedia === false) params.includeMedia = 'false';
  const res = await axios.get(`/studio/clients/${clientId}/details`, { params });
  return res.data;
};

/** Server-paged media for studio drive (sort uploadDate DESC by default). */
export const getStudioClientMediaList = async (clientId, query = {}) => {
  const res = await axios.get(`/studio/clients/${clientId}/media`, { params: query });
  return res.data;
};

/** Delete a client's media (studio acting on behalf of client) */
export const deleteClientMedia = async (clientId, mediaId) => {
  const res = await axios.delete(`/studio/clients/${clientId}/media/${mediaId}`);
  return res.data;
};

/** Rename and/or move within same drive (PATCH body: name, folderId) */
export const updateClientMedia = async (clientId, mediaId, body) => {
  const res = await axios.patch(`/studio/clients/${clientId}/media/${mediaId}`, body);
  return res.data;
};

/** Duplicate media row to another folder on same drive (optional folderId for destination) */
export const copyClientMedia = async (clientId, mediaId, body = {}) => {
  const res = await axios.post(`/studio/clients/${clientId}/media/${mediaId}/copy`, body);
  return res.data;
};

/**
 * Create a public view-only share link for the client's drive, folder, or file.
 * Folder shares include all nested subfolders/files (browse via /share/:token?folderId=).
 * For default drive use resourceId 0; else use UserStoragePlan id.
 */
export const createClientShare = async (clientId, { resourceType, resourceId, expiresInDays = 30 }) => {
  const body = { resourceType, resourceId: Number(resourceId) };
  if (expiresInDays != null) body.expiresInDays = expiresInDays;
  const res = await axios.post(`/studio/clients/${clientId}/share`, body);
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
