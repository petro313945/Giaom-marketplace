import api from './api';

export interface UploadResponse {
  message: string;
  imageUrl: string;
  filename: string;
}

/**
 * Upload a single image file
 * @param file - The image file to upload
 * @returns Promise with upload response containing imageUrl
 */
export const uploadImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
