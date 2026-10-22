import axios from 'axios';
import { api } from './api';

export const MAX_IMAGE_MB = 8;
export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Uploads one image straight to Cloudinary.
 * 1. Ask our API for a signature (only staff can get one; the secret stays on the server).
 * 2. POST the file to Cloudinary with that signature.
 * Uses a bare axios call so our auth header is never sent to a third party.
 */
export async function uploadImage(file, { onProgress } = {}) {
  if (!ACCEPTED.includes(file.type)) throw new Error(`${file.name} isn’t a JPG, PNG, WebP or AVIF image`);
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`${file.name} is larger than ${MAX_IMAGE_MB} MB`);

  const { data } = await api.post('/uploads/signature');
  const sig = data.data;

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', sig.timestamp);
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);

  let res;
  try {
    res = await axios.post(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, form, {
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    });
  } catch (err) {
    // Show Cloudinary's own reason (e.g. a key without upload permission) instead of axios's generic text
    const reason = err.response?.data?.error?.message?.replace(/^\[[^\]]*\]\s*/, '');
    throw new Error(reason ? `Cloudinary refused the upload: ${reason}` : "The photo couldn't be uploaded. Check your connection and try again.");
  }
  return { url: res.data.secure_url, publicId: res.data.public_id, alt: '' };
}
