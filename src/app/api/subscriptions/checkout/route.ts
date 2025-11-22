import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { createSafePaySubscription } from '@/lib/safepay';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await req.json();

    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });

    if (!nurse) {
      return NextResponse.json({ error: 'Nurse not found' }, { status: 404 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive || plan.isTrial) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Create pending subscription
    const subscription = await prisma.nurseSubscription.create({
      data: {
        nurseId: nurse.id,
        planId: plan.id,
        bookingLimit: plan.bookingLimit,
        status: 'PENDING',
      },
    });

    // Create XPay recurring subscription
    let safePayOrder;
    try {
      safePayOrder = await createSafePaySubscription({
        amount: plan.price,
        orderId: subscription.id,
        customerName: nurse.user.name,
        customerEmail: nurse.user.email,
        customerPhone: nurse.user.phone || '',
        description: `CareBridge ${plan.name} Plan`,
        webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/safepay`,
        cancelUrl: `${process.env.NEXTAUTH_URL}/dashboard/nurse/subscription?status=cancelled`,
        redirectUrl: `${process.env.NEXTAUTH_URL}/dashboard/nurse/subscription?status=success`,
      });
    } catch (error: any) {
      console.error('SafePay error:', error);
      return NextResponse.json({ 
        error: error.message || 'Payment gateway configuration error. Please contact support.' 
      }, { status: 500 });
    }

    // Update subscription with SafePay details
    await prisma.nurseSubscription.update({
      where: { id: subscription.id },
      data: { 
        xpayOrderId: safePayOrder.token,
        xpaySubscriptionId: safePayOrder.token,
      },
    });

    return NextResponse.json({ 
      success: true,
      paymentUrl: safePayOrder.checkout_url,
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create subscription' 
    }, { status: 500 });
  }
}
