import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { matchesAlert } from '@/lib/alert-matching';
import { sendEmail } from '@/lib/email';

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

      const matchingAlerts = alerts.filter((alert) => matchesAlert(alert, existingItem));

      const results = await Promise.allSettled(
        matchingAlerts.map((alert) =>
          sendEmail({
            to: alert.user.email,
            subject: `Good news: an item matching your alert was returned`,
            text: [
              `An item matching your alert has been returned to its owner.`,
              '',
              `Item: ${itemTitle}`,
              alert.category?.name ? `Category: ${alert.category.name}` : null,
              alert.location?.name ? `Location: ${alert.location.name}` : null,
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
          `[alerts] ${matchingAlerts.length} match(es) for returned item ${updatedItem.id}; ${sent} email(s) sent`
        );
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