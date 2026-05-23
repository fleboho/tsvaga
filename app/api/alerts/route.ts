import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { createAlertSchema } from '@/lib/alert-schemas';

// GET /api/alerts - Get all alerts for the current user
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // Validate pagination
    const validatedPage = Math.max(1, page);
    const validatedPageSize = Math.min(Math.max(1, pageSize), 100);
    
    // Build where clause - only get alerts for the current user
    const where = {
      userId: user.id,
    };
    
    // Execute query with pagination
    const [alerts, totalCount] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (validatedPage - 1) * validatedPageSize,
        take: validatedPageSize,
      }),
      prisma.alert.count({ where }),
    ]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validatedPageSize);
    const hasNextPage = validatedPage < totalPages;
    const hasPreviousPage = validatedPage > 1;
    
    return NextResponse.json({
      alerts,
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
    console.error('Error fetching alerts:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/alerts - Create a new alert for the current user
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createAlertSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }
    
    const { 
      keywords, 
      categoryId, 
      location,
      isDocument,
      documentNumber,
      documentYear,
      issuingAuthority,
      holderName,
      color
    } = validationResult.data;
    
    // Check if category exists if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId, isActive: true },
      });
      
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found or inactive' },
          { status: 404 }
        );
      }
    }
    
    // Handle location - find or create if provided
    let locationIdToUse: string | null = null;
    if (location) {
      // Try to find existing active location
      const existingLocation = await prisma.location.findFirst({
        where: { 
          name: location,
          isActive: true 
        },
      });
      
      if (existingLocation) {
        locationIdToUse = existingLocation.id;
      } else {
        // Create new location (inactive by default for user-created locations)
        const newLocation = await prisma.location.create({
          data: {
            name: location,
            isActive: false, // User-created locations are inactive by default
          },
        });
        locationIdToUse = newLocation.id;
      }
    }
    
    // Create the alert
    const alert = await prisma.alert.create({
      data: {
        keywords,
        categoryId: categoryId || null,
        locationId: locationIdToUse,
        userId: user.id,
        isDocument: isDocument || false,
        documentNumber: documentNumber || null,
        documentYear: documentYear || null,
        issuingAuthority: issuingAuthority || null,
        holderName: holderName || null,
        color: color || null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(
      { 
        message: 'Alert created successfully',
        alert,
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error creating alert:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Handle unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Alert with similar criteria already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}