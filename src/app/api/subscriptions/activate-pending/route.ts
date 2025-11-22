import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.userType !== 'NURSE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
    });

    if (!nurse) {
      return NextResponse.json({ error: 'Nurse not found' }, { status: 404 });
    }

    // Find most recent pending subscription
    const subscription = await prisma.nurseSubscription.findFirst({
      where: {
        nurseId: nurse.id,
        status: 'PENDING',
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return NextResponse.json({ activated: false, message: 'No pending subscription' });
    }

    // Activate subscription
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.nurseSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        startDate: now,
        endDate,
        nextBillingDate: endDate,
        lastPaymentDate: now,
        lastPaymentAmount: subscription.plan.price,
        lastRenewalDate: now,
        bookingsUsed: 0,
        failedPayments: 0,
      },
    });

    console.log('✅ Subscription activated via redirect:', subscription.id);

    return NextResponse.json({ 
      activated: true, 
      subscription: subscription.plan.name 
    });
  } catch (error: any) {
    console.error('Activation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
