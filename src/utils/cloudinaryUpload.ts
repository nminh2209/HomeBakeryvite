// src/utils/cloudinaryUpload.ts
// Utility to upload images to Cloudinary (unsigned)

export async function uploadToCloudinary(file: File): Promise<string> {
  const url = 'https://api.cloudinary.com/v1_1/drifopwan/image/upload';
  const preset = 'bakery'; // Your unsigned upload preset
  const folder = 'samples/ecommerce'; // Optional: folder in Cloudinary

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
