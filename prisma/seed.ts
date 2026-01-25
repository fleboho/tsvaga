import { PrismaClient, Role, ItemStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.alert.deleteMany();
  await prisma.item.deleteMany();
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

  // Create 5 items (all created by admin)
  const items = [
    {
      title: 'Black Wallet',
      description: 'Found near the main entrance, contains ID cards and credit cards',
      category: 'Wallet',
      location: 'Main Building Lobby',
      status: ItemStatus.AVAILABLE,
    },
    {
      title: 'iPhone 15 Pro',
      description: 'Found in the cafeteria, black case with floral design',
      category: 'Electronics',
      location: 'Cafeteria',
      status: ItemStatus.AVAILABLE,
    },
    {
      title: 'Keys with Car Fob',
      description: 'Set of keys with Toyota car key fob and 3 house keys',
      category: 'Keys',
      location: 'Parking Lot B',
      status: ItemStatus.AVAILABLE,
    },
    {
      title: 'Blue Backpack',
      description: 'Jansport backpack containing textbooks and a water bottle',
      category: 'Bag',
      location: 'Library',
      status: ItemStatus.RETURNED,
    },
    {
      title: 'Gold Wedding Ring',
      description: '18k gold wedding band, engraved "Forever Yours"',
      category: 'Jewelry',
      location: 'Restroom near Office',
      status: ItemStatus.AVAILABLE,
    },
  ];

  const createdItems = [];
  for (const itemData of items) {
    const item = await prisma.item.create({
      data: {
        ...itemData,
        createdBy: {
          connect: { id: adminUser.id },
        },
      },
    });
    createdItems.push(item);
    console.log(`Created item: ${item.title}`);
  }

  // Create 1 alert for the normal user
  const alert = await prisma.alert.create({
    data: {
      keywords: 'wallet black credit cards',
      category: 'Wallet',
      location: 'Main Building Lobby',
      user: {
        connect: { id: normalUser.id },
      },
    },
  });

  console.log(`Created alert for user: ${alert.keywords}`);

  console.log('Seed completed successfully!');
  console.log(`Total: 2 users, ${createdItems.length} items, 1 alert`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });