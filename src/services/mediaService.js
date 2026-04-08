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
    timeout: 10 * 60 * 1000,
  });
  return response.data;
};

const STUDIO_CHUNK_SIZE = 5 * 1024 * 1024;
const STUDIO_CHUNK_THRESHOLD = 10 * 1024 * 1024;
const STUDIO_PARALLEL_CHUNKS = 2;

const getStudioChunkUploadStatus = async (clientId, uploadId) => {
  const res = await axios.get(`/studio/clients/${clientId}/chunk-upload-status`, { params: { uploadId } });
  return res.data;
};

const uploadStudioChunk = async (clientId, uploadId, chunkIndex, totalChunks, chunkBlob, fileName, fileSize, mimeType, userPlanId, folderId) => {
  const form = new FormData();
  form.append('chunk', chunkBlob);
  form.append('uploadId', uploadId);
  form.append('chunkIndex', String(chunkIndex));
  form.append('totalChunks', String(totalChunks));
  form.append('fileName', fileName);
  form.append('fileSize', String(fileSize));
  form.append('mimeType', mimeType || 'application/octet-stream');
  if (userPlanId != null && userPlanId !== '') form.append('userPlanId', userPlanId);
  if (folderId != null && folderId !== '') form.append('folderId', folderId);
  await axios.post(`/studio/clients/${clientId}/upload-chunk`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 3 * 60 * 1000,
  });
};

const completeStudioChunkedUpload = async (clientId, uploadId) => {
  const res = await axios.post(`/studio/clients/${clientId}/complete-chunked-upload`, { uploadId }, {
    timeout: 15 * 60 * 1000,
  });
  return res.data;
};

const abortStudioChunkedUpload = async (clientId, uploadId) => {
  await axios.post(`/studio/clients/${clientId}/abort-chunked-upload`, { uploadId });
};

