import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function POST() {
  console.log('🔄 [Activate-Pending] Starting activation...');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.email, session?.user?.userType);
    
    if (!session?.user || session.user.userType !== 'NURSE') {
      console.log('❌ Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
    });

    if (!nurse) {
      console.log('❌ Nurse not found');
      return NextResponse.json({ error: 'Nurse not found' }, { status: 404 });
    }

    console.log('👨‍⚕️ Nurse found:', nurse.id);

    // Find most recent pending subscription
    const subscription = await prisma.nurseSubscription.findFirst({
      where: {
        nurseId: nurse.id,
        status: 'PENDING',
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    console.log('📋 Pending subscription:', subscription ? subscription.id : 'None found');

    if (!subscription) {
      // Check if already active
      const activeSubscription = await prisma.nurseSubscription.findFirst({
        where: {
          nurseId: nurse.id,
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      });
      
      if (activeSubscription) {
        console.log('✅ Already has active subscription:', activeSubscription.id);
        return NextResponse.json({ 
          activated: true, 
          alreadyActive: true,
          message: 'Subscription already active' 
        });
      }
      
      console.log('⚠️ No pending subscription found');
      return NextResponse.json({ activated: false, message: 'No pending subscription' });
    }

    // Activate subscription
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const updated = await prisma.nurseSubscription.update({
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

    console.log('✅ Subscription activated via redirect:', updated.id, 'Status:', updated.status);

    return NextResponse.json({ 
      activated: true, 
      subscription: subscription.plan.name,
      subscriptionId: updated.id,
      status: updated.status
    });
  } catch (error: any) {
    console.error('❌ Activation error:', error);
    return NextResponse.json({ 
      error: error.message,
      activated: false 
    }, { status: 500 });
  }
}
