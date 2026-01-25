import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

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
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds limit of 4MB. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

// Generate unique filename
export function generateFilename(
  originalName: string,
  itemId: string,
  index: number
): string {
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex');
  const extension = path.extname(originalName).toLowerCase();
  
  // Ensure extension is allowed
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(`Invalid file extension: ${extension}`);
  }
  
  return `item-${itemId}-${timestamp}-${random}${extension}`;
}

// Save file to disk
export async function saveFile(
  file: File,
  filename: string
): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'items');
  
  // Ensure directory exists
  await fs.mkdir(uploadDir, { recursive: true });
  
  const filePath = path.join(uploadDir, filename);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  await fs.writeFile(filePath, buffer);
  
  // Return relative path for database storage
  return `/uploads/items/${filename}`;
}

// Delete file from disk
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await fs.unlink(fullPath);
  } catch (error) {
    // File might not exist, that's okay
    console.warn(`Failed to delete file ${filePath}:`, error);
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