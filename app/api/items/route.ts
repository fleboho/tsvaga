import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/items - Public endpoint for searching/filtering items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const q = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;
    const location = searchParams.get('location') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // Validate pagination
    const validatedPage = Math.max(1, page);
    const validatedPageSize = Math.min(Math.max(1, pageSize), 100); // Cap at 100 items per page
    
    // Build where clause
    const where: any = {
      status: 'AVAILABLE', // Only show available items
    };
    
    // Search query (case-insensitive search on title, description, and document fields)
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        // Search document fields when isDocument is true
        {
          AND: [
            { isDocument: true },
            {
              OR: [
                { documentNumber: { contains: q, mode: 'insensitive' } },
                { documentYear: { contains: q, mode: 'insensitive' } },
                { issuingAuthority: { contains: q, mode: 'insensitive' } },
                { holderName: { contains: q, mode: 'insensitive' } },
              ],
            },
          ],
        },
      ];
    }
    
    // Category filter (exact match by category name)
    if (category) {
      where.category = {
        name: category,
      };
    }
    
    // Location filter (case-insensitive contains search on location name)
    if (location) {
      where.location = {
        name: {
          contains: location,
          mode: 'insensitive',
        },
      };
    }
    
    // Execute query with pagination
    const [items, totalCount] = await Promise.all([
      prisma.item.findMany({
        where,
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
          isDocument: true, // Include isDocument flag but not PII fields
          // Don't include createdBy or PII document fields for public endpoint
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (validatedPage - 1) * validatedPageSize,
        take: validatedPageSize,
      }),
      prisma.item.count({ where }),
    ]);
    
    // Transform items to flatten category and location
    const transformedItems = items.map((item: any) => ({
      ...item,
      category: item.category?.name || null,
      location: item.location?.name || null,
    }));
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validatedPageSize);
    const hasNextPage = validatedPage < totalPages;
    const hasPreviousPage = validatedPage > 1;
    
    return NextResponse.json({
      items: transformedItems,
      pagination: {
        page: validatedPage,
        pageSize: validatedPageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
    
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}