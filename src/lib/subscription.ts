import { prisma } from '@/lib/prisma';

export interface SubscriptionCheck {
  canTakeBooking: boolean;
  reason?: string;
  currentPlan?: string;
  bookingsUsed?: number;
  bookingLimit?: number;
  needsUpgrade?: boolean;
  suggestedPlan?: string;
}

// Check if nurse can take a booking
export async function canNurseTakeBooking(nurseId: string): Promise<SubscriptionCheck> {
  const subscription = await prisma.nurseSubscription.findFirst({
    where: {
      nurseId,
      status: { in: ['ACTIVE', 'TRIAL'] },
      OR: [
        { endDate: { gte: new Date() } },
        { endDate: null },
      ],
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) {
    return {
      canTakeBooking: false,
      reason: 'No active subscription. Please start a trial or subscribe to a plan.',
      needsUpgrade: true,
      suggestedPlan: 'TRIAL',
    };
  }

  // Check if trial expired
  if (subscription.status === 'TRIAL' && subscription.trialEndsAt && subscription.trialEndsAt < new Date()) {
    await prisma.nurseSubscription.update({
      where: { id: subscription.id },
      data: { status: 'PAUSED' },
    });
    return {
      canTakeBooking: false,
      reason: 'Trial period ended. Please upgrade to continue.',
      currentPlan: subscription.plan.name,
      needsUpgrade: true,
      suggestedPlan: 'BASIC',
    };
  }

  // Check booking limit (unlimited = -1)
  if (subscription.bookingLimit !== -1 && subscription.bookingsUsed >= subscription.bookingLimit) {
    await prisma.nurseSubscription.update({
      where: { id: subscription.id },
      data: { status: 'PAUSED' },
    });

    const suggestedPlan = subscription.plan.slug === 'basic' ? 'GROWTH' : 'PREMIUM';
    
    return {
      canTakeBooking: false,
      reason: `Monthly booking limit reached (${subscription.bookingLimit}). Please upgrade.`,
      currentPlan: subscription.plan.name,
      bookingsUsed: subscription.bookingsUsed,
      bookingLimit: subscription.bookingLimit,
      needsUpgrade: true,
      suggestedPlan,
    };
  }

  return {
    canTakeBooking: true,
    currentPlan: subscription.plan.name,
    bookingsUsed: subscription.bookingsUsed,
    bookingLimit: subscription.bookingLimit,
  };
}

// Increment booking count when nurse accepts a booking
export async function incrementBookingCount(nurseId: string): Promise<void> {
  const subscription = await prisma.nurseSubscription.findFirst({
    where: {
      nurseId,
      status: { in: ['ACTIVE', 'TRIAL'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (subscription) {
    await prisma.nurseSubscription.update({
      where: { id: subscription.id },
      data: { bookingsUsed: { increment: 1 } },
    });
  }
}

// Get active subscription for nurse
export async function getActiveSubscription(nurseId: string) {
  return prisma.nurseSubscription.findFirst({
    where: {
      nurseId,
      status: { in: ['ACTIVE', 'TRIAL'] },
      OR: [
        { endDate: { gte: new Date() } },
        { endDate: null },
      ],
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
}

// Reset monthly booking count (run via cron job)
export async function resetMonthlyBookings() {
  const now = new Date();
  
  await prisma.nurseSubscription.updateMany({
    where: {
      status: 'ACTIVE',
      nextBillingDate: { lte: now },
    },
    data: {
      bookingsUsed: 0,
      lastRenewalDate: now,
      nextBillingDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}

// Expire subscriptions (run via cron job)
export async function expireSubscriptions() {
  await prisma.nurseSubscription.updateMany({
    where: {
      status: { in: ['ACTIVE', 'TRIAL'] },
      endDate: { lt: new Date() },
    },
    data: { status: 'EXPIRED' },
  });
}

// Check if nurse can list a service
export async function canNurseAddService(nurseId: string): Promise<{ canAdd: boolean; reason?: string }> {
  const subscription = await getActiveSubscription(nurseId);
  
  if (!subscription) {
    return { canAdd: false, reason: 'No active subscription' };
  }

  // Unlimited services
  if (subscription.plan.servicesAllowed === -1) {
    return { canAdd: true };
  }

  // Count current services (you'll need to implement this based on your service model)
  // const serviceCount = await prisma.nurseService.count({ where: { nurseId } });
  
  // For now, return true - implement service counting based on your needs
  return { canAdd: true };
}
