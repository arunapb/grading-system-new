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
import axios from "axios";

// ... existing imports ...

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
    // Try direct upload first with a longer timeout
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: options?.folder || "grading-system/students",
      public_id: options?.publicId,
      overwrite: true,
      timeout: 60000, // 60 seconds
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
  } catch (error: any) {
    console.warn(
      `Direct upload failed for ${imageUrl}, trying fallback...`,
      error.message,
    );

    // Fallback: Download image manually and upload as buffer
    try {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 60000, // 60s download timeout
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      return await uploadFromBuffer(Buffer.from(response.data), options);
    } catch (fallbackError) {
      console.error("Fallback upload also failed:", fallbackError);
      throw error; // Throw original error (or fallback error)
    }
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
