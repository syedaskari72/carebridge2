import { prisma } from '@/lib/prisma';
import { verifySafePayWebhook } from '@/lib/safepay';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-sfpy-signature') || '';

    // Verify webhook signature
    if (signature && !verifySafePayWebhook(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(body);
    const { 
      data: {
        token,
        state,
        reference,
        amount,
      }
    } = payload;

    console.log('SafePay Webhook:', { token, state, reference });

    // Handle different payment states
    switch (state) {
      case 'PAID':
        await handlePaymentSuccess(token, reference, amount / 100); // Convert from paisas
        break;

      case 'FAILED':
      case 'CANCELLED':
        await handlePaymentFailed(token);
        break;

      default:
        console.log('Unhandled payment state:', state);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(token: string, reference: string, amount: number) {
  const subscription = await prisma.nurseSubscription.findFirst({
    where: { 
      OR: [
        { xpayOrderId: token },
        { xpaySubscriptionId: token },
      ]
    },
    include: { plan: true },
  });

  if (!subscription) {
    console.error('Subscription not found:', token);
    return;
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.nurseSubscription.update({
    where: { id: subscription.id },
    data: {
      status: 'ACTIVE',
      xpayTransactionId: reference,
      startDate: now,
      endDate,
      nextBillingDate: endDate,
      lastPaymentDate: now,
      lastPaymentAmount: amount,
      lastRenewalDate: now,
      bookingsUsed: 0,
      failedPayments: 0,
    },
  });

  console.log('Subscription activated:', subscription.id);
}

async function handlePaymentFailed(token: string) {
  const subscription = await prisma.nurseSubscription.findFirst({
    where: { 
      OR: [
        { xpayOrderId: token },
        { xpaySubscriptionId: token },
      ]
    },
  });

  if (!subscription) return;

  await prisma.nurseSubscription.update({
    where: { id: subscription.id },
    data: {
      status: 'PAYMENT_FAILED',
      failedPayments: { increment: 1 },
    },
  });

  if (subscription.failedPayments >= 2) {
    await prisma.nurseSubscription.update({
      where: { id: subscription.id },
      data: { status: 'CANCELLED' },
    });
  }

  console.log('Payment failed:', subscription.id);
}
