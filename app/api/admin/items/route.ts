import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// GET /api/admin/items - Get all items (admin only)
export async function GET(request: NextRequest) {
  // Check if user is admin
  const errorResponse = await checkAdminAccess();
  if (errorResponse) return errorResponse;
  
  try {
    const items = await prisma.item.findMany({
      include: {
        createdBy: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/items - Create a new item with images (admin only)
export async function POST(request: NextRequest) {
  // Check if user is admin
  const errorResponse = await checkAdminAccess();
  if (errorResponse) return errorResponse;
  
  try {
    let title: string, description: string, category: string, location: string;
    let isDocument = false;
    let documentNumber = '';
    let documentYear = '';
    let issuingAuthority = '';
    let holderName = '';
    let imageFiles: File[] = [];

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Parse multipart form data (for image uploads)
      const formData = await request.formData();

      title = (formData.get('title') as string) || '';
      description = (formData.get('description') as string) || '';
      category = (formData.get('category') as string) || '';
      location = (formData.get('location') as string) || '';

      isDocument = formData.get('isDocument') === 'true' || formData.get('isDocument') === 'on';
      documentNumber = (formData.get('documentNumber') as string) || '';
      documentYear = (formData.get('documentYear') as string) || '';
      issuingAuthority = (formData.get('issuingAuthority') as string) || '';
      holderName = (formData.get('holderName') as string) || '';

      // Get image files
      for (let i = 0; i < 3; i++) {
        const file = formData.get(`images[${i}]`) as File | null;
        if (file && file.size > 0) {
          imageFiles.push(file);
        }
      }

      // Validate image count (max 3)
      if (imageFiles.length > 3) {
        return NextResponse.json(
          { error: 'Maximum 3 images allowed per item' },
          { status: 400 }
        );
      }
    } else {
      // Parse JSON body (for API/testing without file uploads)
      const body = await request.json();
      title = body.title || '';
      description = body.description || '';
      category = body.category || '';
      location = body.location || '';

      isDocument = body.isDocument === true || body.isDocument === 'true';
      documentNumber = body.documentNumber || '';
      documentYear = body.documentYear || '';
      issuingAuthority = body.issuingAuthority || '';
      holderName = body.holderName || '';
    }
    
    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }
    
    // Get the current user (admin) from session
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }
    
    // Create item first to get ID for filenames
    const item = await prisma.item.create({
      data: {
        title,
        description,
        categoryId: category || null,
        locationId: location || null,
        createdById: session.user.id,
        imageUrls: [], // Will be updated after file upload
        isDocument,
        documentNumber: documentNumber || null,
        documentYear: documentYear || null,
        issuingAuthority: issuingAuthority || null,
        holderName: holderName || null,
      },
    });
    
    // Upload images to Uploadthing
    let imageUrls: string[] = [];
    
    if (imageFiles.length > 0) {
      const { uploadFiles } = await import('@/lib/file-upload');
      imageUrls = await uploadFiles(imageFiles);
    }
    
    // Update item with image URLs
    const updatedItem = await prisma.item.update({
      where: { id: item.id },
      data: { imageUrls },
      include: {
        createdBy: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    // Alert Matching Logic
    try {
      // Find all active alerts
      const alerts = await prisma.alert.findMany({
        include: {
          user: {
            select: {
              email: true,
            },
          },
          category: true,
          location: true,
        },
      });

      // Check each alert for matches
      const matchingAlerts = alerts.filter((alert: any) => {
        // 1. Keyword matching (case-insensitive containment)
        const keywords = alert.keywords.toLowerCase().split(/\s+/).filter((k: string) => k.length > 0);
        const itemText = `${title} ${description}`.toLowerCase();
        
        const keywordMatch = keywords.every((keyword: string) => 
          itemText.includes(keyword)
        );
        
        if (!keywordMatch) return false;

        // 2. Category matching (if alert has category)
        if (alert.categoryId) {
          if (!category || alert.categoryId !== category) {
            return false;
          }
        }

        // 3. Location matching (if alert has location)
        if (alert.locationId) {
          if (!location || alert.locationId !== location) {
            return false;
          }
        }

        // 4. Document field matching (if alert is for documents)
        if (alert.isDocument) {
          // If alert is for documents but item is not a document, no match
          if (!isDocument) return false;

          // Document number matching (if alert has document number)
          if (alert.documentNumber && documentNumber) {
            if (!documentNumber.toLowerCase().includes(alert.documentNumber.toLowerCase())) {
              return false;
            }
          }

          // Document year matching (if alert has document year)
          if (alert.documentYear && documentYear) {
            if (!documentYear.toLowerCase().includes(alert.documentYear.toLowerCase())) {
              return false;
            }
          }

          // Issuing authority matching (if alert has issuing authority)
          if (alert.issuingAuthority && issuingAuthority) {
            if (!issuingAuthority.toLowerCase().includes(alert.issuingAuthority.toLowerCase())) {
              return false;
            }
          }

          // Holder name matching (if alert has holder name)
          if (alert.holderName && holderName) {
            if (!holderName.toLowerCase().includes(alert.holderName.toLowerCase())) {
              return false;
            }
          }
        }

        // 5. Color matching (if alert has color)
        if (alert.color) {
          // Color field is not yet implemented for items, skip for now
          // TODO: Add color field to item creation form
        }

        return true;
      });

      // Send mock email notifications for matching alerts
      matchingAlerts.forEach((alert: any) => {
        console.log(`[MOCK EMAIL] Alert match notification sent to: ${alert.user.email}`);
        console.log(`  Alert ID: ${alert.id}`);
        console.log(`  Item ID: ${updatedItem.id}`);
        console.log(`  Item Title: ${title}`);
        console.log(`  Match Criteria: ${alert.keywords}`);
        if (alert.category) console.log(`  Category: ${alert.category.name}`);
        if (alert.location) console.log(`  Location: ${alert.location.name}`);
        console.log('---');
      });

      if (matchingAlerts.length > 0) {
        console.log(`Found ${matchingAlerts.length} matching alert(s) for new item ${updatedItem.id}`);
      }
    } catch (alertError) {
      console.error('Error during alert matching:', alertError);
      // Don't fail the item creation if alert matching fails
    }
    
    return NextResponse.json(
      { 
        message: 'Item created successfully',
        item: updatedItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
