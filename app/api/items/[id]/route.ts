import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/items/[id] - Public endpoint for getting a single item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const item = await prisma.item.findUnique({
      where: {
        id,
        status: 'AVAILABLE', // Only return available items
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
        status: true,
        imageUrls: true,
        createdAt: true,
        updatedAt: true,
        // Don't include createdBy for public endpoint
      },
    });
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found or not available' },
        { status: 404 }
      );
    }
    
    // Transform item to flatten category and location
    const transformedItem = {
      ...item,
      category: item.category?.name || null,
      location: item.location?.name || null,
    };
    
    return NextResponse.json({ item: transformedItem });
    
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}