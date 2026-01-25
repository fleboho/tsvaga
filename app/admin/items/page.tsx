import { requireAdmin } from '@/lib/auth-utils';
import AdminItemsClient from './AdminItemsClient';

export default async function AdminItemsPage() {
  // This will redirect non-admin users
  const user = await requireAdmin();
  
  return <AdminItemsClient />;
}