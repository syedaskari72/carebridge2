import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding subscription plans...');

  // Trial Plan
  await prisma.subscriptionPlan.upsert({
    where: { slug: 'trial' },
    update: {},
    create: {
      name: 'Starter Trial',
      slug: 'trial',
      price: 0,
      bookingLimit: 20,
      serviceRadius: 5,
      servicesAllowed: 3,
      visibility: 'BASIC',
      analytics: 'NONE',
      support: 'EMAIL',
      features: [
        '20 bookings for 14 days',
        '5 KM service radius',
        'List up to 3 services',
        'Basic profile visibility',
        'Email support',
      ],
      isTrial: true,
      trialDays: 14,
      isActive: true,
      displayOrder: 0,
    },
  });

  // Basic Plan
  await prisma.subscriptionPlan.upsert({
    where: { slug: 'basic' },
    update: {},
    create: {
      name: 'Basic Plan',
      slug: 'basic',
      price: 3500,
      bookingLimit: 50,
      serviceRadius: 10,
      servicesAllowed: 8,
      visibility: 'STANDARD',
      analytics: 'BASIC',
      support: 'EMAIL',
      features: [
        '50 bookings per month',
        '10 KM service radius',
        'List up to 8 services',
        'Standard profile visibility',
        'Basic analytics dashboard',
        'Email support',
        'Profile badge',
      ],
      isTrial: false,
      isActive: true,
      displayOrder: 1,
    },
  });

  // Growth Plan
  await prisma.subscriptionPlan.upsert({
    where: { slug: 'growth' },
    update: {},
    create: {
      name: 'Growth Plan',
      slug: 'growth',
      price: 8000,
      bookingLimit: 150,
      serviceRadius: 25,
      servicesAllowed: 20,
      visibility: 'FEATURED',
      analytics: 'ADVANCED',
      support: 'EMAIL_CHAT',
      features: [
        '150 bookings per month',
        '25 KM service radius',
        'List up to 20 services',
        'Featured in search results',
        'Advanced analytics & insights',
        'In-app chat + email support',
        'Priority booking notifications',
        'Verified badge',
      ],
      isTrial: false,
      isActive: true,
      displayOrder: 2,
    },
  });

  // Premium Plan
  await prisma.subscriptionPlan.upsert({
    where: { slug: 'premium' },
    update: {},
    create: {
      name: 'Premium Plan',
      slug: 'premium',
      price: 16000,
      bookingLimit: -1, // Unlimited
      serviceRadius: -1, // Unlimited
      servicesAllowed: -1, // Unlimited
      visibility: 'TOP_PRIORITY',
      analytics: 'FULL',
      support: 'PRIORITY_ALL',
      features: [
        'Unlimited bookings',
        'Unlimited service radius',
        'List unlimited services',
        'Top priority in all searches',
        'Full analytics with reports',
        'Priority phone + chat + email',
        '24/7 dedicated support',
        'Premium badge',
        'Featured on homepage',
        'Early access to new features',
      ],
      isTrial: false,
      isActive: true,
      displayOrder: 3,
    },
  });

  console.log('✅ Subscription plans seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
