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

/** Get folders for logged-in user. Optional parentFolderId (null/'' for root), userPlanId to filter by drive. */
export const getFoldersForUser = async (parentFolderId = undefined, userPlanId = undefined) => {
  try {
    const params = {};
    if (parentFolderId !== undefined) params.parentFolderId = parentFolderId === null || parentFolderId === '' ? '' : parentFolderId;
    if (userPlanId !== undefined) params.userPlanId = userPlanId === null || userPlanId === 'default' ? 'default' : userPlanId;
    const res = await axios.get('/media/folders/list', { params });
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('Failed to fetch folders:', error);
    return [];
  }
};

/** Create folder (name, planId, parentFolderId for nested). */
export const createFolderForUser = async (name, planId = null, parentFolderId = null) => {
  const folderName = typeof name === 'string' ? name.trim() : '';
  if (!folderName) throw new Error('Folder name is required');
  const body = { name: folderName, userPlanId: (planId && planId !== 'default') ? planId : null };
  if (parentFolderId !== undefined && parentFolderId !== null && parentFolderId !== '') body.parentFolderId = parentFolderId;
  const res = await axios.post('/media/folders', body);
  return res.data;
};

/** Update folder (rename and/or move to another parent). */
export const updateFolder = async (folderId, { name, parentFolderId }) => {
  const res = await axios.patch(`/media/folders/${folderId}`, { name, parentFolderId });
  return res.data;
};

/** Update media (rename and/or move to folder). */
export const updateMedia = async (mediaId, { name, folderId }) => {
  const res = await axios.patch(`/media/${mediaId}`, { name, folderId });
  return res.data;
};

/** Move media to another folder on same drive (single UPDATE, no copy). */
export const moveMediaToFolder = async (mediaId, folderId) => {
  const body = { folderId: folderId != null ? folderId : null };
  const res = await axios.patch(`/media/${mediaId}`, body);
  return res.data;
};

/** Copy media to same or another folder (same drive). */
export const copyMedia = async (mediaId, folderId = null) => {
  const res = await axios.post(`/media/${mediaId}/copy`, { folderId });
  return res.data;
};

/** Get media list for logged-in user. category, folderId, userPlanId ('default' or plan id). Pass folderId=null for root (sends '' so backend returns only root-level media). */
export const getMediaList = async (userId, category = null, folderId = null, userPlanId = null) => {
  try {
    const params = {};
    if (category) params.category = category;
    if (folderId !== undefined) params.folderId = folderId === null ? '' : folderId;
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

/** Move folder (and its media) to another drive. Optional toFolderId = parent folder on destination drive. */
export const moveFolderToDrive = async (folderId, toUserPlanId, toFolderId = null) => {
  const body = { toUserPlanId };
  if (toFolderId != null && toFolderId !== '') body.toFolderId = toFolderId;
  const res = await axios.post(`/media/folders/${folderId}/move-to-drive`, body);
  return res.data;
};

/** Copy folder (and its media) to another drive. Optional toFolderId = parent folder on destination drive. */
export const copyFolderToDrive = async (folderId, toUserPlanId, toFolderId = null) => {
  const body = { toUserPlanId };
  if (toFolderId != null && toFolderId !== '') body.toFolderId = toFolderId;
  const res = await axios.post(`/media/folders/${folderId}/copy-to-drive`, body);
  return res.data;
};

/** Create share link. resourceType: 'folder'|'media'|'drive'. For drive use resourceId 0 (default) or plan id. */
export const createShare = async (resourceType, resourceId, expiresInDays = null) => {
  const id = resourceType === 'drive' && (resourceId === 'default' || resourceId == null) ? 0 : resourceId;
  const body = { resourceType, resourceId: Number(id) };
  if (expiresInDays != null) body.expiresInDays = expiresInDays;
  const res = await axios.post('/share/', body);
  return res.data;
};

/** Resolve public share token (no auth). Optional folderId to open a subfolder of shared folder. */
export const getShareByToken = async (token, folderId = null) => {
  const params = folderId != null && folderId !== '' ? { folderId } : {};
  const res = await axios.get(`/share/${token}`, { params });
  return res.data;
};
