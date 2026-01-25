import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// PATCH /api/admin/items/[id] - Update an item (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if user is admin
  const errorResponse = await checkAdminAccess();
  if (errorResponse) return errorResponse;
  
  try {
    const id = params.id;
    const body = await request.json();
    
    // Validate required fields
    const { title, description, category, location } = body;
    
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
      updateData.category = category === '' ? null : category.trim();
    }
    
    if (location !== undefined) {
      updateData.location = location === '' ? null : location.trim();
    }
    
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
  { params }: { params: { id: string } }
) {
  // Check if user is admin
  const errorResponse = await checkAdminAccess();
  if (errorResponse) return errorResponse;
  
  try {
    const id = params.id;
    
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
        category: existingItem.category,
        location: existingItem.location,
        status: existingItem.status,
        createdAt: existingItem.createdAt,
        updatedAt: existingItem.updatedAt,
        createdById: existingItem.createdById,
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
