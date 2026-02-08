// Mock OTP service - Replace with actual backend API calls
export const sendOTP = async (identifier, type) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'OTP sent successfully' });
    }, 1000);
  });
};

export const verifyOTP = async (identifier, otp, type) => {
  // Simulate API call - In production, verify with backend
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (otp === '123456') {
        // Mock user data
        const user = {
          id: '1',
          email: type === 'email' ? identifier : null,
          mobile: type === 'mobile' ? identifier : null,
          name: 'User',
          alternatePhone: null,
        };
        resolve({ success: true, user });
      } else {
        reject({ success: false, message: 'Invalid OTP' });
      }
    }, 1000);
  });
};

export const changePhoneNumber = async (newPhone, otp) => {
  // Simulate API call
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (otp === '123456') {
        resolve({ success: true, message: 'Phone number changed successfully' });
      } else {
        reject({ success: false, message: 'Invalid OTP' });
      }
    }, 1000);
  });
};