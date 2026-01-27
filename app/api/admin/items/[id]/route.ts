import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// PATCH /api/admin/items/[id] - Update an item (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check if user is admin
  const errorResponse = await checkAdminAccess();
  if (errorResponse) return errorResponse;
  
  try {
    const { id } = await params;
    
    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
    });
    
    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    // Parse multipart form data
    const formData = await request.formData();
    
    // Extract fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const location = formData.get('location') as string;
    
    // Extract document fields
    const isDocument = formData.get('isDocument') === 'true' || formData.get('isDocument') === 'on';
    const documentNumber = formData.get('documentNumber') as string;
    const documentYear = formData.get('documentYear') as string;
    const issuingAuthority = formData.get('issuingAuthority') as string;
    const holderName = formData.get('holderName') as string;
    
    // Build update data
    const updateData: any = {};
    
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length < 3) {
        return NextResponse.json(
          { error: 'Title must be at least 3 characters' },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }
    
    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length < 10) {
        return NextResponse.json(
          { error: 'Description must be at least 10 characters' },
          { status: 400 }
        );
      }
      updateData.description = description.trim();
    }
    
    if (category !== undefined) {
      updateData.categoryId = category === '' ? null : category.trim();
    }
    
    if (location !== undefined) {
      updateData.locationId = location === '' ? null : location.trim();
    }
    
    // Document fields
    updateData.isDocument = isDocument;
    updateData.documentNumber = documentNumber || null;
    updateData.documentYear = documentYear || null;
    updateData.issuingAuthority = issuingAuthority || null;
    updateData.holderName = holderName || null;
    
    // Update item
    const updatedItem = await prisma.item.update({
      where: { id },
      data: updateData,
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
      message: 'Item updated successfully',
      item: updatedItem,
    });
    
  } catch (error) {
    console.error('Error updating item:', error);
    
    // Handle Prisma errors
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/items/[id] - Soft delete an item (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check if user is admin
  const errorResponse = await checkAdminAccess();
  if (errorResponse) return errorResponse;
  
  try {
    const { id } = await params;
    
    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
    });
    
    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    // Copy item to DeletedItem table
    await prisma.deletedItem.create({
      data: {
        id: existingItem.id,
        title: existingItem.title,
        description: existingItem.description,
        category: existingItem.categoryId,
        location: existingItem.locationId,
        status: existingItem.status,
        createdAt: existingItem.createdAt,
        updatedAt: existingItem.updatedAt,
        createdById: existingItem.createdById,
        isDocument: existingItem.isDocument,
        documentNumber: existingItem.documentNumber,
        documentYear: existingItem.documentYear,
        issuingAuthority: existingItem.issuingAuthority,
        holderName: existingItem.holderName,
      },
    });
    
    // Delete from Item table
    await prisma.item.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: 'Item deleted successfully (moved to archive)',
      deletedItemId: id,
    });
    
  } catch (error) {
    console.error('Error deleting item:', error);
    
    // Handle Prisma errors
    if (error instanceof Error && error.message.includes('Record to delete not found')) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
