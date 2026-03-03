import api from './api';

export interface Backup {
  filename: string;
  size: number;
  createdAt: string;
  downloadUrl: string;
}

export interface BackupListResponse {
  backups: Backup[];
  total: number;
}

export interface CreateBackupResponse {
  message: string;
  backup: {
    filename: string;
    path: string;
    size: number;
    timestamp: string;
    collections: { [key: string]: number };
    totalCollections: number;
    totalDocuments: number;
  };
}

export const createBackup = async (): Promise<CreateBackupResponse> => {
  const response = await api.post<CreateBackupResponse>('/backup');
  return response.data;
};

export const listBackups = async (): Promise<BackupListResponse> => {
  const response = await api.get<BackupListResponse>('/backup');
  return response.data;
};

export const downloadBackup = async (filename: string): Promise<void> => {
  const response = await api.get(`/backup/download/${filename}`, {
    responseType: 'blob',
  });
  
  // Create a blob URL and trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const deleteBackup = async (filename: string): Promise<void> => {
  await api.delete(`/backup/${filename}`);
};
