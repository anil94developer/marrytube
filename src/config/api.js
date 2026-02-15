// API Configuration
// Default to port 5001 to avoid common macOS reserved conflicts on 5000
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://marrytube-backend.onrender.com/api/';

/** Base URL for media (backend root, without /api) */
const MEDIA_BASE = API_BASE_URL.replace(/\/api\/?$/, '');

/** Resolve full URL for media. Handles both S3 absolute URLs and local /upload/ paths. */
export const getMediaUrl = (url) => {
  if (!url) return url;
  if (typeof url === 'string' && url.startsWith('http')) return url;
  return `${MEDIA_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default API_BASE_URL;

