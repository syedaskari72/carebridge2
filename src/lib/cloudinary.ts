import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

export interface UploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  public_id?: string;
  overwrite?: boolean;
  transformation?: any[];
}

/**
 * Upload a file to Cloudinary
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const defaultOptions = {
      folder: 'carebridge',
      resource_type: 'auto' as const,
      overwrite: false,
    };

    const uploadOptions = { ...defaultOptions, ...options };

    // Convert Buffer to base64 data URL for Cloudinary
    const fileToUpload = Buffer.isBuffer(file)
      ? `data:application/octet-stream;base64,${file.toString('base64')}`
      : file;

    const result = await cloudinary.uploader.upload(fileToUpload, uploadOptions);

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

/**
 * Upload nurse documents to Cloudinary
 */
export async function uploadNurseDocument(
  file: Buffer,
  nurseId: string,
  documentType: string,
  fileName: string
): Promise<UploadResult> {
  const options: UploadOptions = {
    folder: `carebridge/nurses/${nurseId}/documents`,
    public_id: `${documentType}_${Date.now()}`,
    resource_type: 'auto',
    overwrite: false,
  };

  return uploadToCloudinary(file, options);
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  transformations: any[] = []
): string {
  const defaultTransformations = [
    { quality: 'auto' },
    { fetch_format: 'auto' },
  ];

  return cloudinary.url(publicId, {
    transformation: [...defaultTransformations, ...transformations],
  });
}

/**
 * Generate a signed upload URL for client-side uploads
 */
export function generateSignedUploadUrl(
  folder: string = 'carebridge',
  publicId?: string
): { url: string; signature: string; timestamp: number } {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const params: any = {
    timestamp,
    folder,
  };

  if (publicId) {
    params.public_id = publicId;
  }

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`,
    signature,
    timestamp,
  };
}

/**
 * Validate file type for document uploads
 */
export function validateDocumentFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload JPG, PNG, PDF, or DOC files only.',
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Please upload files smaller than 10MB.',
    };
  }

  return { isValid: true };
}

/**
 * Convert File to Buffer for server-side upload
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export default cloudinary;
