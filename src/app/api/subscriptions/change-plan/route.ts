import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { createSafePaySubscription, cancelSafePaySubscription } from '@/lib/safepay';
import { getActiveSubscription } from '@/lib/subscription';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newPlanId } = await req.json();

    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });

    if (!nurse) {
      return NextResponse.json({ error: 'Nurse not found' }, { status: 404 });
    }

    const currentSubscription = await getActiveSubscription(nurse.id);
    if (!currentSubscription) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
    }

    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: newPlanId },
    });

    if (!newPlan || !newPlan.isActive || newPlan.isTrial) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Cancel old SafePay subscription
    if (currentSubscription.xpaySubscriptionId) {
      try {
        await cancelSafePaySubscription(currentSubscription.xpaySubscriptionId);
      } catch (error) {
        console.error('SafePay cancellation error:', error);
      }
    }

    // Mark old subscription as cancelled
    await prisma.nurseSubscription.update({
      where: { id: currentSubscription.id },
      data: { status: 'CANCELLED', autoRenew: false },
    });

    // Create new subscription
    const newSubscription = await prisma.nurseSubscription.create({
      data: {
        nurseId: nurse.id,
        planId: newPlan.id,
        bookingLimit: newPlan.bookingLimit,
        status: 'PENDING',
      },
    });

    // Create new SafePay subscription
    const safePayOrder = await createSafePaySubscription({
      amount: newPlan.price,
      orderId: newSubscription.id,
      customerName: nurse.user.name,
      customerEmail: nurse.user.email,
      customerPhone: nurse.user.phone || '',
      description: `CareBridge ${newPlan.name} Plan`,
      webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/safepay`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/dashboard/nurse/subscription?status=cancelled`,
      redirectUrl: `${process.env.NEXTAUTH_URL}/dashboard/nurse/subscription?status=success`,
    });

    await prisma.nurseSubscription.update({
      where: { id: newSubscription.id },
      data: { 
        xpayOrderId: safePayOrder.token,
        xpaySubscriptionId: safePayOrder.token,
      },
    });

    return NextResponse.json({ 
      success: true,
      paymentUrl: safePayOrder.checkout_url,
      message: `Plan changed to ${newPlan.name}`
    });
  } catch (error) {
    console.error('Change plan error:', error);
    return NextResponse.json({ error: 'Failed to change plan' }, { status: 500 });
  }
}
