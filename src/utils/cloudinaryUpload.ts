function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.`);
  }
  return value;
}

/** Upload images to Cloudinary (unsigned preset). */
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = requireEnv('VITE_CLOUDINARY_CLOUD_NAME');
  const preset = requireEnv('VITE_CLOUDINARY_UPLOAD_PRESET');
  const folder = import.meta.env.VITE_CLOUDINARY_FOLDER ?? 'bakery';

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
