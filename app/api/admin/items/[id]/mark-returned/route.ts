import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// POST /api/admin/items/[id]/mark-returned - Mark item as returned (admin only)
export async function POST(
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
    
    // Check if item is already returned
    if (existingItem.status === 'RETURNED') {
      return NextResponse.json(
        { error: 'Item is already marked as returned' },
        { status: 400 }
      );
    }
    
    // Update item status to RETURNED
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        status: 'RETURNED',
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
      message: 'Item marked as returned successfully',
      item: updatedItem,
    });
    
  } catch (error) {
    console.error('Error marking item as returned:', error);
    
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