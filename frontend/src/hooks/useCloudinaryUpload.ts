import { useState } from 'react';

interface UploadState {
  url: string | null;
  loading: boolean;
  error: string | null;
}

export function useCloudinaryUpload() {
  const [state, setState] = useState<UploadState>({
    url: null,
    loading: false,
    error: null,
  });

  const uploadFile = async (file: File, uploadPreset: string): Promise<string> => {
    setState({ url: null, loading: true, error: null });
    
    // Cloudinary cloud name extracted from the logo asset
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'iqtgqdjs';
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to upload to Cloudinary');
      }

      const data = await response.json();
      const secureUrl = data.secure_url;
      
      setState({ url: secureUrl, loading: false, error: null });
      return secureUrl;
    } catch (err: any) {
      const errMsg = err.message || 'Something went wrong during the upload';
      setState({ url: null, loading: false, error: errMsg });
      throw new Error(errMsg);
    }
  };

  return {
    upload: uploadFile,
    ...state,
  };
}
