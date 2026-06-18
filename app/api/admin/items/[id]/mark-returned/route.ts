import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// POST /api/admin/items/[id]/mark-returned - Mark item as returned (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check if user is admin
  const errorResponse = await checkAdminAccess();
  if (errorResponse) return errorResponse;
  
  try {
    const { id } = await params;
    
    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
    });
    
    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    // Check if item is already returned
    if (existingItem.status === 'RETURNED') {
      return NextResponse.json(
        { error: 'Item is already marked as returned' },
        { status: 400 }
      );
    }
    
    // Update item status to RETURNED
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        status: 'RETURNED',
      },
      include: {
        createdBy: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    // Alert matching — notify users whose alerts match this returned item
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

      const itemTitle = existingItem.title;
      const description = existingItem.description;
      const category = existingItem.categoryId;
      const location = existingItem.locationId;
      const isDocument = existingItem.isDocument;
      const documentNumber = existingItem.documentNumber;
      const documentYear = existingItem.documentYear;
      const issuingAuthority = existingItem.issuingAuthority;
      const holderName = existingItem.holderName;

      const matchingAlerts = alerts.filter((alert: any) => {
        const keywords = alert.keywords.toLowerCase().split(/\s+/).filter((k: string) => k.length > 0);
        const itemText = `${itemTitle} ${description}`.toLowerCase();

        const keywordMatch = keywords.every((keyword: string) =>
          itemText.includes(keyword)
        );
        if (!keywordMatch) return false;

        if (alert.categoryId && alert.categoryId !== category) return false;
        if (alert.locationId && alert.locationId !== location) return false;

        if (alert.isDocument) {
          if (!isDocument) return false;
          if (alert.documentNumber && documentNumber && !documentNumber.toLowerCase().includes(alert.documentNumber.toLowerCase())) return false;
          if (alert.documentYear && documentYear && !documentYear.toLowerCase().includes(alert.documentYear.toLowerCase())) return false;
          if (alert.issuingAuthority && issuingAuthority && !issuingAuthority.toLowerCase().includes(alert.issuingAuthority.toLowerCase())) return false;
          if (alert.holderName && holderName && !holderName.toLowerCase().includes(alert.holderName.toLowerCase())) return false;
        }

        return true;
      });

      matchingAlerts.forEach((alert: any) => {
        console.log(`[MOCK EMAIL] Item returned notification sent to: ${alert.user.email}`);
        console.log(`  Alert ID: ${alert.id}`);
        console.log(`  Item ID: ${updatedItem.id}`);
        console.log(`  Item Title: ${itemTitle}`);
        console.log(`  Status: MARKED AS RETURNED`);
        console.log(`  Message: Good news! An item matching your alert has been returned to its owner.`);
        if (alert.category) console.log(`  Category: ${alert.category.name}`);
        if (alert.location) console.log(`  Location: ${alert.location.name}`);
        console.log('---');
      });

      if (matchingAlerts.length > 0) {
        console.log(`Found ${matchingAlerts.length} matching alert(s) for returned item ${updatedItem.id}`);
      }
    } catch (alertError) {
      console.error('Error during alert matching on return:', alertError);
    }

    return NextResponse.json({
      message: 'Item marked as returned successfully',
      item: updatedItem,
    });
    
  } catch (error) {
    console.error('Error marking item as returned:', error);
    
    // Handle Prisma errors
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}