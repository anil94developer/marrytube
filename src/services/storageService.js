// Mock storage service - Replace with actual backend API calls
export const getStoragePlans = () => {
  return [
    {
      id: '1gb-monthly',
      storage: 1,
      price: 3,
      period: 'month',
      periodLabel: 'per month',
    },
    {
      id: '1gb-yearly',
      storage: 1,
      price: 30,
      period: 'year',
      periodLabel: 'per year',
    },
  ];
};

export const purchaseStorage = async (planData, userId) => {
  // Simulate API call
  // planData can be either:
  // - Old format: { planId: '1gb-monthly' }
  // - New format: { storage: 50, period: 'month', price: 150 }
  return new Promise((resolve) => {
    setTimeout(() => {
      // Update user storage in localStorage
      const currentStorage = JSON.parse(localStorage.getItem('userStorage') || '{}');
      
      let storageToAdd = 0;
      let message = 'Storage plan purchased successfully';
      
      // Handle new custom storage format
      if (planData.storage) {
        storageToAdd = planData.storage;
        message = `${planData.storage} GB storage purchased successfully`;
      } 
      // Handle old planId format (for backward compatibility)
      else if (planData.planId) {
        const plan = getStoragePlans().find(p => p.id === planData.planId);
        if (plan) {
          storageToAdd = plan.storage;
        }
      }
      
      const newTotal = (currentStorage[userId]?.totalStorage || 0) + storageToAdd;
      const newUsed = currentStorage[userId]?.usedStorage || 0;
      
      localStorage.setItem('userStorage', JSON.stringify({
        ...currentStorage,
        [userId]: {
          totalStorage: newTotal,
          usedStorage: newUsed,
          availableStorage: newTotal - newUsed,
        }
      }));
      
      resolve({
        success: true,
        message: message,
        storage: storageToAdd,
      });
    }, 1500);
  });
};

export const getUserStorage = async (userId) => {
  // Mock storage data - Replace with actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const storage = JSON.parse(localStorage.getItem('userStorage') || '{}');
      const userStorage = storage[userId] || {
        totalStorage: 1, // GB
        usedStorage: 0, // GB
        availableStorage: 1, // GB
      };
      resolve(userStorage);
    }, 500);
  });
};

export const updateStorageUsage = async (userId, sizeInGB) => {
  // Update storage usage after upload
  const storage = JSON.parse(localStorage.getItem('userStorage') || '{}');
  const userStorage = storage[userId] || {
    totalStorage: 1,
    usedStorage: 0,
    availableStorage: 1,
  };
  
  userStorage.usedStorage += sizeInGB;
  userStorage.availableStorage = userStorage.totalStorage - userStorage.usedStorage;
  
  localStorage.setItem('userStorage', JSON.stringify({
    ...storage,
    [userId]: userStorage,
  }));
  
  return userStorage;
};