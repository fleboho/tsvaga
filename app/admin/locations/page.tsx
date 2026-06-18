import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import LocationsAdminClient from './LocationsAdminClient';

export default async function AdminLocationsPage() {
  // This will redirect non-admin users
  const user = await requireAdmin();
  
  // Fetch locations from database
  const locations = await prisma.location.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      latitude: true,
      longitude: true,
      address: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  }).then((locations: any[]) => locations.map(location => ({
    ...location,
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString(),
  })));
  
  return <LocationsAdminClient initialLocations={locations} />;
}
