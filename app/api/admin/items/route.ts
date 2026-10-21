import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { matchesAlert } from '@/lib/alert-matching';
import { sendEmail } from '@/lib/email';

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
    let color = '';
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
      color = (formData.get('color') as string) || '';

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
      color = body.color || '';
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
        color: color || null,
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

    // Alert matching + notifications. Never fail item creation on notification errors.
    try {
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

      const matchingAlerts = alerts.filter((alert) => matchesAlert(alert, updatedItem));

      const results = await Promise.allSettled(
        matchingAlerts.map((alert) =>
          sendEmail({
            to: alert.user.email,
            subject: `Possible match for your alert: ${title}`,
            text: [
              `An item matching your alert has been added to Tsvaga.`,
              '',
              `Item: ${title}`,
              `Description: ${description}`,
              alert.category?.name ? `Category: ${alert.category.name}` : null,
              alert.location?.name ? `Location: ${alert.location.name}` : null,
              '',
              `View it here: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/items/${updatedItem.id}`,
              '',
              `Your alert keywords: ${alert.keywords}`,
            ]
              .filter((line): line is string => line !== null)
              .join('\n'),
          })
        )
      );

      const sent = results.filter(
        (result) => result.status === 'fulfilled' && result.value.sent
      ).length;

      if (matchingAlerts.length > 0) {
        console.log(
          `[alerts] ${matchingAlerts.length} match(es) for item ${updatedItem.id}; ${sent} email(s) sent`
        );
      }
    } catch (alertError) {
      console.error('Error during alert matching:', alertError);
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
