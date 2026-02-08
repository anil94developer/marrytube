// Media service - Replace with actual backend API calls
export const getMediaList = async (userId, category = null) => {
  // Mock media list - Replace with actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const media = JSON.parse(localStorage.getItem('userMedia') || '[]');
      let filteredMedia = media.filter(m => m.userId === userId);
      
      if (category) {
        filteredMedia = filteredMedia.filter(m => m.category === category);
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