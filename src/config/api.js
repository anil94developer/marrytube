// API Configuration
// Local app -> local backend, live app -> Render backend
const LOCAL_API = 'http://localhost:5001/api/';
const LIVE_API = 'https://marrytube-backend.onrender.com/api/';

const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE_URL = isLocalHost ? LOCAL_API : LIVE_API;

/** Base URL for media (backend root, without /api) */
const MEDIA_BASE = API_BASE_URL.replace(/\/api\/?$/, '');

/** Resolve full URL for media. Handles both S3/B2 absolute URLs and local /upload/ paths. */
export const getMediaUrl = (url) => {
  if (url == null || url === '') return '';
  const s = typeof url === 'string' ? url.trim() : '';
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return `${MEDIA_BASE}${s.startsWith('/') ? '' : '/'}${s}`;
};

export default API_BASE_URL;

 