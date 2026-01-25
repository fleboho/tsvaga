import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Zod schema for contact form validation
const contactSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message is too long'),
});

// POST /api/contact - Public endpoint for contacting admin about an item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = contactSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const { itemId, name, email, message } = validationResult.data;
    
    // Check if item exists and is available
    const item = await prisma.item.findUnique({
      where: {
        id: itemId,
        status: 'AVAILABLE',
      },
      select: {
        id: true,
        title: true,
      },
    });
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found or not available' },
        { status: 404 }
      );
    }
    
    // Mock email sending - log to console as per MVP-1 requirements
    console.log(`[CONTACT FORM SUBMISSION]`);
    console.log(`Item: ${item.title} (${itemId})`);
    console.log(`From: ${name} <${email}>`);
    console.log(`Message: ${message}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('---');
    
    // In a real implementation, we would:
    // 1. Send email to admin
    // 2. Store contact request in database
    // 3. Send confirmation email to user
    
    return NextResponse.json({
      success: true,
      message: 'Contact request submitted successfully. Admin will be notified.',
      data: {
        itemId,
        itemTitle: item.title,
        name,
        email,
        timestamp: new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('Error processing contact request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to verify the API is working
export async function GET() {
  return NextResponse.json({
    message: 'Contact API endpoint is working',
    description: 'POST to this endpoint to submit a contact form for an item',
    required_fields: ['itemId', 'name', 'email', 'message'],
  });
}