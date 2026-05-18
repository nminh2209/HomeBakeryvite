const CLOUDINARY_DEFAULTS = {
  cloudName: 'drifopwan',
  uploadPreset: 'bakery',
  folder: 'samples/ecommerce',
} as const;

function env(key: keyof ImportMetaEnv, fallback: string): string {
  const v = import.meta.env[key];
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : fallback;
}

/** Upload images to Cloudinary (unsigned preset). */
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = env('VITE_CLOUDINARY_CLOUD_NAME', CLOUDINARY_DEFAULTS.cloudName);
  const preset = env('VITE_CLOUDINARY_UPLOAD_PRESET', CLOUDINARY_DEFAULTS.uploadPreset);
  const folder = env('VITE_CLOUDINARY_FOLDER', CLOUDINARY_DEFAULTS.folder);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);
  formData.append('folder', folder);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Cloudinary upload failed');
  }

  const data = await response.json();
  return data.secure_url as string;
}
