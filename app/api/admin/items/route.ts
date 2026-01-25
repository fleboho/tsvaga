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
    // Parse multipart form data
    const formData = await request.formData();
    
    // Extract fields and files
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const location = formData.get('location') as string;
    
    // Get image files
    const imageFiles: File[] = [];
    for (let i = 0; i < 3; i++) {
      const file = formData.get(`images[${i}]`) as File | null;
      if (file && file.size > 0) {
        imageFiles.push(file);
      }
    }
    
    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }
    
    // Validate image count (max 3)
    if (imageFiles.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 images allowed per item' },
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
        category: category || null,
        location: location || null,
        createdBy: {
          connect: { id: session.user.id },
        },
        imageUrls: [], // Will be updated after file upload
      },
    });
    
    // Upload images
    const imageUrls: string[] = [];
    
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      
      // Validate file
      if (file.size > 4 * 1024 * 1024) {
        return NextResponse.json(
          { error: `Image ${i + 1} exceeds 4MB size limit` },
          { status: 400 }
        );
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Image ${i + 1} must be JPEG, PNG, or WebP` },
          { status: 400 }
        );
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10);
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `item-${item.id}-${timestamp}-${random}.${extension}`;
      
      // Save file
      const uploadDir = `${process.cwd()}/public/uploads/items`;
      const filePath = `${uploadDir}/${filename}`;
      
      // Ensure directory exists
      const fs = await import('fs/promises');
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(filePath, buffer);
      
      // Store relative path
      imageUrls.push(`/uploads/items/${filename}`);
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
