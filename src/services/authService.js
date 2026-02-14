import axios from 'axios';
import API_BASE_URL from '../config/api';

// Set up axios defaults
axios.defaults.baseURL = API_BASE_URL;

// Add token to requests if available
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response handler: if token invalid/expired, clear session and redirect to login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    // Don't auto-redirect for auth endpoints (login/verify) so the UI can handle and display errors
    const requestUrl = error?.config?.url || '';
    if (requestUrl.includes('/auth')) {
      return Promise.reject(error);
    }

    if (status === 401 || status === 403) {
      // Read stored user first to decide redirect target
      let storedUser = null;
      try {
        storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      } catch (e) {
        storedUser = null;
      }

      // Clear local auth state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common.Authorization;

      // Redirect to appropriate login page
      // if (storedUser && storedUser.userType === 'studio') {
      //   window.location.href = '/studio/login';
      // } else {
      //   window.location.href = '/admin/login';
      // }
    }
    return Promise.reject(error);
  }
);

// Send OTP
export const sendOTP = async (identifier, type) => {
  try {
    const response = await axios.post('/auth/send-otp', {
      identifier,
      type,
    });
    return response.data;
  } catch (error) {
    console.error('Send OTP error:', error);
  const msg = error.response?.data?.message || 'Failed to send OTP';
  throw new Error(msg);
  }
};

// Verify OTP and login/register
export const verifyOTP = async (identifier, otp, type, userType = 'customer') => {
  try {
    const response = await axios.post('/auth/verify-otp', {
      identifier,
      otp,
      type,
      userType,
    });
    
    // Store token
    if (response.data.token) {
  localStorage.setItem('token', response.data.token);
  axios.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;
    }
    
    return response.data;
  } catch (error) {
    console.error('Verify OTP error:', error);
  const msg = error.response?.data?.message || 'Invalid OTP';
  throw new Error(msg);
  }
};

// Studio login (email/password)
export const studioLogin = async (email, password) => {
  try {
    const response = await axios.post('/auth/studio/login', {
      email,
      password,
    });
    
    // Store token
    if (response.data.token) {
  localStorage.setItem('token', response.data.token);
  axios.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;
    }
    
    return response.data;
  } catch (error) {
    console.error('Studio login error:', error);
  const msg = error.response?.data?.message || 'Invalid credentials';
  throw new Error(msg);
  }
};

// Admin login (email/password)
export const adminLogin = async (email, password) => {
  try {
    const response = await axios.post('/auth/admin/login', {
      email,
      password,
    });
    
    // Store token
    if (response.data.token) {
  localStorage.setItem('token', response.data.token);
  axios.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;
    }
    
    return response.data;
  } catch (error) {
    console.error('Admin login error:', error);
  const msg = error.response?.data?.message || 'Invalid credentials';
  throw new Error(msg);
  }
};

// Change phone number
export const changePhoneNumber = async (newPhone, otp) => {
  try {
    const response = await axios.post('/auth/change-phone', {
      newPhone,
      otp,
    });
    return response.data;
  } catch (error) {
    console.error('Change phone error:', error);
  const msg = error.response?.data?.message || 'Failed to change phone number';
  throw new Error(msg);
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await axios.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
  const msg = error.response?.data?.message || 'Failed to get user';
  throw new Error(msg);
  }
};
