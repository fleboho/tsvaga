import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getAdminEmail, sendEmail } from '@/lib/email';
import { checkRateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

// Zod schema for contact form validation
const contactSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message is too long'),
});

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// POST /api/contact - Public endpoint for contacting admin about an item
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = await checkRateLimit(`contact:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!limit.allowed) return tooManyRequests(limit);

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

    // Persist first: the enquiry must survive even if email delivery fails.
    const contactRequest = await prisma.contactRequest.create({
      data: {
        itemId: item.id,
        itemTitle: item.title,
        name,
        email,
        message,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    const adminEmail = getAdminEmail();
    let emailSent = false;

    if (adminEmail) {
      const result = await sendEmail({
        to: adminEmail,
        replyTo: email,
        subject: `Tsvaga enquiry: ${item.title}`,
        text: [
          `New contact request for: ${item.title} (${item.id})`,
          '',
          `From: ${name} <${email}>`,
          '',
          message,
          '',
          `Request ID: ${contactRequest.id}`,
          `Received: ${contactRequest.createdAt.toISOString()}`,
        ].join('\n'),
      });
      emailSent = result.sent;
    } else {
      console.error('[contact] ADMIN_EMAIL/EMAIL_FROM is not set — request stored but not emailed');
    }

    return NextResponse.json({
      success: true,
      message: 'Contact request submitted successfully. Admin will be notified.',
      data: {
        itemId,
        itemTitle: item.title,
        name,
        email,
        timestamp: contactRequest.createdAt.toISOString(),
        emailSent,
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
