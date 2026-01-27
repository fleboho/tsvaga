import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/items - Public endpoint for searching/filtering items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const q = searchParams.get('q') || undefined;
    const qMatchType = searchParams.get('qMatchType') || 'all'; // all, exact, any, none
    const category = searchParams.get('category') || undefined;
    const location = searchParams.get('location') || undefined;
    const documentNumber = searchParams.get('documentNumber') || undefined;
    const color = searchParams.get('color') || undefined;
    const status = searchParams.get('status') || 'AVAILABLE'; // all, AVAILABLE, RETURNED
    const issuingAuthority = searchParams.get('issuingAuthority') || undefined;
    const holderName = searchParams.get('holderName') || undefined;
    const documentYear = searchParams.get('documentYear') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // Validate pagination
    const validatedPage = Math.max(1, page);
    const validatedPageSize = Math.min(Math.max(1, pageSize), 100); // Cap at 100 items per page
    
    // Build where clause
    const where: any = {};
    
    // Status filter
    if (status !== 'all') {
      where.status = status;
    }
    
    // Search query with match type
    if (q) {
      if (qMatchType === 'exact') {
        // Exact phrase search
        where.OR = [
          { title: { equals: q, mode: 'insensitive' } },
          { description: { equals: q, mode: 'insensitive' } },
        ];
      } else if (qMatchType === 'any') {
        // Any word search (split by spaces and search for any)
        const words = q.split(/\s+/).filter(word => word.length > 0);
        if (words.length > 0) {
          where.OR = words.flatMap(word => [
            { title: { contains: word, mode: 'insensitive' } },
            { description: { contains: word, mode: 'insensitive' } },
          ]);
        }
      } else if (qMatchType === 'none') {
        // Exclude words (split by spaces and exclude all)
        const words = q.split(/\s+/).filter(word => word.length > 0);
        if (words.length > 0) {
          where.NOT = {
            OR: words.flatMap(word => [
              { title: { contains: word, mode: 'insensitive' } },
              { description: { contains: word, mode: 'insensitive' } },
            ]),
          };
        }
      } else {
        // Default: all words (split by spaces and search for all)
        const words = q.split(/\s+/).filter(word => word.length > 0);
        if (words.length > 0) {
          where.AND = words.flatMap(word => [
            {
              OR: [
                { title: { contains: word, mode: 'insensitive' } },
                { description: { contains: word, mode: 'insensitive' } },
              ],
            },
          ]);
        }
      }
      
      // Also search document fields when isDocument is true
      if (q) {
        const documentSearchClause = {
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
        };
        
        // Add document search to existing OR/AND clauses
        if (where.OR) {
          where.OR.push(documentSearchClause);
        } else if (where.AND) {
          // For AND queries, we need to handle document search differently
          // Create a new OR that includes both text search AND document search
          const textSearchClauses = where.AND;
          delete where.AND;
          where.OR = [
            { AND: textSearchClauses },
            documentSearchClause,
          ];
        } else {
          where.OR = [documentSearchClause];
        }
      }
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
    
    // Document number filter
    if (documentNumber) {
      where.documentNumber = {
        contains: documentNumber,
        mode: 'insensitive',
      };
    }
    
    // Color filter
    if (color) {
      where.color = {
        contains: color,
        mode: 'insensitive',
      };
    }
    
    // Additional document field filters
    if (issuingAuthority) {
      where.issuingAuthority = {
        contains: issuingAuthority,
        mode: 'insensitive',
      };
    }
    
    if (holderName) {
      where.holderName = {
        contains: holderName,
        mode: 'insensitive',
      };
    }
    
    if (documentYear) {
      where.documentYear = {
        contains: documentYear,
        mode: 'insensitive',
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
          color: true, // Include color field
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
