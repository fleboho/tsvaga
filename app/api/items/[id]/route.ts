import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/items/[id] - Public endpoint for getting a single item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const item = await prisma.item.findUnique({
      where: {
        id,
        status: 'AVAILABLE', // Only return available items
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        location: true,
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
    
    return NextResponse.json({ item });
    
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}