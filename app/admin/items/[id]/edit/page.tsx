import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import EditItemClient from './EditItemClient';

interface EditItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditItemPage({ params }: EditItemPageProps) {
  // This will redirect non-admin users
  const user = await requireAdmin();
  
  const { id } = await params;
  
  // Fetch the item from database and convert dates to strings
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          email: true,
          role: true,
        },
      },
    },
  });
  
  if (!item) {
    notFound();
  }
  
  // Convert Date objects to strings for client component
  const itemForClient = {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
  
  return <EditItemClient item={itemForClient} />;
}