import { NextRequest } from 'next/server';
import { utapi } from './uploadthing';

// Maximum file size: 4MB
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB in bytes

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Validate file
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds limit of 4MB. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Upload files to Uploadthing storage.
 * Returns array of uploaded file URLs (appUrl format).
 */
export async function uploadFiles(
  files: File[]
): Promise<string[]> {
  if (files.length === 0) return [];

  const results = await utapi.uploadFiles(files);

  const resultArray = Array.isArray(results) ? results : [results];

  return resultArray.map((result) => {
    if (result.error) {
      console.error('Upload failed for file:', result.error.message);
      throw new Error(`Upload failed: ${result.error.message}`);
    }
    // Use ufsUrl which is the persistent CDN URL
    return result.data.ufsUrl;
  });
}

/**
 * Delete a file from Uploadthing by its stored URL.
 * Extracts the file key from the URL.
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    // Extract file key from Uploadthing URL
    // URLs look like: https://vrhfwet42x.ufs.sh/f/{key}
    // or: https://ufs.sh/a/vrhfwet42x/{key}
    const fileKey = extractFileKey(url);
    if (!fileKey) {
      console.warn(`Could not extract file key from URL: ${url}`);
      return;
    }
    await utapi.deleteFiles(fileKey);
  } catch (error) {
    console.warn(`Failed to delete file ${url}:`, error);
  }
}

/**
 * Get the file key from an Uploadthing URL.
 */
export function extractFileKey(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Path format: /f/{key}
    if (urlObj.pathname.startsWith('/f/')) {
      return urlObj.pathname.split('/f/')[1];
    }
    // Subdomain format: {appId}.ufs.sh/f/{key}
    const parts = urlObj.pathname.split('/');
    if (parts.length >= 3 && parts[1] === 'f') {
      return parts.slice(2).join('/');
    }
    // Path format: /a/{appId}/{key}
    if (parts.length >= 4 && parts[1] === 'a') {
      return parts.slice(3).join('/');
    }
    console.warn(`Unrecognized Uploadthing URL format: ${url}`);
    return null;
  } catch {
    return null;
  }
}

// Parse multipart form data
export async function parseMultipartFormData(
  request: NextRequest
): Promise<FormData> {
  return await request.formData();
}

// Extract files and fields from form data
export function extractFilesAndFields(formData: FormData): {
  fields: Record<string, string>;
  files: File[];
} {
  const fields: Record<string, string> = {};
  const files: File[] = [];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      files.push(value);
    } else if (typeof value === 'string') {
      fields[key] = value;
    }
  }

  return { fields, files };
}

// Validate maximum number of images (max 3)
export function validateImageCount(
  existingCount: number,
  newCount: number
): { valid: boolean; error?: string } {
  const total = existingCount + newCount;

  if (total > 3) {
    return {
      valid: false,
      error: `Maximum 3 images allowed per item. Currently have ${existingCount}, trying to add ${newCount}.`,
    };
  }

  return { valid: true };
}
