import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Upload an image to Cloudinary from a URL
 */
export async function uploadFromUrl(
  imageUrl: string,
  options?: {
    folder?: string;
    publicId?: string;
  },
): Promise<UploadResult> {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: options?.folder || "grading-system/students",
      public_id: options?.publicId,
      overwrite: true,
      transformation: [
        { width: 300, height: 300, crop: "fill", gravity: "face" },
        { quality: "auto" },
        { format: "webp" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Failed to upload image to Cloudinary:", error);
    throw error;
  }
}

/**
 * Upload an image buffer to Cloudinary
 */
export async function uploadFromBuffer(
  buffer: Buffer,
  options?: {
    folder?: string;
    publicId?: string;
  },
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options?.folder || "grading-system/students",
        public_id: options?.publicId,
        overwrite: true,
        transformation: [
          { width: 300, height: 300, crop: "fill", gravity: "face" },
          { quality: "auto" },
          { format: "webp" },
        ],
      },
      (error, result) => {
        if (error) {
          console.error("Failed to upload image to Cloudinary:", error);
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      },
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete image from Cloudinary:", error);
    throw error;
  }
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export default cloudinary;
