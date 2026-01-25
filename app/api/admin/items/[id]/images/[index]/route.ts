import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

// DELETE /api/admin/items/[id]/images/[index] - Delete specific image (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; index: string } }
) {
  // Check if user is admin
  const errorResponse = await checkAdminAccess();
  if (errorResponse) return errorResponse;
  
  try {
    const itemId = params.id;
    const index = parseInt(params.index);
    
    if (isNaN(index) || index < 0) {
      return NextResponse.json(
        { error: 'Invalid image index' },
        { status: 400 }
      );
    }
    
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
    
    // Check if index is valid
    if (index >= existingItem.imageUrls.length) {
      return NextResponse.json(
        { error: 'Image index out of range' },
        { status: 400 }
      );
    }
    
    // Get the image URL to delete
    const imageUrlToDelete = existingItem.imageUrls[index];
    
    // Delete file from filesystem
    if (imageUrlToDelete) {
      try {
        const fullPath = path.join(process.cwd(), 'public', imageUrlToDelete);
        await fs.unlink(fullPath);
      } catch (error) {
        // File might not exist, continue anyway
        console.warn(`Failed to delete file ${imageUrlToDelete}:`, error);
      }
    }
    
    // Remove image URL from array
    const updatedImageUrls = [...existingItem.imageUrls];
    updatedImageUrls.splice(index, 1);
    
    // Update item
    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        imageUrls: updatedImageUrls,
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
      message: 'Image deleted successfully',
      item: updatedItem,
      deletedIndex: index,
    });
    
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}