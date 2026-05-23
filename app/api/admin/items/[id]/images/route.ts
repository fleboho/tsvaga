import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
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
    
    // Upload new images to Uploadthing
    let newImageUrls: string[] = [];
    
    if (imageFiles.length > 0) {
      const { uploadFiles } = await import('@/lib/file-upload');
      newImageUrls = await uploadFiles(imageFiles);
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