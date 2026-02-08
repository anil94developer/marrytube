// Media service - Replace with actual backend API calls
export const getMediaList = async (userId, category = null, folderId = null) => {
  // Mock media list - Replace with actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const media = JSON.parse(localStorage.getItem('userMedia') || '[]');
      let filteredMedia = media.filter(m => m.userId === userId);
      
      if (category) {
        filteredMedia = filteredMedia.filter(m => m.category === category);
      }
      
      if (folderId) {
        filteredMedia = filteredMedia.filter(m => m.folderId === folderId);
      } else if (folderId === '') {
        // Show only items without folder (root level)
        filteredMedia = filteredMedia.filter(m => !m.folderId || m.folderId === '');
      }
      
      // Sort by upload date (newest first)
      filteredMedia.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      
      resolve(filteredMedia);
    }, 500);
  });
};

export const saveMedia = async (mediaData) => {
  // Save to localStorage (in production, save to backend)
  const existingMedia = JSON.parse(localStorage.getItem('userMedia') || '[]');
  const newMedia = {
    id: Date.now().toString(),
    ...mediaData,
    uploadDate: new Date().toISOString(),
  };
  existingMedia.push(newMedia);
  localStorage.setItem('userMedia', JSON.stringify(existingMedia));
  return newMedia;
};

export const deleteMedia = async (mediaId) => {
  // Delete from localStorage (in production, delete from backend)
  const existingMedia = JSON.parse(localStorage.getItem('userMedia') || '[]');
  const filteredMedia = existingMedia.filter((m) => m.id !== mediaId);
  localStorage.setItem('userMedia', JSON.stringify(filteredMedia));
  return { success: true };
};

export const getMediaById = async (mediaId) => {
  const media = JSON.parse(localStorage.getItem('userMedia') || '[]');
  return media.find(m => m.id === mediaId) || null;
};

// Folder management functions
export const getFolders = async (userId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const folders = JSON.parse(localStorage.getItem('userFolders') || '[]');
      const userFolders = folders.filter(f => f.userId === userId);
      // Sort by creation date (newest first)
      userFolders.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
      resolve(userFolders);
    }, 300);
  });
};

export const createFolder = async (folderData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const folders = JSON.parse(localStorage.getItem('userFolders') || '[]');
      const newFolder = {
        id: Date.now().toString(),
        ...folderData,
        createdDate: new Date().toISOString(),
      };
      folders.push(newFolder);
      localStorage.setItem('userFolders', JSON.stringify(folders));
      resolve(newFolder);
    }, 300);
  });
};

export const deleteFolder = async (folderId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const folders = JSON.parse(localStorage.getItem('userFolders') || '[]');
      const filteredFolders = folders.filter(f => f.id !== folderId);
      localStorage.setItem('userFolders', JSON.stringify(filteredFolders));
      
      // Also remove folderId from media items in this folder
      const media = JSON.parse(localStorage.getItem('userMedia') || '[]');
      const updatedMedia = media.map(m => {
        if (m.folderId === folderId) {
          return { ...m, folderId: null };
        }
        return m;
      });
      localStorage.setItem('userMedia', JSON.stringify(updatedMedia));
      
      resolve({ success: true });
    }, 300);
  });
};