export const uploadMediaForClientSmart = async ({ clientId, file, userPlanId, folderId, onProgress, signal }) => {
  if (file.size <= STUDIO_CHUNK_THRESHOLD) {
    onProgress && onProgress({ percent: 0, loaded: 0, total: file.size });
    const result = await uploadMediaForClient(clientId, { file, userPlanId, folderId });
    onProgress && onProgress({ percent: 100, loaded: file.size, total: file.size });
    return result;
  }

  const totalChunks = Math.ceil(file.size / STUDIO_CHUNK_SIZE);
  const uploadId = `studio_chunk_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  let receivedChunks = [];
  try {
    const status = await getStudioChunkUploadStatus(clientId, uploadId);
    if (status.receivedChunks && status.receivedChunks.length > 0) receivedChunks = status.receivedChunks;
  } catch (_) {}

  const toUpload = [];
  for (let i = 0; i < totalChunks; i++) if (!receivedChunks.includes(i)) toUpload.push(i);

  const startTime = Date.now();
  let loadedBytes = Math.min(receivedChunks.length * STUDIO_CHUNK_SIZE, file.size);
  const report = () => {
    const percent = totalChunks ? Math.min(99, (receivedChunks.length / totalChunks) * 100) : 0;
    const elapsed = (Date.now() - startTime) / 1000;
    const speed = elapsed > 0 ? loadedBytes / elapsed : 0;
    const remaining = file.size - loadedBytes;
    const eta = speed > 0 ? remaining / speed : 0;
    onProgress && onProgress({ percent, loaded: loadedBytes, total: file.size, speed, eta });
  };
  report();

  for (let p = 0; p < toUpload.length; p += STUDIO_PARALLEL_CHUNKS) {
    if (signal?.aborted) {
      await abortStudioChunkedUpload(clientId, uploadId);
      throw new Error('Upload cancelled');
    }
    const batch = toUpload.slice(p, p + STUDIO_PARALLEL_CHUNKS);
    await Promise.all(batch.map(async (idx) => {
      const start = idx * STUDIO_CHUNK_SIZE;
      const end = Math.min(start + STUDIO_CHUNK_SIZE, file.size);
      const blob = file.slice(start, end);
      await uploadStudioChunk(clientId, uploadId, idx, totalChunks, blob, file.name, file.size, file.type || '', userPlanId, folderId);
      receivedChunks.push(idx);
      loadedBytes = Math.min(loadedBytes + (end - start), file.size);
      report();
    }));
  }

  onProgress && onProgress({ percent: 99, loaded: file.size, total: file.size });
  const result = await completeStudioChunkedUpload(clientId, uploadId);
  onProgress && onProgress({ percent: 100, loaded: file.size, total: file.size });
  return result;
};

/** Studio: folders for a client drive. parentFolderId null/undefined = root of that drive. */
export const getFolders = async (clientId, userPlanId, parentFolderId) => {
  try {
    const params = { clientId };
    if (userPlanId !== undefined && userPlanId !== null) {
      params.userPlanId = userPlanId === 'default' ? 'default' : userPlanId;
    }
    if (parentFolderId !== undefined) {
      params.parentFolderId = parentFolderId === null || parentFolderId === '' ? '' : parentFolderId;
    }
    const response = await axios.get(`/studio/clients/getFolders`, { params });
    if (response.data && response.data.success) {
      return response.data.folders;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch folders:', error);
    return [];
  }
};

export const createFolder = async ({ clientId, name, userPlanId, parentFolderId }) => {
  const body = {
    name,
    userPlanId: userPlanId || null,
  };
  if (parentFolderId !== undefined && parentFolderId !== null && parentFolderId !== '') {
    body.parentFolderId = parentFolderId;
  }
  const res = await axios.post(`/studio/clients/${clientId}/folders`, body);
  return res.data.folder;
};

/** Studio: cascade-delete folder (same as user panel). */
export const deleteStudioFolder = async (clientId, folderId) => {
  const res = await axios.delete(`/studio/clients/${clientId}/folders/${folderId}`);
  return res.data;
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

/** Server-paged media list (pass page>=1, limit; optional search, datePreset, sort). Default order DESC. */
export const getMediaListPaged = async (params = {}) => {
  try {
    const res = await axios.get('/media/list', { params });
    if (res.data && Array.isArray(res.data.data)) {
      return res.data;
    }
    return {
      data: Array.isArray(res.data) ? res.data : [],
      total: Array.isArray(res.data) ? res.data.length : 0,
      page: 1,
      limit: params.limit || 50,
      totalPages: 1,
    };
  } catch (error) {
    console.error('Failed to fetch paged media list:', error);
    return { data: [], total: 0, page: 1, limit: 50, totalPages: 1 };
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

const UPLOAD_REQUEST_TIMEOUT_MS = 10 * 60 * 1000; // 10 min for slow Backblaze

/** Direct multipart upload (logged-in user). FormData: media, userPlanId, folderId. */
export const uploadMediaForUser = async ({ file, userPlanId, folderId }) => {
  const formData = new FormData();
  formData.append('media', file);
  if (userPlanId !== undefined && userPlanId !== null) formData.append('userPlanId', userPlanId);
  if (folderId !== undefined && folderId !== null) formData.append('folderId', folderId);
  const res = await axios.post('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_REQUEST_TIMEOUT_MS,
  });
  return res.data;
};

// ---------- Chunked upload (1KB - 50GB): parallel chunks, resume, progress ----------
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk
const CHUNK_THRESHOLD = 10 * 1024 * 1024; // Use chunked upload when file > 10MB
const PARALLEL_CHUNKS = 2; // fewer parallel = less 500s under load

/** Use chunked upload for files > CHUNK_THRESHOLD, else regular upload. onProgress({ percent, loaded, total, speed, eta }) */
export const uploadMediaSmart = async ({ file, userPlanId, folderId, onProgress, signal }) => {
  if (file.size <= CHUNK_THRESHOLD) {
    if (onProgress) onProgress({ percent: 0, loaded: 0, total: file.size });
    const result = await uploadMediaForUser({ file, userPlanId, folderId });
    if (onProgress) onProgress({ percent: 100, loaded: file.size, total: file.size });
    return result;
  }
  return uploadLargeFileChunked({ file, userPlanId, folderId, onProgress, signal });
};

/** Get which chunks are already received (for resume). */
export const getChunkUploadStatus = async (uploadId) => {
  const res = await axios.get('/media/chunk-upload-status', { params: { uploadId } });
  return res.data;
};

const CHUNK_REQUEST_TIMEOUT_MS = 3 * 60 * 1000; // 3 min per chunk
const CHUNK_RETRY_ATTEMPTS = 4;
const CHUNK_RETRY_DELAY_MS = 2500;

/** Upload a single chunk (with retries and longer timeout). */
export const uploadChunk = async (uploadId, chunkIndex, totalChunks, chunkBlob, fileName, fileSize, mimeType, userPlanId, folderId) => {
  const form = new FormData();
  form.append('chunk', chunkBlob);
  form.append('uploadId', uploadId);
  form.append('chunkIndex', String(chunkIndex));
  form.append('totalChunks', String(totalChunks));
  form.append('fileName', fileName);
  form.append('fileSize', String(fileSize));
  form.append('mimeType', mimeType || 'application/octet-stream');
  if (userPlanId != null && userPlanId !== '') form.append('userPlanId', userPlanId);
  if (folderId != null && folderId !== '') form.append('folderId', folderId);
  let lastErr;
  for (let attempt = 1; attempt <= CHUNK_RETRY_ATTEMPTS; attempt++) {
    try {
      await axios.post('/media/upload-chunk', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: CHUNK_REQUEST_TIMEOUT_MS,
      });
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < CHUNK_RETRY_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, CHUNK_RETRY_DELAY_MS));
      }
    }
  }
  throw lastErr;
};

/** Complete chunked upload (merge + save). Long timeout for large files. */
export const completeChunkedUpload = async (uploadId) => {
  const res = await axios.post('/media/complete-chunked-upload', { uploadId }, {
    timeout: 15 * 60 * 1000, // 15 min
  });
  return res.data;
};

/** Abort chunked upload (cleanup server chunks). */
export const abortChunkedUpload = async (uploadId) => {
  await axios.post('/media/abort-chunked-upload', { uploadId });
};

/** Run full chunked upload with progress, resume, parallel chunks. */
export const uploadLargeFileChunked = async ({ file, userPlanId, folderId, onProgress, signal }) => {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `chunk_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  let receivedChunks = [];
  try {
    const status = await getChunkUploadStatus(uploadId);
    if (status.receivedChunks && status.receivedChunks.length > 0) receivedChunks = status.receivedChunks;
  } catch (_) {}
  const toUpload = [];
  for (let i = 0; i < totalChunks; i++) {
    if (receivedChunks.includes(i)) continue;
    toUpload.push(i);
  }
  const startTime = Date.now();
  let loadedBytes = receivedChunks.length * CHUNK_SIZE;
  if (loadedBytes >= file.size) loadedBytes = file.size - 1;
  const report = () => {
    const percent = totalChunks ? Math.min(99, (receivedChunks.length / totalChunks) * 100) : 0;
    const elapsed = (Date.now() - startTime) / 1000;
    const speed = elapsed > 0 ? loadedBytes / elapsed : 0;
    const remaining = file.size - loadedBytes;
    const eta = speed > 0 ? remaining / speed : 0;
    onProgress && onProgress({ percent, loaded: loadedBytes, total: file.size, speed, eta });
  };
  report();
  const uploadInParallel = async (indices) => {
    const promises = indices.map(async (idx) => {
      if (signal?.aborted) throw new Error('aborted');
      const start = idx * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const blob = file.slice(start, end);
      await uploadChunk(uploadId, idx, totalChunks, blob, file.name, file.size, file.type || '', userPlanId, folderId);
      receivedChunks.push(idx);
      loadedBytes = Math.min(loadedBytes + (end - start), file.size);
      report();
    });
    await Promise.all(promises);
  };
  for (let p = 0; p < toUpload.length; p += PARALLEL_CHUNKS) {
    if (signal?.aborted) {
      await abortChunkedUpload(uploadId);
      throw new Error('Upload cancelled');
    }
    const batch = toUpload.slice(p, p + PARALLEL_CHUNKS);
    await uploadInParallel(batch);
  }
  if (signal?.aborted) {
    await abortChunkedUpload(uploadId);
    throw new Error('Upload cancelled');
  }
  onProgress && onProgress({ percent: 99, loaded: file.size, total: file.size });
  await new Promise((r) => setTimeout(r, 800));
  const result = await completeChunkedUpload(uploadId);
  onProgress && onProgress({ percent: 100, loaded: file.size, total: file.size });
  return result;
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
