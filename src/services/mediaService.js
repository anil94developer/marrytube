import axios from 'axios';
import API_BASE_URL from '../config/api';

axios.defaults.baseURL = axios.defaults.baseURL || API_BASE_URL;

// —— Studio (client) APIs ——

export const uploadMediaForClient = async (clientId, { file, userPlanId, folderId }) => {
  const formData = new FormData();
  formData.append('media', file);
  if (userPlanId) formData.append('userPlanId', userPlanId);
  if (folderId) formData.append('folderId', folderId);
  const response = await axios.post(`/studio/clients/${clientId}/uploadMedia`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getFolders = async (clientId, userPlanId) => {
  try {
    const response = await axios.get(`/studio/clients/getFolders`, {
      params: { userPlanId, clientId },
    });
    if (response.data && response.data.success) {
      return response.data.folders;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch folders:', error);
    return [];
  }
};

export const createFolder = async ({ clientId, name, userPlanId }) => {
  const res = await axios.post(`/studio/clients/${clientId}/folders`, {
    name,
    userPlanId: userPlanId || null,
  });
  return res.data.folder;
};

// —— Customer (user) APIs ——

/** Get folders for logged-in user */
export const getFoldersForUser = async () => {
  try {
    const res = await axios.get('/media/folders/list');
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('Failed to fetch folders:', error);
    return [];
  }
};

/** Create folder for logged-in user (user panel). Same as studio: { name, planId }. planId = drive card id. */
export const createFolderForUser = async (name, planId = null) => {
  const folderName = typeof name === 'string' ? name.trim() : '';
  if (!folderName) throw new Error('Folder name is required');
  const body = { name: folderName, userPlanId: (planId && planId !== 'default') ? planId : null };
  const res = await axios.post('/media/folders', body);
  return res.data;
};

/** Get media list for logged-in user. category, folderId, userPlanId ('default' or plan id) */
export const getMediaList = async (userId, category = null, folderId = null, userPlanId = null) => {
  try {
    const params = {};
    if (category) params.category = category;
    if (folderId !== undefined && folderId !== null) params.folderId = folderId;
    if (userPlanId !== undefined && userPlanId !== null) params.userPlanId = userPlanId;
    const res = await axios.get('/media/list', { params });
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('Failed to fetch media list:', error);
    return [];
  }
};

/** Get single media by ID (logged-in user's media) */
export const getMediaById = async (mediaId) => {
  try {
    const res = await axios.get(`/media/${mediaId}`);
    return res.data || null;
  } catch (error) {
    console.error('Failed to fetch media:', error);
    return null;
  }
};

/** Delete media (logged-in user's media) */
export const deleteMedia = async (mediaId) => {
  const res = await axios.delete(`/media/${mediaId}`);
  return res.data || { success: true };
};

/** Direct multipart upload (logged-in user). FormData: media, userPlanId, folderId. */
export const uploadMediaForUser = async ({ file, userPlanId, folderId }) => {
  const formData = new FormData();
  formData.append('media', file);
  if (userPlanId !== undefined && userPlanId !== null) formData.append('userPlanId', userPlanId);
  if (folderId !== undefined && folderId !== null) formData.append('folderId', folderId);
  const res = await axios.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

/** Get presigned upload URL (logged-in user). Optional userPlanId: 'default' or plan id. */
export const getUploadUrl = async (fileName, mimeType, size, userPlanId = null) => {
  const body = { fileName, mimeType, size: Number(size) };
  if (userPlanId !== undefined && userPlanId !== null) body.userPlanId = userPlanId;
  const res = await axios.post('/media/upload-url', body);
  const data = res.data || {};
  return {
    uploadURL: data.uploadURL,
    s3Key: data.s3Key,
    url: data.url,
  };
};

/** Save media record after upload (logged-in user). Optional userPlanId: 'default' or plan id. */
export const saveMedia = async (mediaData) => {
  const res = await axios.post('/media/save', {
    name: mediaData.name,
    url: mediaData.url,
    s3Key: mediaData.s3Key,
    category: mediaData.category || (mediaData.type?.startsWith('video/') ? 'video' : 'image'),
    size: mediaData.size,
    mimeType: mediaData.mimeType || mediaData.type,
    folderId: mediaData.folderId || null,
    userPlanId: mediaData.userPlanId ?? null,
  });
  return res.data;
};

export const deleteFolder = async (folderId) => {
  const res = await axios.delete(`/media/folders/${folderId}`);
  return res.data;
};
