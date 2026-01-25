import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/items/filters - Public endpoint for getting distinct categories and locations
export async function GET() {
  try {
    // Get distinct categories from items (excluding null/empty)
    const categories = await prisma.item.findMany({
      where: {
        AND: [
          { category: { not: null } },
          { category: { not: '' } },
        ],
      },
      distinct: ['category'],
      select: {
        category: true,
      },
      orderBy: {
        category: 'asc',
      },
    });

    // Get distinct locations from items (excluding null/empty)
    const locations = await prisma.item.findMany({
      where: {
        AND: [
          { location: { not: null } },
          { location: { not: '' } },
        ],
      },
      distinct: ['location'],
      select: {
        location: true,
      },
      orderBy: {
        location: 'asc',
      },
    });

    // Transform the results
    const categoryList = categories
      .map((item: { category: string | null }) => item.category)
      .filter((category): category is string => category !== null && category !== '');
    
    const locationList = locations
      .map((item: { location: string | null }) => item.location)
      .filter((location): location is string => location !== null && location !== '');

    return NextResponse.json({
      categories: categoryList,
      locations: locationList,
    });
    
  } catch (error) {
    console.error('Error fetching filters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
