import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';
import { Request, Response, NextFunction } from 'express';

// Configure cloudinary
if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

const storage = multer.memoryStorage();
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, allowedMimeTypes.includes(file.mimetype));
  },
}); // 5MB, images only

export async function uploadToCloudinary(buffer: Buffer, folder: string = 'complaints'): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!env.CLOUDINARY_CLOUD_NAME) {
      reject(new Error('Cloudinary not configured'));
      return;
    }
    cloudinary.uploader.upload_stream(
      { folder: `campusphere/${folder}`, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      },
    ).end(buffer);
  });
}
