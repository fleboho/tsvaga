import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  // This will redirect non-admin users
  const user = await requireAdmin();
  
  // Fetch statistics from database
  const totalItems = await prisma.item.count();
  const returnedItems = await prisma.item.count({
    where: { status: 'RETURNED' }
  });
  const availableItems = await prisma.item.count({
    where: { status: 'AVAILABLE' }
  });
  
  // Fetch recent items and convert dates to strings
  const recentItems = await prisma.item.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: {
          email: true,
        },
      },
    },
  }).then((items: any[]) => items.map(item => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  })));
  
  // Fetch user statistics
  const totalUsers = await prisma.user.count();
  const adminUsers = await prisma.user.count({
    where: { role: 'ADMIN' }
  });
  const regularUsers = await prisma.user.count({
    where: { role: 'USER' }
  });
  
  return (
    <AdminDashboardClient 
      totalItems={totalItems}
      returnedItems={returnedItems}
      availableItems={availableItems}
      recentItems={recentItems}
      totalUsers={totalUsers}
      adminUsers={adminUsers}
      regularUsers={regularUsers}
    />
  );
}