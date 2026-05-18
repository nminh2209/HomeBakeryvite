/** Public defaults for this app; override with VITE_CLOUDINARY_* at build time if needed. */
const CLOUDINARY_DEFAULTS = {
  cloudName: 'drifopwan',
  uploadPreset: 'bakery',
  folder: 'samples/ecommerce',
} as const;

function envOrDefault(key: keyof ImportMetaEnv, fallback: string): string {
  const v = import.meta.env[key];
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : fallback;
}

/** Upload images to Cloudinary (unsigned preset). */
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = envOrDefault('VITE_CLOUDINARY_CLOUD_NAME', CLOUDINARY_DEFAULTS.cloudName);
  const preset = envOrDefault('VITE_CLOUDINARY_UPLOAD_PRESET', CLOUDINARY_DEFAULTS.uploadPreset);
  const folder =
    (import.meta.env.VITE_CLOUDINARY_FOLDER as string | undefined)?.trim() || CLOUDINARY_DEFAULTS.folder;

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
