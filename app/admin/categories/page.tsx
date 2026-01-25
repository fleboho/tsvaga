import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import CategoriesAdminClient from './CategoriesAdminClient';

export default async function CategoriesAdminPage() {
  // This will redirect non-admin users
  const user = await requireAdmin();
  
  // Fetch categories from database
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          items: true,
          alerts: true,
        },
      },
    },
  }).then((categories: any[]) => categories.map(category => ({
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  })));
  
  return <CategoriesAdminClient initialCategories={categories} />;
}