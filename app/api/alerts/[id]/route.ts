import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { updateAlertSchema } from '@/lib/alert-schemas';

// PATCH /api/alerts/[id] - Update an alert (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await requireAuth();
    const { id } = await params;
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateAlertSchema.safeParse(body);
    
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
    
    // Check if alert exists and belongs to the current user
    const existingAlert = await prisma.alert.findUnique({
      where: { id },
    });
    
    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    if (existingAlert.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied. You can only update your own alerts.' },
        { status: 403 }
      );
    }
    
    // Check if category exists if provided
    if (categoryId !== undefined) {
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
    }
    
    // Handle location - find or create if provided
    let locationIdToUse: string | null | undefined = undefined;
    if (location !== undefined) {
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
      } else {
        // location is empty string or null, so set to null
        locationIdToUse = null;
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    if (keywords !== undefined) updateData.keywords = keywords;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (locationIdToUse !== undefined) updateData.locationId = locationIdToUse;
    if (isDocument !== undefined) updateData.isDocument = isDocument;
    if (documentNumber !== undefined) updateData.documentNumber = documentNumber || null;
    if (documentYear !== undefined) updateData.documentYear = documentYear || null;
    if (issuingAuthority !== undefined) updateData.issuingAuthority = issuingAuthority || null;
    if (holderName !== undefined) updateData.holderName = holderName || null;
    if (color !== undefined) updateData.color = color || null;
    
    // Update the alert
    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: updateData,
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
    
    return NextResponse.json({
      message: 'Alert updated successfully',
      alert: updatedAlert,
    });
    
  } catch (error) {
    console.error('Error updating alert:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Handle Prisma not found error
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/alerts/[id] - Delete an alert (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await requireAuth();
    const { id } = await params;
    
    // Check if alert exists and belongs to the current user
    const existingAlert = await prisma.alert.findUnique({
      where: { id },
    });
    
    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    if (existingAlert.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied. You can only delete your own alerts.' },
        { status: 403 }
      );
    }
    
    // Delete the alert
    await prisma.alert.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: 'Alert deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting alert:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Handle Prisma not found error
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}