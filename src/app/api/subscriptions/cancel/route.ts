import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { cancelSafePaySubscription } from '@/lib/safepay';
import { getActiveSubscription } from '@/lib/subscription';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason } = await req.json();

    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
    });

    if (!nurse) {
      return NextResponse.json({ error: 'Nurse not found' }, { status: 404 });
    }

    const subscription = await getActiveSubscription(nurse.id);

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
    }

    // Cancel SafePay subscription if exists
    if (subscription.xpaySubscriptionId) {
      try {
        await cancelSafePaySubscription(subscription.xpaySubscriptionId);
      } catch (error) {
        console.error('SafePay cancellation error:', error);
      }
    }

    // Update subscription status
    await prisma.nurseSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
        autoRenew: false,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
