import { PrismaClient, Role, ItemStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data (in correct order due to foreign key constraints)
  await prisma.alert.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data');

  // Hash passwords
  const adminPassword = await hash('admin123', 10);
  const userPassword = await hash('user123', 10);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@lostandfound.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Create normal user
  const normalUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: userPassword,
      role: Role.USER,
    },
  });

  console.log(`Created admin user: ${adminUser.email}`);
  console.log(`Created normal user: ${normalUser.email}`);

  // Create categories from the specified list
  const categoryNames = [
    'National ID',
    'Passport',
    'Driver\'s License',
    'Bank Card',
    'College Certificate',
    'Marriage Certificate',
    'Other Certificate',
    'Other Document',
    'Other Card',
    'Other'
  ];

  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: {
        name,
        description: `${name} category for lost and found items`,
      },
    });
    categories.push(category);
    console.log(`Created category: ${category.name}`);
  }

  // Create some sample locations
  const locationData = [
    {
      name: 'Main Building Lobby',
      description: 'Main entrance lobby area',
      address: '123 Main Street, City Center',
    },
    {
      name: 'Cafeteria',
      description: 'Main cafeteria and dining area',
      address: 'Building A, First Floor',
    },
    {
      name: 'Parking Lot B',
      description: 'Secondary parking area',
      address: 'Behind Main Building',
      latitude: '40.7128',
      longitude: '-74.0060',
    },
    {
      name: 'Library',
      description: 'Main library building',
      address: 'Campus Library, Room 101',
    },
    {
      name: 'Restroom near Office',
      description: 'Restroom adjacent to main office',
      address: 'First floor, near reception',
    },
  ];

  const locations = [];
  for (const locData of locationData) {
    const location = await prisma.location.create({
      data: locData,
    });
    locations.push(location);
    console.log(`Created location: ${location.name}`);
  }

  // Create 5 items (all created by admin) with references to categories and locations
  const items = [
    {
      title: 'Black Wallet',
      description: 'Found near the main entrance, contains ID cards and credit cards',
      categoryName: 'Bank Card', // Using Bank Card category
      locationName: 'Main Building Lobby',
      status: ItemStatus.AVAILABLE,
    },
    {
      title: 'iPhone 15 Pro',
      description: 'Found in the cafeteria, black case with floral design',
      categoryName: 'Other', // Using Other category
      locationName: 'Cafeteria',
      status: ItemStatus.AVAILABLE,
    },
    {
      title: 'Keys with Car Fob',
      description: 'Set of keys with Toyota car key fob and 3 house keys',
      categoryName: 'Other', // Using Other category
      locationName: 'Parking Lot B',
      status: ItemStatus.AVAILABLE,
    },
    {
      title: 'Blue Backpack',
      description: 'Jansport backpack containing textbooks and a water bottle',
      categoryName: 'Other Document', // Using Other Document category
      locationName: 'Library',
      status: ItemStatus.RETURNED,
    },
    {
      title: 'Gold Wedding Ring',
      description: '18k gold wedding band, engraved "Forever Yours"',
      categoryName: 'Other', // Using Other category
      locationName: 'Restroom near Office',
      status: ItemStatus.AVAILABLE,
    },
  ];

  const createdItems = [];
  for (const itemData of items) {
    // Find category and location by name
    const category = categories.find(c => c.name === itemData.categoryName);
    const location = locations.find(l => l.name === itemData.locationName);

    const itemDataToCreate: any = {
      title: itemData.title,
      description: itemData.description,
      status: itemData.status,
      createdBy: {
        connect: { id: adminUser.id },
      },
    };

    // Add category connection if found
    if (category) {
      itemDataToCreate.category = {
        connect: { id: category.id },
      };
    }

    // Add location connection if found
    if (location) {
      itemDataToCreate.location = {
        connect: { id: location.id },
      };
    }

    const item = await prisma.item.create({
      data: itemDataToCreate,
    });
    createdItems.push(item);
    console.log(`Created item: ${item.title}`);
  }

  // Create 1 alert for the normal user
  const walletCategory = categories.find(c => c.name === 'Bank Card');
  const mainLobbyLocation = locations.find(l => l.name === 'Main Building Lobby');

  const alertData: any = {
    keywords: 'wallet black credit cards',
    user: {
      connect: { id: normalUser.id },
    },
  };

  // Add category connection if found
  if (walletCategory) {
    alertData.category = {
      connect: { id: walletCategory.id },
    };
  }

  // Add location connection if found
  if (mainLobbyLocation) {
    alertData.location = {
      connect: { id: mainLobbyLocation.id },
    };
  }

  const alert = await prisma.alert.create({
    data: alertData,
  });

  console.log(`Created alert for user: ${alert.keywords}`);

  console.log('Seed completed successfully!');
  console.log(`Total: 2 users, ${categories.length} categories, ${locations.length} locations, ${createdItems.length} items, 1 alert`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });