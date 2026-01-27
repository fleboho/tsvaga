import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

// POST /api/admin/items/[id]/images - Add images to existing item (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check if user is admin
  const errorResponse = await checkAdminAccess();
  if (errorResponse) return errorResponse;
  
  try {
    const { id: itemId } = await params;
    
    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    });
    
    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    // Parse multipart form data
    const formData = await request.formData();
    
    // Get image files
    const imageFiles: File[] = [];
    for (let i = 0; i < 3; i++) {
      const file = formData.get(`images[${i}]`) as File | null;
      if (file && file.size > 0) {
        imageFiles.push(file);
      }
    }
    
    // Check if adding images would exceed limit
    const currentImageCount = existingItem.imageUrls.length;
    if (currentImageCount + imageFiles.length > 3) {
      return NextResponse.json(
        { 
          error: `Maximum 3 images allowed per item. Currently have ${currentImageCount}, trying to add ${imageFiles.length}.`,
        },
        { status: 400 }
      );
    }
    
    // Upload new images
    const newImageUrls: string[] = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      
      // Validate file
      if (file.size > 4 * 1024 * 1024) {
        return NextResponse.json(
          { error: `Image ${i + 1} exceeds 4MB size limit` },
          { status: 400 }
        );
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Image ${i + 1} must be JPEG, PNG, or WebP` },
          { status: 400 }
        );
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10);
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `item-${itemId}-${timestamp}-${random}.${extension}`;
      
      // Save file
      const uploadDir = `${process.cwd()}/public/uploads/items`;
      const filePath = `${uploadDir}/${filename}`;
      
      // Ensure directory exists
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(filePath, buffer);
      
      // Store relative path
      newImageUrls.push(`/uploads/items/${filename}`);
    }
    
    // Update item with new image URLs
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        imageUrls: [...existingItem.imageUrls, ...newImageUrls],
      },
      include: {
        createdBy: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      message: 'Images added successfully',
      item: updatedItem,
      addedCount: newImageUrls.length,
    });
    
  } catch (error) {
    console.error('Error adding images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}