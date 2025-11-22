import { prisma } from '@/lib/prisma';
import { verifySafePayWebhook } from '@/lib/safepay';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-sfpy-signature') || '';

    console.log('SafePay Webhook received:', body);

    // Verify webhook signature
    if (signature && !verifySafePayWebhook(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(body);
    console.log('SafePay Webhook payload:', JSON.stringify(payload, null, 2));

    // Handle subscription events
    if (payload.event) {
      const { event, data } = payload;
      
      switch (event) {
        case 'subscription.activated':
        case 'subscription.created':
        case 'payment.succeeded':
          await handlePaymentSuccess(data);
          break;

        case 'subscription.cancelled':
        case 'subscription.payment_failed':
        case 'payment.failed':
          await handlePaymentFailed(data);
          break;

        default:
          console.log('Unhandled webhook event:', event);
      }
    } else {
      // Legacy format
      const { token, state, reference, amount } = payload.data || payload;
      
      switch (state) {
        case 'PAID':
          await handlePaymentSuccess({ token, reference, amount: amount / 100 });
          break;

        case 'FAILED':
        case 'CANCELLED':
          await handlePaymentFailed({ token });
          break;

        default:
          console.log('Unhandled payment state:', state);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(data: any) {
  const token = data.token || data.tracker || data.id;
  const reference = data.reference || data.transaction_id || token;
  const amount = data.amount ? (data.amount / 100) : 0;

  console.log('Processing payment success:', { token, reference, amount });

  const subscription = await prisma.nurseSubscription.findFirst({
    where: { 
      OR: [
        { xpayOrderId: token },
        { xpaySubscriptionId: token },
        { id: token },
      ]
    },
    include: { plan: true },
  });

  if (!subscription) {
    console.error('Subscription not found for token:', token);
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

  console.log('✅ Subscription activated:', subscription.id);
}

async function handlePaymentFailed(data: any) {
  const token = data.token || data.tracker || data.id;
  
  console.log('Processing payment failure:', { token });

  const subscription = await prisma.nurseSubscription.findFirst({
    where: { 
      OR: [
        { xpayOrderId: token },
        { xpaySubscriptionId: token },
        { id: token },
      ]
    },
  });

  if (!subscription) {
    console.error('Subscription not found for token:', token);
    return;
  }

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

  console.log('❌ Payment failed:', subscription.id);
}
