// API Configuration
// Default to port 5001 to avoid common macOS reserved conflicts on 5000
const API_BASE_URL =  'http://localhost:5001/api/';

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

 