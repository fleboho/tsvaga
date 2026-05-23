import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/items/filters - Public endpoint for getting active categories and locations
export async function GET() {
  try {
    // Get active categories from the Category table
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      select: {
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get active locations from the Location table
    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
      },
      select: {
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the results
    const categoryList = categories
      .map((category: { name: string }) => category.name)
      .filter((name: string | null): name is string => name !== null && name !== '');

    const locationList = locations
      .map((location: { name: string }) => location.name)
      .filter((name: string | null): name is string => name !== null && name !== '');

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
