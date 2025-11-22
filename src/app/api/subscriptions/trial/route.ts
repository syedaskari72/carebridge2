import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
      include: { 
        subscriptions: {
          include: { plan: true }
        } 
      },
    });

    if (!nurse) {
      return NextResponse.json({ error: 'Nurse profile not found' }, { status: 404 });
    }

    // Check if already had trial
    const hadTrial = nurse.subscriptions.some(sub => sub.plan?.isTrial);
    if (hadTrial) {
      return NextResponse.json({ error: 'Trial already used' }, { status: 400 });
    }

    const trialPlan = await prisma.subscriptionPlan.findFirst({
      where: { isTrial: true, isActive: true },
    });

    if (!trialPlan) {
      return NextResponse.json({ error: 'Trial plan not available' }, { status: 404 });
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + (trialPlan.trialDays || 14));

    const subscription = await prisma.nurseSubscription.create({
      data: {
        nurseId: nurse.id,
        planId: trialPlan.id,
        status: 'TRIAL',
        bookingLimit: trialPlan.bookingLimit,
        startDate: new Date(),
        trialEndsAt,
        endDate: trialEndsAt,
      },
      include: { plan: true },
    });

    return NextResponse.json({ 
      success: true, 
      subscription,
      message: `Trial started! You have ${trialPlan.bookingLimit} bookings for ${trialPlan.trialDays} days.`
    });
  } catch (error) {
    console.error('Trial start error:', error);
    return NextResponse.json({ error: 'Failed to start trial' }, { status: 500 });
  }
}
