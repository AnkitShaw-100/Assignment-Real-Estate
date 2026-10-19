import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';

if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const UPLOAD_FOLDER = 'niwas/properties';

/**
 * Signed direct upload: the browser sends the file straight to Cloudinary
 * (no file bytes pass through our serverless function, which has a 4.5MB
 * body limit on Vercel), but only with a signature that our API issued.
 */
export function createUploadSignature() {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder: UPLOAD_FOLDER };
  const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET);
  return {
    ...params,
    signature,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
  };
}

export async function deleteImages(images = []) {
  if (!env.cloudinaryEnabled) return;
  const ids = images.map((i) => i.publicId).filter(Boolean);
  await Promise.all(ids.map((id) => cloudinary.uploader.destroy(id)));
}
